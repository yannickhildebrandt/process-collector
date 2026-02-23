import { LLMProvider, LLMRequest, LLMResponse } from "../types";

const INTERVIEW_RESPONSES = [
  "Hello! I'm here to help you document your business process. Let's get started.\n\nCould you tell me the name of the process you'd like to document, and what event or action triggers it?",
  "Thank you for that overview! Now, could you walk me through the main steps of this process from start to finish? Please describe them in the order they typically occur.",
  "That's very helpful. Who are the key people or roles involved in this process? What are their specific responsibilities at each step?",
  "Great. What IT systems, tools, or software are used during this process? For example, any databases, communication tools, or specialized applications?",
  "I see. Are there any decision points in this process where different paths could be taken? If so, what criteria determine which path is followed?",
  "Almost done! How do you measure the success of this process? Are there any key metrics or KPIs that are tracked?",
  "Thank you for all this detailed information! I believe I have a comprehensive understanding of your process now. I'd suggest we review the summary to make sure everything is captured accurately. You can click 'Request Summary' when you're ready.",
];

export class MockAdapter implements LLMProvider {
  providerKey = "mock";

  private cannedResponse: string;
  private available: boolean;
  private interviewAware: boolean;
  private callIndex: number;

  constructor(options?: {
    cannedResponse?: string;
    available?: boolean;
    interviewAware?: boolean;
  }) {
    this.cannedResponse =
      options?.cannedResponse ??
      "This is a mock response from the LLM abstraction layer.";
    this.available = options?.available ?? true;
    this.interviewAware = options?.interviewAware ?? false;
    this.callIndex = 0;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Simulate a small delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    let content: string;
    if (this.interviewAware) {
      content =
        INTERVIEW_RESPONSES[this.callIndex % INTERVIEW_RESPONSES.length];
      this.callIndex++;
    } else {
      content = this.cannedResponse;
    }

    const promptTokens = Math.ceil(request.prompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      provider: "mock",
      model: "mock-v1",
      usage: {
        promptTokens,
        completionTokens,
      },
      finishReason: "complete",
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }
}
