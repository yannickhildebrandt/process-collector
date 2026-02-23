"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { ProcessCategoryList } from "@/components/dashboard/process-category-list";

interface ProjectData {
  id: string;
  name: string;
  industry: string;
  configuration?: {
    processCategories: { key: string; labelDe: string; labelEn: string }[];
  };
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          // Employee sees only their single assigned project
          const proj = data.projects[0];
          // Fetch full project details with configuration
          return fetch(`/api/projects/${proj.id}`).then((r) => r.json());
        }
        return null;
      })
      .then((data) => {
        if (data?.project) {
          setProject(data.project);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("noProject")}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <WelcomeCard
        userName={session?.user?.name || ""}
        projectName={project.name}
        industry={project.industry}
      />

      {project.configuration?.processCategories && (
        <ProcessCategoryList
          categories={project.configuration.processCategories}
        />
      )}

      <div className="flex justify-center">
        <Button size="lg" disabled title={t("comingSoon")}>
          {t("startProcess")}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t("comingSoon")}
      </p>
    </div>
  );
}
