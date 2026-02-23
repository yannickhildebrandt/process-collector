"use client";

import { useTranslations } from "next-intl";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  const t = useTranslations("projects");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createProject")}</h1>
      <ProjectForm />
    </div>
  );
}
