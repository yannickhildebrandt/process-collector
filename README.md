# Process Collector

An AI-guided business process capture platform. Consultants configure client projects, employees document their business processes through conversational AI interviews, and the system produces structured Markdown documentation and BPMN 2.0 diagrams automatically.

## The Idea

Many organizations struggle to document their internal business processes. Traditional approaches (workshops, manual documentation) are time-consuming and often produce inconsistent results.

**Process Collector** flips this: employees simply have a conversation with an AI interviewer that asks the right questions about triggers, steps, decisions, roles, systems, and metrics. The AI extracts a structured process summary in real-time and generates both human-readable documentation and machine-readable BPMN diagrams — no modeling expertise required.

Consultants manage projects, configure industry context and terminology, and review the captured processes.

## Features

### Working Now

- **Consultant authentication** (email/password) and **employee access** (magic links)
- **Project management** — create projects, invite employees, configure industry/categories/terminology
- **AI-guided interviews** — conversational process capture with streaming responses
- **Contextual AI greeting** — each interview starts with a personalized greeting referencing the process title, category, and industry
- **Live summary panel** — structured process summary updates in the sidebar during the interview (trigger, steps, roles, systems, metrics)
- **Live BPMN diagram** — BPMN viewer in the sidebar regenerates from the summary (with zoom/pan)
- **Pause & resume** — employees can leave and return to interviews
- **Interview confirmation** — review summary, then confirm to generate a ProcessEntry
- **Markdown & BPMN output** — completed processes stored as Markdown + BPMN XML
- **Consultant configuration chat** — AI-powered alternative to the settings form; describe the client's industry and the AI extracts structured configuration
- **Bilingual UI** — full German and English support (next-intl)
- **PII filtering** — sensitive data stripped before sending to LLM
- **Data-driven configuration** — industry classification, process categories, custom terminology, interview template refs

### Known Issues

- **Live BPMN update timing** — the BPMN diagram in the interview sidebar sometimes doesn't refresh after a message because the server-side summary extraction (a separate AI call) takes longer than the client polling window. Fix coming in the next version.

### Coming Up

- **BPMN viewer & editor** — full interactive BPMN modeler so consultants and employees can view, edit, and refine generated process models directly in the browser
- **UI refinements** — polish the overall user experience, improve layout and responsiveness, streamline navigation flows
- **Voice interviews** — option to conduct interviews via voice input/output, making process capture more natural and accessible
- **Deeper context-driven AI** — richer use of project configuration, past interviews, and organizational knowledge to make AI conversations more relevant and precise
- Improved BPMN live-update mechanism (SSE or callback-based instead of polling)
- End-to-end tests with Playwright
- Process comparison and versioning
- Multi-user collaboration on interviews
- Export to external BPMN tools

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Lucide icons |
| Backend | Next.js API Routes |
| AI | Vercel AI SDK v6, Anthropic Claude |
| Database | PostgreSQL 16, Prisma 6 |
| Auth | Better Auth (email/password + magic links) |
| BPMN | bpmn-js 18 |
| i18n | next-intl 4 (DE/EN) |
| Validation | Zod 4 |
| Testing | Vitest, Playwright |

## Project Structure

```
src/
  app/
    [locale]/
      dashboard/           # Employee dashboard — start interviews, view processes
      interview/[id]/      # Interview chat + live summary/BPMN sidebar
      projects/            # Consultant project management
        [id]/settings/     # Project config (form + AI chat)
        [id]/processes/    # Process viewer (Markdown + BPMN)
    api/
      auth/                # Better Auth endpoints
      projects/[id]/
        interviews/        # CRUD + chat + confirm + resume
        configure-chat/    # AI config chat + extract + apply
        processes/         # Process CRUD
        configuration/     # Project configuration
  components/
    interview/             # ChatInterface, SummaryPanel, MessageBubble
    processes/             # BpmnViewer, MarkdownViewer
    projects/              # ConfigChatInterface, ConfigPreviewPanel
    dashboard/             # InterviewList, WelcomeCard
    ui/                    # shadcn/ui primitives
  lib/
    interview/             # Prompt builder, summary extractor, BPMN generator,
                           # greeting generator, schemas, PII middleware
    config-chat/           # Config prompt builder, config extractor
    llm/                   # AI SDK provider, mock model, adapters
    validators/            # Zod schemas for config
  i18n/messages/           # en.json, de.json
prisma/                    # Schema + migrations + seed
specs/                     # Feature specifications (001, 002, 003)
tests/integration/         # Vitest integration tests
```

## Data Model

```
User (CONSULTANT | EMPLOYEE)
  |
  +-- ProjectMember --> Project
                          |
                          +-- ProjectConfiguration (industry, categories, terminology)
                          +-- InterviewSession
                          |     +-- InterviewMessage (role, content, orderIndex)
                          |     +-- currentSummaryJson (live ProcessSummary)
                          +-- ProcessEntry (markdownContent, bpmnXml)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or a PostgreSQL 16 instance
- An Anthropic API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd process-collector
npm install

# Start PostgreSQL
docker-compose up -d

# Configure environment
cp .env.example .env.local
# Edit .env.local:
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/process_collector"
#   BETTER_AUTH_SECRET="<random-secret>"
#   BETTER_AUTH_URL="http://localhost:3000"
#   ANTHROPIC_API_KEY="sk-ant-..."

# Run migrations and seed
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

### Seed Data

The seed creates a demo project with:
- **Consultant**: `consultant@demo.com` / `consultant123`
- **Employee**: `employee@client.com` (use magic link — printed to server console when no Resend API key is configured)

### Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm start          # Start production server
npm test           # Run integration tests (Vitest)
npm run lint       # Lint check
```

## Feature Development

This project uses a structured specification workflow (`.specify/`):

1. **`/speckit.specify`** — Write feature specification from a description
2. **`/speckit.clarify`** — Resolve ambiguities in the spec
3. **`/speckit.plan`** — Generate implementation plan, data model, API contracts
4. **`/speckit.tasks`** — Break plan into executable task list
5. **`/speckit.implement`** — Execute tasks phase by phase

### Completed Features

| # | Feature | Status |
|---|---------|--------|
| 001 | Platform Foundation | Implemented |
| 002 | AI-Guided Interview | Implemented |
| 003 | Interview Enhancements (BPMN, Greeting, Config Chat) | Implemented |

## Architecture Decisions

- **Conversation serialization for Anthropic**: `generateObject` uses assistant prefill, so conversations are serialized into a single prompt string (not passed as messages) to avoid Anthropic's "must end with user message" constraint.
- **Array schemas instead of records**: Anthropic rejects `z.record()` in JSON schemas. All structured extraction uses `z.array(z.object({...}))`.
- **bpmn-js is client-only**: Always loaded via `next/dynamic` with `ssr: false`.
- **Streaming + async extraction**: Chat responses stream via `streamText`. Summary extraction runs asynchronously in `onFinish` as a separate AI call.
- **Magic links for employees**: No passwords needed. When Resend is not configured, the link is printed to the server console.

## License

Private / All rights reserved.
