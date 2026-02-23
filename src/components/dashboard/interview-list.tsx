"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Interview {
  id: string;
  processCategory: string;
  title: string;
  status: "IN_PROGRESS" | "SUMMARY_REVIEW" | "COMPLETED" | "STALE";
  messageCount: number;
  updatedAt: string;
}

interface InterviewListProps {
  interviews: Interview[];
  projectId: string;
  showEmpty?: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  IN_PROGRESS: "default",
  SUMMARY_REVIEW: "secondary",
  COMPLETED: "outline",
  STALE: "destructive",
};

export function InterviewList({ interviews, projectId, showEmpty = false }: InterviewListProps) {
  const t = useTranslations("interview");
  const locale = useLocale();
  const router = useRouter();

  const activeInterviews = interviews.filter(
    (i) => i.status !== "COMPLETED"
  );

  if (activeInterviews.length === 0) {
    if (!showEmpty) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("noInterviews")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Interviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeInterviews.map((interview) => (
          <div
            key={interview.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{interview.title}</span>
                <Badge variant={statusVariant[interview.status] || "outline"}>
                  {t(
                    interview.status === "IN_PROGRESS"
                      ? "inProgress"
                      : interview.status === "SUMMARY_REVIEW"
                        ? "summaryReview"
                        : interview.status === "STALE"
                          ? "stale"
                          : "completed"
                  )}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {interview.processCategory} &middot;{" "}
                {interview.messageCount} {t("messages")} &middot;{" "}
                {t("lastActivity")}{" "}
                {new Date(interview.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(
                  `/${locale}/interview/${interview.id}?projectId=${projectId}`
                )
              }
            >
              {t("resume")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
