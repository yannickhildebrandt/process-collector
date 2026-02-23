<!--
Sync Impact Report
===================
- Version change: N/A (template) → 1.0.0
- Added principles:
  - I. AI-Guided, Not AI-Replaced
  - II. Self-Service by Design
  - III. Structured Output over Free Text
  - IV. Configuration as Data, Not Code
  - V. LLM-Agnostic by Architecture
- Added sections:
  - Technology Constraints
  - Development Workflow
  - Governance
- Removed sections: none
- Templates requiring updates:
  - `.specify/templates/plan-template.md` — ✅ no update needed (generic, constitution gates filled at plan time)
  - `.specify/templates/spec-template.md` — ✅ no update needed (generic template)
  - `.specify/templates/tasks-template.md` — ✅ no update needed (generic template)
- Follow-up TODOs: none
-->

# Process Collector Constitution

## Core Principles

### I. AI-Guided, Not AI-Replaced

The AI leads the interview and asks follow-up questions, but the
human employee provides the domain knowledge. The AI structures,
validates, and formats — it MUST NOT invent process steps, roles,
or system details that the user did not provide. Every generated
artifact MUST be traceable to explicit user input. When the AI
lacks information, it MUST ask rather than assume.

### II. Self-Service by Design

Clients use the tool independently over approximately one month,
without a consultant present. The UX MUST be intuitive enough for
non-technical employees who have no training beyond a brief
onboarding. All flows MUST be completable without external help.
Error states MUST guide users toward resolution, never leave them
stuck. Session continuity MUST allow users to pause and resume
interviews at any point.

### III. Structured Output over Free Text

Every process capture MUST produce a validated, structured artifact
consisting of a Markdown process description and an editable BPMN
diagram. Outputs MUST be immediately usable in a consulting
workshop — no manual post-processing required. The BPMN diagram
MUST conform to BPMN 2.0 standard and be editable in bpmn.js.
Free-text notes are acceptable as intermediate state during an
interview but MUST NOT be the final deliverable.

### IV. Configuration as Data, Not Code

Each client project MUST be configurable via a data-driven setup
(industry, process categories, interview templates, terminology).
There MUST NOT be a separate code branch, fork, or deployment per
customer. All customer-specific behavior MUST be driven by
configuration data. Adding a new client engagement MUST NOT require
a code change or redeployment.

### V. LLM-Agnostic by Architecture

The LLM provider MUST be abstracted from day one behind a clean
interface boundary. Swapping the underlying LLM provider (e.g.,
Claude to GPT to Gemini) MUST NOT require architectural changes —
only adapter-level code and configuration. No LLM-vendor-specific
concepts (tool schemas, message formats, token counting) may leak
into business logic. Prompt templates MUST be provider-neutral.

## Technology Constraints

**Confirmed decisions:**
- **Platform**: Browser-based web application
- **BPMN Editor**: bpmn.js (Camunda, open source) for diagram
  rendering and editing
- **LLM Integration**: API-based LLM with abstraction layer;
  Claude API recommended as initial provider
- **Hosting**: EU-based hosting preferred (GDPR compliance)

**Open decisions (to be resolved in feature specs):**
- Frontend framework (React, Vue, Svelte, etc.)
- Backend language and framework
- Database technology
- Authentication and authorization approach
- Specific EU hosting provider

All technology choices MUST be justified against the five core
principles. In particular, any dependency MUST NOT violate
Principle V (LLM-Agnostic) or Principle IV (Configuration as Data).

## Development Workflow

- Features are specified before implementation using the speckit
  workflow: specify → clarify → plan → tasks → implement.
- Each feature MUST be independently deliverable and testable as
  defined by its user stories.
- All process interview outputs MUST be validated against BPMN 2.0
  conformance before being presented to the user.
- Configuration schemas MUST be validated at startup; invalid
  client configurations MUST produce clear error messages, not
  silent failures.
- LLM abstraction layer MUST include integration tests that verify
  provider-swap capability with at least a mock provider.

## Governance

This constitution supersedes all other development practices for
the Process Collector project. All feature specifications, plans,
and implementation decisions MUST be checked against these
principles.

**Amendment procedure:**
1. Propose the change with rationale in a pull request modifying
   this file.
2. Document impact on existing features and in-flight work.
3. Version bump follows semantic versioning:
   - MAJOR: Principle removal or backward-incompatible redefinition.
   - MINOR: New principle added or existing principle materially
     expanded.
   - PATCH: Clarification, wording, or non-semantic refinement.
4. After merge, run `/speckit.analyze` to verify cross-artifact
   consistency.

**Compliance:** Every feature spec and plan MUST include a
Constitution Check section verifying alignment with all five
principles. Deviations MUST be justified in the plan's Complexity
Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
