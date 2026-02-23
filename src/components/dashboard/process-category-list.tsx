"use client";

import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessCategory {
  key: string;
  labelDe: string;
  labelEn: string;
}

export function ProcessCategoryList({ categories }: { categories: ProcessCategory[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("categories")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat.key} variant="secondary" className="text-sm px-3 py-1">
              {locale === "de" ? cat.labelDe : cat.labelEn}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
