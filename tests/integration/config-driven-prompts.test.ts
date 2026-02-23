import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../../src/lib/interview/prompt-builder";

describe("Config-Driven Prompts", () => {
  it("produces different prompts for different industries", () => {
    const manufacturingPrompt = buildSystemPrompt({
      industry: "Manufacturing",
      sector: "Automotive",
      processCategory: "production",
      language: "en",
    });

    const financePrompt = buildSystemPrompt({
      industry: "Finance",
      sector: "Banking",
      processCategory: "compliance",
      language: "en",
    });

    expect(manufacturingPrompt).toContain("Manufacturing");
    expect(manufacturingPrompt).toContain("Automotive");
    expect(manufacturingPrompt).toContain("production");
    expect(manufacturingPrompt).toContain("quality control");

    expect(financePrompt).toContain("Finance");
    expect(financePrompt).toContain("Banking");
    expect(financePrompt).toContain("compliance");
    expect(financePrompt).toContain("regulatory");

    expect(manufacturingPrompt).not.toEqual(financePrompt);
  });

  it("applies custom terminology substitutions", () => {
    const prompt = buildSystemPrompt({
      industry: "Manufacturing",
      processCategory: "production",
      language: "de",
      customTerminology: {
        process: { de: "Vorgang", en: "Process" },
        step: { de: "Schritt", en: "Step" },
        department: { de: "Abteilung", en: "Department" },
      },
    });

    // German language selected, so German terms should be used
    expect(prompt).toContain('"Vorgang"');
    expect(prompt).toContain('"Schritt"');
    expect(prompt).toContain('"Abteilung"');
    expect(prompt).toContain("German");
  });

  it("includes English terminology for English language", () => {
    const prompt = buildSystemPrompt({
      industry: "Manufacturing",
      processCategory: "production",
      language: "en",
      customTerminology: {
        process: { de: "Vorgang", en: "Process" },
      },
    });

    expect(prompt).toContain('"Process"');
    expect(prompt).toContain("English");
  });

  it("includes interview template refs when configured", () => {
    const prompt = buildSystemPrompt({
      industry: "Finance",
      processCategory: "compliance",
      language: "en",
      interviewTemplateRefs: ["ISO 27001", "SOX Compliance Checklist"],
    });

    expect(prompt).toContain("ISO 27001");
    expect(prompt).toContain("SOX Compliance Checklist");
    expect(prompt).toContain("INTERVIEW GUIDANCE");
  });

  it("handles missing optional config gracefully", () => {
    const prompt = buildSystemPrompt({
      industry: "Technology",
      processCategory: "deployment",
      language: "en",
    });

    expect(prompt).toContain("Technology");
    expect(prompt).toContain("General"); // Default sector
    expect(prompt).toContain("(none specified)"); // No terminology
  });
});
