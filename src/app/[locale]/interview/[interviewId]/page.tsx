"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/interview/chat-interface";
import { SummaryPanel } from "@/components/interview/summary-panel";
import { ArrowLeft } from "lucide-react";

interface InterviewData {
  id: string;
  projectId: string;
  processCategory: string;
  title: string;
  status: "IN_PROGRESS" | "SUMMARY_REVIEW" | "COMPLETED" | "STALE";
  currentSummaryJson: Record<string, unknown> | null;
  messages: Array<{
    id: string;
    role: "ASSISTANT" | "USER";
    content: string;
    createdAt: string;
  }>;
}

export default function InterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("interview");

  const interviewId = params.interviewId as string;
  const projectId = searchParams.get("projectId") || "";

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInterview = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/interviews/${interviewId}`
      );
      if (res.ok) {
        const data = await res.json();
        setInterview(data.interview);
      }
    } catch (e) {
      console.error("Failed to fetch interview:", e);
    } finally {
      setLoading(false);
    }
  }, [projectId, interviewId]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  const handleRequestSummary = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/interviews/${interviewId}/request-summary`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setInterview((prev) =>
          prev
            ? {
                ...prev,
                status: data.interview.status,
                currentSummaryJson: data.interview.currentSummaryJson,
              }
            : null
        );
        toast.success("Summary generated for review");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to request summary");
      }
    } catch {
      toast.error("Failed to request summary");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/interviews/${interviewId}/confirm`,
        { method: "POST" }
      );
      if (res.ok) {
        toast.success(t("processCreated"));
        router.push(`/${locale}/dashboard`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to confirm");
      }
    } catch {
      toast.error("Failed to confirm");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackToInProgress = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      // Send a message to continue, which will set status back
      setInterview((prev) =>
        prev ? { ...prev, status: "IN_PROGRESS" } : null
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Refresh summary after each message exchange.
  // The server extracts the summary asynchronously in onFinish (another AI call
  // that takes ~6-10s), so we poll every 3s for up to 21s to ensure we catch it.
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNewMessage = useCallback(() => {
    // Cancel any existing poll cycle
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }

    let attempts = 0;
    const maxAttempts = 7; // 7 × 3s = 21s max

    const poll = () => {
      attempts++;
      fetchInterview();
      if (attempts < maxAttempts) {
        pollTimerRef.current = setTimeout(poll, 3000);
      } else {
        pollTimerRef.current = null;
      }
    };

    // First poll after 2s, then every 3s
    pollTimerRef.current = setTimeout(poll, 2000);
  }, [fetchInterview]);

  // Clean up poll timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-muted-foreground">Loading interview...</div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Interview not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{interview.title}</h1>
            <p className="text-sm text-muted-foreground">
              {interview.processCategory}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {interview.status === "IN_PROGRESS" && (
            <Button
              onClick={handleRequestSummary}
              disabled={actionLoading}
              variant="outline"
            >
              {t("requestSummary")}
            </Button>
          )}
          {interview.status === "SUMMARY_REVIEW" && (
            <>
              <Button
                onClick={handleBackToInProgress}
                disabled={actionLoading}
                variant="outline"
              >
                {t("requestChanges")}
              </Button>
              <Button onClick={handleConfirm} disabled={actionLoading}>
                {t("confirmSummary")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content: Chat + Summary panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface
            interviewId={interviewId}
            projectId={projectId}
            existingMessages={interview.messages}
            onNewMessage={handleNewMessage}
            disabled={interview.status === "COMPLETED"}
          />
        </div>

        {/* Summary sidebar */}
        <div className="w-80 border-l overflow-y-auto p-4 hidden lg:block">
          <SummaryPanel
            summary={
              interview.currentSummaryJson as Parameters<
                typeof SummaryPanel
              >[0]["summary"]
            }
          />
        </div>
      </div>
    </div>
  );
}
