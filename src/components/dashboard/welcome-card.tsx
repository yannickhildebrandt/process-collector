"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WelcomeCardProps {
  userName: string;
  projectName: string;
  industry: string;
}

export function WelcomeCard({ userName, projectName, industry }: WelcomeCardProps) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("welcome", { name: userName })}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-lg font-medium">{t("projectContext")}: {projectName}</p>
          <p className="text-muted-foreground">{industry}</p>
        </div>
      </CardContent>
    </Card>
  );
}
