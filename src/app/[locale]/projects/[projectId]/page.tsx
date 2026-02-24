"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteDialog } from "@/components/projects/invite-dialog";

interface ProjectDetail {
  id: string;
  name: string;
  industry: string;
  status: string;
  createdAt: string;
  configuration: {
    industryClassification: { sector: string; subSector?: string };
    processCategories: { key: string; labelDe: string; labelEn: string }[];
    customTerminology: Record<string, { de: string; en: string }> | null;
    version: number;
  } | null;
  members: { id: string; name: string; email: string; role: string }[];
}

interface ProcessEntry {
  id: string;
  title: string;
  status: string;
  createdBy: { id: string; displayName: string };
  createdAt: string;
}

export default function ProjectDetailPage() {
  const t = useTranslations("projects");
  const tp = useTranslations("processes");
  const locale = useLocale();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [processes, setProcesses] = useState<ProcessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((res) => res.json()),
      fetch(`/api/projects/${projectId}/processes`).then((res) => res.json()),
    ])
      .then(([projectData, processData]) => {
        setProject(projectData.project);
        setProcesses(processData.processes || []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  if (!project) {
    return <div className="text-muted-foreground">{t("notFound")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.industry}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/projects/${projectId}/settings`}>
            <Button variant="outline">{t("editConfig")}</Button>
          </Link>
          <InviteDialog projectId={projectId} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("projectInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("status")}</span>
              <Badge>{project.status}</Badge>
            </div>
            {project.configuration && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("sector")}</span>
                  <span>{project.configuration.industryClassification.sector}</span>
                </div>
                {project.configuration.industryClassification.subSector && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subSector")}</span>
                    <span>{project.configuration.industryClassification.subSector}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("created")}</span>
              <span>{new Date(project.createdAt).toLocaleDateString(locale)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("teamMembers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <span className="text-muted-foreground ml-2">{member.email}</span>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {project.configuration && project.configuration.processCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("processCategories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.configuration.processCategories.map((cat) => (
                <Badge key={cat.key} variant="secondary">
                  {locale === "de" ? cat.labelDe : cat.labelEn}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tp("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {processes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tp("noProcesses")}</p>
          ) : (
            <div className="space-y-2">
              {processes.map((proc) => (
                <Link
                  key={proc.id}
                  href={`/${locale}/projects/${projectId}/processes/${proc.id}`}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium">{proc.title}</span>
                    <p className="text-sm text-muted-foreground">
                      {tp("createdBy")}: {proc.createdBy.displayName}
                    </p>
                  </div>
                  <Badge variant="outline">{proc.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
