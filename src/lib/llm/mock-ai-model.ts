import type { LanguageModel } from "ai";

const MOCK_RESPONSES = [
  "Thank you for sharing that! Let me ask you a few follow-up questions to better understand this process.\n\nCould you tell me more about what specific event or action triggers this process to begin?",
  "That's very helpful. Now, could you walk me through the main steps that happen from start to finish? Please describe them in the order they typically occur.",
  "Great, I'm getting a clearer picture. Who are the key people or roles involved in this process? What are their specific responsibilities?",
  "Thank you. What IT systems or tools are used during this process? For example, any software, databases, or communication tools?",
  "I see. Are there any decision points in this process where different paths could be taken? If so, what criteria determine which path is followed?",
  "Almost done! How do you measure the success of this process? Are there any key metrics or KPIs that are tracked?",
  "Thank you for all this detailed information! I believe I have a good understanding of the process now. I'd suggest we review the summary to make sure everything is captured correctly. You can click 'Request Summary' when you're ready.",
];

let callCount = 0;

/**
 * Creates a mock AI model for testing without a live API key.
 * Returns canned interview responses that cycle through the interview structure.
 */
export function createMockAIModel(): LanguageModel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    specificationVersion: "v2",
    provider: "mock",
    modelId: "mock-v1",
    defaultObjectGenerationMode: "json",

    async doGenerate(_params: unknown) {
      await new Promise((r) => setTimeout(r, 200));
      const response = MOCK_RESPONSES[callCount % MOCK_RESPONSES.length];
      callCount++;

      return {
        text: response,
        finishReason: "stop" as const,
        usage: {
          promptTokens: 100,
          completionTokens: Math.ceil(response.length / 4),
        },
        rawCall: {
          rawPrompt: null,
          rawSettings: {},
        },
      };
    },

    async doStream(_params: unknown) {
      const response = MOCK_RESPONSES[callCount % MOCK_RESPONSES.length];
      callCount++;

      return {
        stream: new ReadableStream({
          async start(controller) {
            const words = response.split(" ");
            for (let i = 0; i < words.length; i++) {
              const text = (i === 0 ? "" : " ") + words[i];
              controller.enqueue({
                type: "text-delta" as const,
                textDelta: text,
              });
              await new Promise((r) => setTimeout(r, 30));
            }
            controller.enqueue({
              type: "finish" as const,
              finishReason: "stop" as const,
              usage: {
                promptTokens: 100,
                completionTokens: Math.ceil(response.length / 4),
              },
            });
            controller.close();
          },
        }),
        rawCall: {
          rawPrompt: null,
          rawSettings: {},
        },
      };
    },
  } as unknown as LanguageModel;
}
