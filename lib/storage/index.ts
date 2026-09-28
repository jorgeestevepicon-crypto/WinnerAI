import "server-only";
import { randomUUID } from "crypto";
import { env, integrations } from "@/config/env";

let clientPromise: Promise<import("@aws-sdk/client-s3").S3Client> | null = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = import("@aws-sdk/client-s3").then(
      ({ S3Client }) =>
        new S3Client({
          region: env.storage.region || "auto",
          endpoint: env.storage.endpoint,
          forcePathStyle: true,
          credentials: {
            accessKeyId: env.storage.accessKey!,
            secretAccessKey: env.storage.secretKey!,
          },
        })
    );
  }
  return clientPromise;
}

function extensionFromContentType(contentType: string | null): string {
  if (!contentType) return "bin";
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("quicktime")) return "mov";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "bin";
}

function publicUrlFor(key: string): string {
  return `${env.storage.publicUrl!.replace(/\/+$/, "")}/${key}`;
}

/**
 * Downloads a remote asset — an AI provider's own temporary URL (OpenAI
 * image links expire after about an hour, Runway video links after a
 * similar window) — and re-uploads it to our own S3/R2 bucket so it keeps
 * working after the provider's link dies. Falls back to returning the
 * original URL, unchanged, if storage isn't configured or anything goes
 * wrong: this must never block a generation that otherwise succeeded, and
 * never fabricate a URL that doesn't actually work.
 */
export async function persistRemoteAsset(sourceUrl: string, folder: string): Promise<string> {
  if (!integrations.s3StorageConfigured) return sourceUrl;
  if (sourceUrl.startsWith(env.storage.publicUrl!)) return sourceUrl;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) return sourceUrl;

    const contentType = response.headers.get("content-type");
    const buffer = Buffer.from(await response.arrayBuffer());
    const key = `${folder}/${randomUUID()}.${extensionFromContentType(contentType)}`;

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: env.storage.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      })
    );

    return publicUrlFor(key);
  } catch (error) {
    console.error("persistRemoteAsset: keeping original URL after upload failure", error);
    return sourceUrl;
  }
}
