"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface BpmnViewerProps {
  xml: string;
}

export function BpmnViewer({ xml }: BpmnViewerProps) {
  const t = useTranslations("processes");
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !xml) return;

    let viewer: { destroy: () => void } | null = null;

    async function initViewer() {
      try {
        // Dynamic import to avoid SSR issues
        const { default: NavigatedViewer } = await import("bpmn-js/lib/NavigatedViewer");

        viewer = new NavigatedViewer({
          container: containerRef.current!,
        });

        await (viewer as unknown as { importXML: (xml: string) => Promise<unknown> }).importXML(xml);

        // Fit the diagram to the container
        const canvas = (viewer as unknown as { get: (name: string) => { zoom: (type: string) => void } }).get("canvas");
        canvas.zoom("fit-viewport");

        setLoading(false);
      } catch (err) {
        console.error("Failed to render BPMN diagram:", err);
        setError(true);
        setLoading(false);
      }
    }

    initViewer();

    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, [xml]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md bg-muted/50 text-muted-foreground">
        {t("bpmnUnavailable")}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md">
          {t("bpmnLoading")}
        </div>
      )}
      <div
        ref={containerRef}
        className="h-[500px] border rounded-md bg-white"
      />
    </div>
  );
}
