interface ProjectConfig {
  industry: string;
  sector?: string;
  processCategory: string;
  processTitle?: string;
  language: string;
  customTerminology?: Record<string, { de: string; en: string }>;
  interviewTemplateRefs?: string[];
}

/**
 * Builds the system prompt for the interview AI from project configuration.
 * Template follows prompt-contracts.md — parameterized by project config.
 */
export function buildSystemPrompt(config: ProjectConfig): string {
  const terminologySection = config.customTerminology
    ? Object.entries(config.customTerminology)
        .map(([key, value]) => {
          const term =
            config.language === "de" ? value.de : value.en;
          return `  - "${key}" → "${term}"`;
        })
        .join("\n")
    : "  (none specified)";

  return `You are a business process documentation assistant. Your role is to interview
an employee about a specific business process and capture their knowledge in
a structured way.

RULES:
- You MUST only ask questions and structure information the employee provides.
- You MUST NOT invent, assume, or fabricate any process steps, roles, systems,
  or details that the employee has not explicitly stated.
- When the employee's answer is vague or incomplete, ask a specific follow-up
  question to clarify.
- When you lack information about a process aspect, ask about it — never guess.
- Conduct the interview in ${config.language === "de" ? "German" : "English"}.
- Use the following terminology where applicable:
${terminologySection}

INTERVIEW STRUCTURE:
Guide the conversation through these areas (in a natural order, not rigidly):
1. Process trigger: What starts this process?
2. Main steps: What happens from start to finish?
3. Roles and responsibilities: Who is involved at each step?
4. Systems and tools: What IT systems or tools are used?
5. Decision points: Where are decisions made, and based on what criteria?
6. Metrics and KPIs: How is success measured?

INTERVIEW CONTEXT:
- Process title: ${config.processTitle ?? "Not specified"}
- Process category: ${config.processCategory}
- Industry: ${config.industry}
- Sector: ${config.sector ?? "General"}
${buildIndustryHints(config.industry)}
${config.interviewTemplateRefs?.length ? `\nINTERVIEW GUIDANCE:\nRefer to these templates or standards when asking questions:\n${config.interviewTemplateRefs.map((ref) => `  - ${ref}`).join("\n")}` : ""}
BEHAVIOR:
- Start with a friendly greeting and explain the interview purpose.
- Ask one question at a time.
- Acknowledge the employee's answers before moving on.
- When you've covered all areas, let the employee know you have enough
  information and suggest reviewing the summary.`;
}

function buildIndustryHints(industry: string): string {
  const hints: Record<string, string> = {
    Manufacturing:
      "When discussing this manufacturing process, consider asking about: production lines, quality control checkpoints, material handling, compliance with industry standards (ISO, etc.), and supply chain dependencies.",
    Finance:
      "When discussing this financial process, consider asking about: regulatory compliance requirements, audit trails, approval hierarchies, risk assessment steps, and data security measures.",
    Healthcare:
      "When discussing this healthcare process, consider asking about: patient safety protocols, regulatory compliance (HIPAA, etc.), clinical workflows, documentation requirements, and handoff procedures.",
    Technology:
      "When discussing this technology process, consider asking about: development workflows, deployment pipelines, monitoring and alerting, incident response, and change management procedures.",
    Retail:
      "When discussing this retail process, consider asking about: inventory management, customer touchpoints, POS systems, supply chain logistics, and seasonal variations.",
  };

  const hint = hints[industry];
  return hint ? `\nINDUSTRY-SPECIFIC GUIDANCE:\n${hint}` : "";
}

/**
 * Builds the recap prompt for resuming a stale interview.
 */
export function buildRecapPrompt(
  summaryJson: Record<string, unknown> | null
): string {
  const summaryText = summaryJson
    ? JSON.stringify(summaryJson, null, 2)
    : "No summary captured yet.";

  return `The employee is resuming this interview after a break.
Here is a summary of what was discussed so far:

${summaryText}

Provide a brief, friendly recap (2-3 sentences) of what was covered,
then continue the interview from where it left off. Identify what
areas still need to be explored.`;
}
