"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  isExtracting?: boolean;
}

export function SummaryPanel({ summary, isExtracting }: SummaryPanelProps) {
  const t = useTranslations("interview");

  const [bpmnXml, setBpmnXml] = useState<string | null>(null);
  const [bpmnError, setBpmnError] = useState(false);

  function handleGenerateBpmn() {
    if (!summary?.steps || summary.steps.length === 0) return;
    setBpmnError(false);
    try {
      const xml = generateBpmnXml(summary as ProcessSummaryType);
      setBpmnXml(xml);
    } catch (e) {
      console.error("[SummaryPanel] BPMN generation failed:", e);
      setBpmnXml(null);
      setBpmnError(true);
    }
  }

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
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t("summaryPanel")}</CardTitle>
            {isExtracting && (
              <span className="flex items-center gap-1.5 text-xs text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                {t("summaryUpdating")}
              </span>
            )}
          </div>
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

      {/* On-demand BPMN Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("bpmnSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bpmnXml ? (
            <div className="h-[300px] overflow-hidden">
              <BpmnViewer xml={bpmnXml} />
            </div>
          ) : bpmnError ? (
            <button
              onClick={handleGenerateBpmn}
              className="w-full text-sm text-destructive hover:underline cursor-pointer text-left"
            >
              {t("bpmnError")}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              {summary.steps && summary.steps.length > 0
                ? t("bpmnPlaceholder")
                : t("bpmnNoSummary")}
            </p>
          )}
          {summary.steps && summary.steps.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleGenerateBpmn}>
              {bpmnXml ? t("bpmnRegenerate") : t("bpmnGenerate")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
