"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./message-bubble";
import { SendHorizontal, RotateCcw, AlertCircle } from "lucide-react";

interface ExistingMessage {
  id: string;
  role: "ASSISTANT" | "USER";
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  interviewId: string;
  projectId: string;
  existingMessages: ExistingMessage[];
  onNewMessage?: () => void;
  disabled?: boolean;
}

function getTextContent(message: {
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): string {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text || "")
      .join("");
  }
  return (message as { content?: string }).content || "";
}

export function ChatInterface({
  interviewId,
  projectId,
  existingMessages,
  onNewMessage,
  disabled = false,
}: ChatInterfaceProps) {
  const t = useTranslations("interview");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/interviews/${interviewId}/chat`,
      }),
    [projectId, interviewId]
  );

  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);

  const { messages, status, sendMessage } = useChat({
    transport,
    messages: existingMessages.map((m) => ({
      id: m.id,
      role:
        m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
      parts: [{ type: "text" as const, text: m.content }],
      createdAt: new Date(m.createdAt),
    })),
    onFinish() {
      setLastFailedInput(null);
      onNewMessage?.();
    },
    onError(error) {
      console.error("[Chat] Error:", error);
      // Preserve input text so user can retry
      if (inputValue.trim()) {
        setLastFailedInput(inputValue.trim());
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";
  const hasError = status === "error";

  const handleRetry = useCallback(async () => {
    if (!lastFailedInput) return;
    const msg = lastFailedInput;
    setLastFailedInput(null);
    setInputValue("");
    await sendMessage({ text: msg });
  }, [lastFailedInput, sendMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isBusy || disabled) return;

    const msg = inputValue.trim();
    setInputValue("");
    await sendMessage({ text: msg });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {t("aiGreeting")}
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role === "assistant" ? "ASSISTANT" : "USER"}
            content={getTextContent(message)}
            createdAt={message.createdAt?.toISOString()}
          />
        ))}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="text-xs font-medium mb-1 opacity-70">
                AI Assistant
              </div>
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          </div>
        )}
        {hasError && (
          <div className="flex justify-center px-4">
            <div className="flex items-center gap-3 bg-destructive/10 text-destructive rounded-lg px-4 py-3 max-w-md">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="flex-1 text-sm">{t("errorOccurred")}</div>
              {lastFailedInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="shrink-0"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t("retry")}
                </Button>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t("placeholder")}
          disabled={isBusy || disabled}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isBusy || disabled}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
