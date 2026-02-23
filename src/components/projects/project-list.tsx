"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  industry: string;
  status: string;
  memberCount: number;
  createdAt: string;
}

export function ProjectList({ projects }: { projects: Project[] }) {
  const locale = useLocale();
  const t = useTranslations("projects");

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("noProjects")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/${locale}/projects/${project.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                  {project.status === "ACTIVE" ? t("statusActive") : t("statusArchived")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{project.industry}</p>
                <p>
                  {project.memberCount} {t("members")}
                </p>
                <p>{new Date(project.createdAt).toLocaleDateString(locale)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
