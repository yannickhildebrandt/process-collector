"use client";

import { useTranslations } from "next-intl";

export function ProcessesEmptyState() {
  const t = useTranslations("processes");

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{t("noProcesses")}</p>
    </div>
  );
}
