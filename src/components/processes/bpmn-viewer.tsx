"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface BpmnViewerProps {
  xml: string;
  height?: string;
  onViewerReady?: (viewer: unknown) => void;
}

export function BpmnViewer({ xml, height = "500px", onViewerReady }: BpmnViewerProps) {
  const t = useTranslations("processes");
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !xml) return;

    // Reset state on new XML
    setLoading(true);
    setError(false);

    let viewer: { destroy: () => void } | null = null;

    async function initViewer() {
      try {
        const { default: NavigatedViewer } = await import("bpmn-js/lib/NavigatedViewer");

        viewer = new NavigatedViewer({
          container: containerRef.current!,
        });

        await (viewer as unknown as { importXML: (xml: string) => Promise<unknown> }).importXML(xml);

        const canvas = (viewer as unknown as { get: (name: string) => { zoom: (type: string) => void } }).get("canvas");
        canvas.zoom("fit-viewport");

        setLoading(false);
        onViewerReady?.(viewer);
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
        onViewerReady?.(null);
      }
    };
  }, [xml, onViewerReady]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md bg-muted/50 text-muted-foreground">
        {t("bpmnUnavailable")}
      </div>
    );
  }

  const isFill = height === "100%";

  return (
    <div className={isFill ? "relative h-full" : "relative"}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md">
          {t("bpmnLoading")}
        </div>
      )}
      <div
        ref={containerRef}
        className="border rounded-md bg-white dark:bg-card"
        style={{ height }}
      />
    </div>
  );
}
