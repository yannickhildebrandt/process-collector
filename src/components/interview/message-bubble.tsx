"use client";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "ASSISTANT" | "USER" | "assistant" | "user";
  content: string;
  createdAt?: string;
}

export function MessageBubble({ role, content, createdAt }: MessageBubbleProps) {
  const isUser = role === "USER" || role === "user";

  return (
    <div
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className="text-xs font-medium mb-1 opacity-70">
          {isUser ? "You" : "AI Assistant"}
        </div>
        <div className="whitespace-pre-wrap text-sm">{content}</div>
        {createdAt && (
          <div className="text-xs opacity-50 mt-1">
            {new Date(createdAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
