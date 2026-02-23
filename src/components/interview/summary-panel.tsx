"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateBpmnXml } from "@/lib/interview/bpmn-generator";
import type { ProcessSummary as ProcessSummaryType } from "@/lib/interview/schemas";
import dynamic from "next/dynamic";

const BpmnViewer = dynamic(
  () =>
    import("@/components/processes/bpmn-viewer").then((mod) => mod.BpmnViewer),
  { ssr: false }
);

interface ProcessSummary {
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
    conditions?: Array<{ condition: string; nextStep: string }>;
    nextSteps?: string[];
  }>;
  roles?: Array<{ name: string; description?: string }>;
  systems?: Array<{ name: string; description?: string }>;
  metrics?: Array<{ name: string; value?: string }>;
}

interface SummaryPanelProps {
  summary: ProcessSummary | null;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  const t = useTranslations("interview");

  const bpmnXml = useMemo(() => {
    if (!summary?.steps || summary.steps.length === 0) return null;
    try {
      return generateBpmnXml(summary as ProcessSummaryType);
    } catch (e) {
      console.error("[SummaryPanel] BPMN generation failed:", e);
      return null;
    }
  }, [summary]);

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("summaryPanel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The summary will appear here as you describe your process.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("summaryPanel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.processName && (
            <div>
              <h4 className="text-sm font-semibold">{summary.processName}</h4>
              {summary.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {summary.description}
                </p>
              )}
            </div>
          )}

          {summary.trigger && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Trigger
              </h4>
              <p className="text-sm mt-1">{summary.trigger.description}</p>
              {summary.trigger.type && (
                <Badge variant="outline" className="mt-1">
                  {summary.trigger.type}
                </Badge>
              )}
            </div>
          )}

          {summary.steps && summary.steps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Steps ({summary.steps.length})
              </h4>
              <ol className="mt-1 space-y-2">
                {summary.steps.map((step, i) => (
                  <li key={step.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{step.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {step.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground ml-5 text-xs">
                      {step.description}
                    </p>
                    {step.actor && (
                      <p className="text-muted-foreground ml-5 text-xs">
                        Actor: {step.actor}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {summary.roles && summary.roles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Roles
              </h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {summary.roles.map((role) => (
                  <Badge key={role.name} variant="secondary">
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {summary.systems && summary.systems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Systems
              </h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {summary.systems.map((sys) => (
                  <Badge key={sys.name} variant="outline">
                    {sys.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {summary.metrics && summary.metrics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Metrics
              </h4>
              <ul className="mt-1 space-y-1">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live BPMN Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("bpmnSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          {bpmnXml ? (
            <div className="h-[300px] overflow-hidden">
              <BpmnViewer xml={bpmnXml} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("bpmnPlaceholder")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
