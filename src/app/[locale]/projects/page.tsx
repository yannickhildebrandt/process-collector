"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/project-list";

interface Project {
  id: string;
  name: string;
  industry: string;
  status: string;
  memberCount: number;
  createdAt: string;
}

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const locale = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href={`/${locale}/projects/new`}>
          <Button>{t("newProject")}</Button>
        </Link>
      </div>
      {loading ? (
        <div className="text-muted-foreground">{t("loading")}</div>
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  );
}
