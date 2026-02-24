"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/processes/markdown-viewer";
import { BpmnViewer } from "@/components/processes/bpmn-viewer";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface SummaryJson {
  processName?: string;
  description?: string;
  trigger?: { description: string; type?: string };
  steps?: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    actor?: string;
    system?: string;
  }>;
  roles?: Array<{ name: string; description?: string }>;
  systems?: Array<{ name: string; description?: string }>;
  metrics?: Array<{ name: string; value?: string }>;
}

interface ProcessDetail {
  id: string;
  title: string;
  status: string;
  markdownContent: string | null;
  bpmnXml: string | null;
  summaryJson: SummaryJson | null;
  createdBy: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

function ProcessSummaryView({ summary }: { summary: SummaryJson }) {
  return (
    <div className="space-y-5">
      {summary.description && (
        <p className="text-sm text-muted-foreground">{summary.description}</p>
      )}

      {summary.trigger && (
        <section>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            Trigger
          </h3>
          <p className="text-sm mt-1">{summary.trigger.description}</p>
          {summary.trigger.type && (
            <Badge variant="outline" className="mt-1">
              {summary.trigger.type}
            </Badge>
          )}
        </section>
      )}

      {summary.steps && summary.steps.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            Steps ({summary.steps.length})
          </h3>
          <ol className="mt-2 space-y-3">
            {summary.steps.map((step, i) => (
              <li key={step.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{step.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {step.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {step.description}
                    </p>
                    {step.actor && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">Actor:</span>{" "}
                        {step.actor}
                      </p>
                    )}
                    {step.system && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">System:</span>{" "}
                        {step.system}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {summary.roles && summary.roles.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            Roles
          </h3>
          <div className="mt-2 space-y-1.5">
            {summary.roles.map((role) => (
              <div key={role.name} className="text-sm">
                <span className="font-medium">{role.name}</span>
                {role.description && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {role.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.systems && summary.systems.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            Systems
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {summary.systems.map((sys) => (
              <Badge key={sys.name} variant="secondary">
                {sys.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {summary.metrics && summary.metrics.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            Metrics
          </h3>
          <ul className="mt-2 space-y-1">
            {summary.metrics.map((metric) => (
              <li key={metric.name} className="text-sm">
                <span className="font-medium">{metric.name}</span>
                {metric.value && (
                  <span className="text-muted-foreground">
                    : {metric.value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function ProcessDetailPage() {
  const t = useTranslations("processes");
  const locale = useLocale();
  const params = useParams();
  const projectId = params.projectId as string;
  const processId = params.processId as string;

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"diagram" | "documentation">(
    "diagram"
  );

  useEffect(() => {
    fetch(`/api/projects/${projectId}/processes/${processId}`)
      .then((res) => res.json())
      .then((data) => setProcess(data.process))
      .finally(() => setLoading(false));
  }, [projectId, processId]);

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  if (!process) {
    return <div className="text-muted-foreground">Process not found.</div>;
  }

  const hasBpmn = !!process.bpmnXml;
  const hasContent = !!process.summaryJson || !!process.markdownContent;
  const hasBoth = hasBpmn && hasContent;
  const hasNeither = !hasBpmn && !hasContent;

  const sidebarContent = process.summaryJson ? (
    <ProcessSummaryView summary={process.summaryJson} />
  ) : process.markdownContent ? (
    <MarkdownViewer content={process.markdownContent} />
  ) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{process.title}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>
                {t("createdBy")}: {process.createdBy.displayName}
              </span>
              <Badge variant="outline">{process.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tab bar — only when both content types exist */}
      {hasBoth && (
        <div className="border-b lg:hidden">
          <div className="flex">
            <button
              className={cn(
                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "diagram"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
              onClick={() => setActiveTab("diagram")}
            >
              {t("tabDiagram")}
            </button>
            <button
              className={cn(
                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "documentation"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
              onClick={() => setActiveTab("documentation")}
            >
              {t("tabDocumentation")}
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      {hasNeither ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("noContent")}</p>
        </div>
      ) : hasBoth ? (
        <div className="flex flex-1 overflow-hidden">
          <div
            className={cn(
              "flex-1 min-w-0 overflow-hidden",
              activeTab !== "diagram" && "hidden lg:block"
            )}
          >
            <BpmnViewer xml={process.bpmnXml!} height="100%" />
          </div>
          <div
            className={cn(
              "overflow-y-auto p-6",
              activeTab === "documentation"
                ? "flex-1 lg:flex-none lg:w-96 lg:border-l"
                : "hidden lg:block lg:w-96 lg:border-l"
            )}
          >
            {sidebarContent}
          </div>
        </div>
      ) : hasBpmn ? (
        <div className="flex-1 min-w-0 overflow-hidden">
          <BpmnViewer xml={process.bpmnXml!} height="100%" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">{sidebarContent}</div>
        </div>
      )}
    </div>
  );
}
