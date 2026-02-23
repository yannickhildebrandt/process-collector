"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ConfigChatInterface } from "@/components/projects/config-chat-interface";
import { ConfigPreviewPanel } from "@/components/projects/config-preview-panel";
import { MessageSquare, ArrowLeft } from "lucide-react";
import type { ProjectConfigurationData } from "@/lib/validators/config-schema";

interface ProcessCategory {
  key: string;
  labelDe: string;
  labelEn: string;
}

export default function ProjectSettingsPage() {
  const t = useTranslations("projects");
  const tChat = useTranslations("configChat");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [version, setVersion] = useState(1);
  const [categories, setCategories] = useState<ProcessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfigChat, setShowConfigChat] = useState(false);
  const [extractedConfig, setExtractedConfig] =
    useState<ProjectConfigurationData | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.project?.configuration) {
          setCategories(data.project.configuration.processCategories || []);
          setVersion(data.project.configuration.version);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const addCategory = () => {
    setCategories([...categories, { key: "", labelDe: "", labelEn: "" }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (
    index: number,
    field: keyof ProcessCategory,
    value: string
  ) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/configuration`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          configuration: {
            industryClassification: { sector: "TODO" },
            processCategories: categories.filter((c) => c.key.trim()),
          },
        }),
      });

      if (res.status === 409) {
        toast.error(t("configConflict"));
        const data = await res.json();
        setVersion(data.currentVersion);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("saveError"));
        return;
      }

      const data = await res.json();
      setVersion(data.configuration.version);
      toast.success(t("configSaved"));
      router.push(`/${locale}/projects/${projectId}`);
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyConfig = useCallback(async () => {
    if (!extractedConfig) return;
    setIsApplying(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/configure-chat/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            configuration: extractedConfig,
            version,
          }),
        }
      );

      if (res.status === 409) {
        toast.error(t("configConflict"));
        return;
      }

      if (!res.ok) {
        toast.error(tChat("applyError"));
        return;
      }

      const data = await res.json();
      setVersion(data.configuration.version);
      setCategories(data.configuration.processCategories || []);
      toast.success(tChat("applied"));
      setShowConfigChat(false);
      setExtractedConfig(null);
    } catch {
      toast.error(tChat("applyError"));
    } finally {
      setIsApplying(false);
    }
  }, [extractedConfig, projectId, version, t, tChat]);

  const handleToggleConfigChat = useCallback(() => {
    if (showConfigChat && extractedConfig) {
      if (!window.confirm(tChat("unsavedChanges"))) {
        return;
      }
    }
    setShowConfigChat(!showConfigChat);
    if (showConfigChat) {
      setExtractedConfig(null);
    }
  }, [showConfigChat, extractedConfig, tChat]);

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  if (showConfigChat) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{tChat("title")}</h1>
          <Button variant="outline" onClick={handleToggleConfigChat}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tChat("backToForm")}
          </Button>
        </div>

        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Chat area */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            <ConfigChatInterface
              projectId={projectId}
              onConfigExtracted={setExtractedConfig}
            />
          </div>

          {/* Preview panel */}
          <div className="w-80 overflow-y-auto">
            <ConfigPreviewPanel
              configuration={extractedConfig}
              onApply={handleApplyConfig}
              isApplying={isApplying}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("projectSettings")}</h1>
        <Button variant="outline" onClick={handleToggleConfigChat}>
          <MessageSquare className="h-4 w-4 mr-2" />
          {tChat("openChat")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("processCategories")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">{t("categoryKey")}</Label>
                <Input
                  value={cat.key}
                  onChange={(e) =>
                    updateCategory(index, "key", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("labelDe")}</Label>
                <Input
                  value={cat.labelDe}
                  onChange={(e) =>
                    updateCategory(index, "labelDe", e.target.value)
                  }
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t("labelEn")}</Label>
                  <Input
                    value={cat.labelEn}
                    onChange={(e) =>
                      updateCategory(index, "labelEn", e.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-auto"
                  onClick={() => removeCategory(index)}
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCategory}
          >
            {t("addCategory")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "..." : t("saveConfig")}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/projects/${projectId}`)}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
