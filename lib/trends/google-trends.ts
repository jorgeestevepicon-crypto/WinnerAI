import "server-only";
import https from "https";

/**
 * Google has no official public Trends API. This replicates the same two
 * undocumented `trends.google.com` endpoints the (long-abandoned)
 * `google-trends-api` npm package and Python's `pytrends` reverse-engineer
 * from the public Trends website — Google can change or rate-limit this at
 * any time since it isn't a supported integration surface. Every call here
 * is wrapped so a failure just means "no trend signal available" rather
 * than breaking product discovery (see computeWinningScore's partial-signal
 * handling).
 */

const HOST = "trends.google.com";

// Google 429s a fresh IP once, then accepts the request again if you send
// back the cookie it set on that 429 — same workaround google-trends-api
// uses. Cached per server instance, not per request.
let rateLimitCookie: string | undefined;

function httpsGet(path: string, qs: Record<string, string>, allowRetry = true): Promise<string> {
  const query = new URLSearchParams(qs).toString();
  const options: https.RequestOptions = {
    host: HOST,
    method: "GET",
    path: `${path}?${query}`,
    headers: rateLimitCookie ? { cookie: rateLimitCookie } : undefined,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode === 429 && allowRetry && res.headers["set-cookie"]?.[0]) {
        rateLimitCookie = res.headers["set-cookie"][0].split(";")[0];
        res.resume();
        httpsGet(path, qs, false).then(resolve, reject);
        return;
      }
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
    req.end();
  });
}

/** Strips Google's XSSI-protection prefix before the actual JSON body. */
function parseJsonBody(body: string): unknown {
  const start = body.indexOf("{");
  if (start === -1) throw new Error("Google Trends response had no JSON body");
  return JSON.parse(body.slice(start));
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

interface TimelinePoint {
  value?: number[];
}

/**
 * Real Google Trends interest for `keyword` over the last 90 days:
 * `trend` is the average of Google's own 0-100 relative-interest index over
 * that window; `growth` compares the most recent 30 days against the 30
 * before that, clamped to 0-100 (flat or declining interest scores 0, a
 * doubling of interest scores 100) — a genuine signal derived from real
 * search volume, not an invented number. Returns null (never a guess) if
 * the keyword has no data, or if this unofficial endpoint errors or
 * rate-limits.
 */
export async function getGoogleTrendsSignal(keyword: string, geo = ""): Promise<{ trend: number; growth: number } | null> {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const tz = String(now.getTimezoneOffset());

    const exploreBody = await httpsGet("/trends/api/explore", {
      hl: "en-US",
      tz,
      req: JSON.stringify({
        comparisonItem: [{ keyword, geo, time: `${formatDate(start)} ${formatDate(now)}` }],
        category: 0,
        property: "",
      }),
    });

    const explore = parseJsonBody(exploreBody) as {
      widgets?: Array<{ id?: string; request?: unknown; token?: string }>;
    };
    const widget = explore.widgets?.find((w) => w.id?.includes("TIMESERIES"));
    if (!widget?.request || !widget.token) return null;

    const dataBody = await httpsGet("/trends/api/widgetdata/multiline", {
      hl: "en-US",
      tz,
      req: JSON.stringify(widget.request),
      token: widget.token,
    });

    const data = parseJsonBody(dataBody) as { default?: { timelineData?: TimelinePoint[] } };
    const points = data.default?.timelineData ?? [];
    if (points.length === 0) return null;

    const values = points.map((p) => p.value?.[0] ?? 0);
    const recentWindow = values.slice(-30);
    const priorWindow = values.slice(-60, -30);
    const recentAvg = average(recentWindow.length ? recentWindow : values);
    const priorAvg = average(priorWindow);

    const trend = Math.round(recentAvg);
    let growth: number;
    if (priorAvg <= 0) {
      growth = recentAvg > 0 ? 100 : 0;
    } else {
      const percentChange = ((recentAvg - priorAvg) / priorAvg) * 100;
      growth = Math.round(Math.min(100, Math.max(0, percentChange)));
    }

    return { trend, growth };
  } catch (error) {
    console.error(`Google Trends lookup failed for "${keyword}" — skipping trend signal.`, error);
    return null;
  }
}
