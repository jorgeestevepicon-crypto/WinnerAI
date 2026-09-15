# AI layer

## The abstraction

Every AI-generated piece of content in WinnerAI goes through one interface, defined in `lib/ai/types.ts`:

```ts
interface AIProvider {
  id: "demo" | "openai" | "anthropic";
  generateObject<T>(params: {
    taskId: AITaskId;      // e.g. "product_analysis", "brand", "ad_copy"
    schema: ZodType<T>;    // the exact shape the caller expects back
    system: string;        // system prompt, used by real providers only
    prompt: string;        // user prompt, used by real providers only
    input: unknown;        // structured input, used by the demo provider only
  }): Promise<T>;
}
```

`lib/ai/index.ts#getAIProvider()` picks the implementation:

```ts
if (env.ai.provider === "openai" && env.ai.apiKey) return openAIProvider;
if (env.ai.provider === "anthropic" && env.ai.apiKey) return anthropicProvider;
return demoAIProvider; // default — no credentials needed
```

No feature code ever imports a specific provider directly — always `getAIProvider()`. Switching `AI_PROVIDER` in `.env` changes every AI feature in the app at once.

## The three providers

- **`lib/ai/providers/demo-provider.ts`** — dispatches on `taskId` to a per-service generator function (registered by each service file via `registerDemoGenerator`), which produces realistic, product-aware, schema-shaped content deterministically, with zero network calls. Every service's demo generator lives next to its real prompt in `lib/ai/services/*.ts`.
- **`lib/ai/providers/openai-provider.ts`** — calls the Chat Completions API with `response_format: json_object`, using Zod v4's native `z.toJSONSchema()` to describe the expected shape in the system prompt.
- **`lib/ai/providers/anthropic-provider.ts`** — calls the Messages API the same way, stripping markdown code fences Claude sometimes wraps JSON in despite instructions not to.

**Every provider validates its output with `schema.safeParse()` before returning it.** A model's raw JSON — or a demo generator's output — is never trusted directly; a schema mismatch throws `AIProviderError` rather than silently passing through malformed data.

## Adding a new AI service

1. Create `lib/ai/services/<name>.ts`.
2. Define a Zod schema for the output.
3. Write `buildPrompt(input)` and a system prompt describing constraints (notably: never fabricate reviews/certifications/guaranteed outcomes).
4. Call `registerDemoGenerator("<task_id>", (input) => {...})` with a deterministic, input-aware demo implementation. Add the task id to the `AITaskId` union in `lib/ai/types.ts` first.
5. Export an async function that calls `getAIProvider().generateObject({...})`.
6. Wrap the call site in `runAIJob({ userId, type, input, run })` (`lib/ai/job-runner.ts`) if it should show up in `/admin/jobs`'s status/retry UI.

## Image generation

Separate abstraction (`lib/ai/image-provider.ts`, `AIImageProvider`) since it doesn't fit the structured-JSON shape:

- **Demo**: renders a labeled SVG placeholder ("AI Generated — Demo placeholder") as a data URI — no network call, and it's honest about being a placeholder rather than a real photo.
- **OpenAI (DALL-E)**: real image generation via `AI_IMAGE_PROVIDER=openai` + `AI_IMAGE_API_KEY`.

## AI safety rules enforced throughout

- Every system prompt explicitly forbids fabricating reviews, testimonials, certifications, awards, or sales/revenue figures.
- The Store Builder's social proof section is a `z.literal(true)` `isPlaceholder` field in its own schema variant — it is structurally impossible for the AI (real or demo) to produce a social proof section that doesn't self-identify as a placeholder.
- Winning Scores, price recommendations and AI verdicts are always labeled as estimates in the UI, never presented as guarantees.
- The Growth Agent only ever suggests — `requiresConfirmation` flags anything that would touch pricing, spend or published content, and no recommendation executes automatically.
- The AI chat store editor (`lib/ai/services/store-edit.ts`) only ever returns a modified version of the same validated Store JSON document — never arbitrary code or markup.

## The AI Context Engine

`lib/ai/context.ts#buildAIContext({ userId, productId?, storeId? })` composes whatever's available — product details, its latest analysis (audience, angles, objections), linked store/brand, existing ad campaigns — into one object. This is what lets a user jump from a product straight into the Store Builder or Ad Studio without re-entering information the app already knows.
