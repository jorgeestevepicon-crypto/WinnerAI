import type { AIProvider, AITaskId, GenerateObjectParams } from "@/lib/ai/types";
import { AIProviderError } from "@/lib/ai/types";

export type DemoGenerator = (input: unknown) => unknown;

// Each AI service registers its own demo generator here (see
// lib/ai/services/*.ts). Keeping the registry here (rather than importing
// every service into this file) avoids a circular-import cycle between the
// provider and the services that use it.
const registry = new Map<AITaskId, DemoGenerator>();

export function registerDemoGenerator(taskId: AITaskId, generator: DemoGenerator) {
  registry.set(taskId, generator);
}

export const demoAIProvider: AIProvider = {
  id: "demo",
  async generateObject<T>(params: GenerateObjectParams<T>): Promise<T> {
    const generator = registry.get(params.taskId);
    if (!generator) {
      throw new AIProviderError(`No demo generator registered for task "${params.taskId}".`, "demo");
    }

    const output = generator(params.input);
    const result = params.schema.safeParse(output);
    if (!result.success) {
      throw new AIProviderError(
        `Demo generator output for "${params.taskId}" did not match its schema: ${result.error.message}`,
        "demo",
        result.error
      );
    }
    return result.data;
  },
};
