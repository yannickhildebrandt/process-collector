"use client";

import { useTranslations } from "next-intl";

export function ProjectsEmptyState() {
  const t = useTranslations("projects");

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{t("noProjects")}</p>
    </div>
  );
}
