"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { ProcessCategoryList } from "@/components/dashboard/process-category-list";
import { NewInterviewDialog } from "@/components/interview/new-interview-dialog";
import { InterviewList } from "@/components/dashboard/interview-list";

interface ProjectData {
  id: string;
  name: string;
  industry: string;
  configuration?: {
    processCategories: { key: string; labelDe: string; labelEn: string }[];
  };
}

interface InterviewData {
  id: string;
  processCategory: string;
  title: string;
  status: "IN_PROGRESS" | "SUMMARY_REVIEW" | "COMPLETED" | "STALE";
  messageCount: number;
  updatedAt: string;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.projects && data.projects.length > 0) {
          const proj = data.projects[0];
          // Fetch project details and interviews in parallel
          const [projectRes, interviewsRes] = await Promise.all([
            fetch(`/api/projects/${proj.id}`).then((r) => r.json()),
            fetch(`/api/projects/${proj.id}/interviews`).then((r) => r.json()),
          ]);
          if (projectRes?.project) {
            setProject(projectRes.project);
          }
          if (interviewsRes?.interviews) {
            setInterviews(interviewsRes.interviews);
          }
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

      {interviews.length > 0 && (
        <InterviewList interviews={interviews} projectId={project.id} />
      )}

      {project.configuration?.processCategories && (
        <ProcessCategoryList
          categories={project.configuration.processCategories}
        />
      )}

      <div className="flex justify-center">
        <Button size="lg" onClick={() => setDialogOpen(true)}>
          {t("startProcess")}
        </Button>
      </div>

      {project.configuration?.processCategories && (
        <NewInterviewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projectId={project.id}
          categories={project.configuration.processCategories}
        />
      )}
    </div>
  );
}
