"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/processes/markdown-viewer";
import { BpmnViewer } from "@/components/processes/bpmn-viewer";

interface ProcessDetail {
  id: string;
  title: string;
  status: string;
  markdownContent: string | null;
  bpmnXml: string | null;
  createdBy: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export default function ProcessDetailPage() {
  const t = useTranslations("processes");
  const locale = useLocale();
  const params = useParams();
  const projectId = params.projectId as string;
  const processId = params.processId as string;

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{process.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>
              {t("createdBy")}: {process.createdBy.displayName}
            </span>
            <Badge variant="outline">{process.status}</Badge>
          </div>
        </div>
        <Link href={`/${locale}/projects/${projectId}`}>
          <Button variant="outline">{t("backToProject")}</Button>
        </Link>
      </div>

      {process.markdownContent && (
        <Card>
          <CardHeader>
            <CardTitle>{t("markdownSection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownViewer content={process.markdownContent} />
          </CardContent>
        </Card>
      )}

      {process.bpmnXml && (
        <Card>
          <CardHeader>
            <CardTitle>{t("bpmnSection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BpmnViewer xml={process.bpmnXml} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
