import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../../src/lib/interview/prompt-builder";

describe("Greeting Generation", () => {
  it("includes process title in the system prompt for greeting context", () => {
    const prompt = buildSystemPrompt({
      industry: "Manufacturing",
      sector: "Automotive",
      processCategory: "procurement",
      processTitle: "Raw Materials Procurement",
      language: "en",
    });

    expect(prompt).toContain("Raw Materials Procurement");
    expect(prompt).toContain("procurement");
    expect(prompt).toContain("Manufacturing");
    expect(prompt).toContain("Automotive");
  });

  it("includes process title in German context", () => {
    const prompt = buildSystemPrompt({
      industry: "Manufacturing",
      sector: "Automotive",
      processCategory: "produktion",
      processTitle: "Rohstoffbeschaffung",
      language: "de",
      customTerminology: {
        process: { de: "Vorgang", en: "Process" },
      },
    });

    expect(prompt).toContain("Rohstoffbeschaffung");
    expect(prompt).toContain("produktion");
    expect(prompt).toContain('"Vorgang"');
    expect(prompt).toContain("German");
  });

  it("handles missing process title gracefully", () => {
    const prompt = buildSystemPrompt({
      industry: "Healthcare",
      processCategory: "patient-intake",
      language: "en",
    });

    expect(prompt).toContain("Not specified");
    expect(prompt).toContain("patient-intake");
    expect(prompt).toContain("Healthcare");
  });

  it("includes interview template refs in greeting context", () => {
    const prompt = buildSystemPrompt({
      industry: "Finance",
      sector: "Banking",
      processCategory: "compliance",
      processTitle: "KYC Verification",
      language: "en",
      interviewTemplateRefs: ["ISO 27001"],
    });

    expect(prompt).toContain("KYC Verification");
    expect(prompt).toContain("ISO 27001");
    expect(prompt).toContain("INTERVIEW GUIDANCE");
  });
});
