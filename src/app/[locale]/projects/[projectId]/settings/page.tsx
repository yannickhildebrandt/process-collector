"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ProcessCategory {
  key: string;
  labelDe: string;
  labelEn: string;
}

export default function ProjectSettingsPage() {
  const t = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [version, setVersion] = useState(1);
  const [categories, setCategories] = useState<ProcessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const updateCategory = (index: number, field: keyof ProcessCategory, value: string) => {
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
            industryClassification: { sector: "TODO" }, // Would be loaded from current config
            processCategories: categories.filter((c) => c.key.trim()),
          },
        }),
      });

      if (res.status === 409) {
        toast.error(t("configConflict"));
        // Reload to get latest version
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

  if (loading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("projectSettings")}</h1>

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
                  onChange={(e) => updateCategory(index, "key", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("labelDe")}</Label>
                <Input
                  value={cat.labelDe}
                  onChange={(e) => updateCategory(index, "labelDe", e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t("labelEn")}</Label>
                  <Input
                    value={cat.labelEn}
                    onChange={(e) => updateCategory(index, "labelEn", e.target.value)}
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
          <Button type="button" variant="outline" size="sm" onClick={addCategory}>
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
