"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/interview/message-bubble";
import { SendHorizontal } from "lucide-react";
import type { ProjectConfigurationData } from "@/lib/validators/config-schema";

interface ConfigChatInterfaceProps {
  projectId: string;
  onConfigExtracted?: (config: ProjectConfigurationData) => void;
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

export function ConfigChatInterface({
  projectId,
  onConfigExtracted,
}: ConfigChatInterfaceProps) {
  const t = useTranslations("configChat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/configure-chat`,
      }),
    [projectId]
  );

  const { messages, status, sendMessage } = useChat({
    transport,
    async onFinish({ messages: allMessages }) {
      // After each AI response, try to extract configuration
      if (!onConfigExtracted) return;
      setIsExtracting(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/configure-chat/extract`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: allMessages.map((m) => ({
                role: m.role,
                content: getTextContent(m),
              })),
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.configuration) {
            onConfigExtracted(data.configuration);
          }
        }
      } catch {
        // Extraction failure is non-critical
      } finally {
        setIsExtracting(false);
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isBusy) return;
      const msg = inputValue.trim();
      setInputValue("");
      await sendMessage({ text: msg });
    },
    [inputValue, isBusy, sendMessage]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {t("greeting")}
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role === "assistant" ? "ASSISTANT" : "USER"}
            content={getTextContent(message)}
            createdAt={undefined}
          />
        ))}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          </div>
        )}
        {isExtracting && (
          <div className="text-center text-sm text-muted-foreground">
            {t("extracting")}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t("placeholder")}
          disabled={isBusy}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isBusy}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
