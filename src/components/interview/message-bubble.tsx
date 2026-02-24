"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  role: "ASSISTANT" | "USER" | "assistant" | "user";
  content: string;
  createdAt?: string;
}

export function MessageBubble({ role, content, createdAt }: MessageBubbleProps) {
  const isUser = role === "USER" || role === "user";

  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
        {createdAt && (
          <div className="text-xs opacity-50 mt-1">
            {new Date(createdAt).toLocaleTimeString()}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
