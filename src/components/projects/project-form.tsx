"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
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

export function ProjectForm() {
  const t = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [sector, setSector] = useState("");
  const [subSector, setSubSector] = useState("");
  const [categories, setCategories] = useState<ProcessCategory[]>([
    { key: "", labelDe: "", labelEn: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addCategory = () => {
    setCategories([...categories, { key: "", labelDe: "", labelEn: "" }]);
  };

  const removeCategory = (index: number) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof ProcessCategory, value: string) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industry,
          configuration: {
            industryClassification: {
              sector: sector || industry,
              ...(subSector && { subSector }),
            },
            processCategories: categories.filter((c) => c.key.trim()),
          },
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        toast.warning(data.warning || t("duplicateName"));
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("createError"));
        return;
      }

      const data = await res.json();
      toast.success(t("created"));
      router.push(`/${locale}/projects/${data.project.id}`);
    } catch {
      toast.error(t("createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("projectDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("projectName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">{t("industry")}</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">{t("sector")}</Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subSector">{t("subSector")}</Label>
              <Input
                id="subSector"
                value={subSector}
                onChange={(e) => setSubSector(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("processCategories")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">{t("categoryKey")}</Label>
                <Input
                  value={cat.key}
                  onChange={(e) => updateCategory(index, "key", e.target.value)}
                  placeholder="e.g. procurement"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("labelDe")}</Label>
                <Input
                  value={cat.labelDe}
                  onChange={(e) => updateCategory(index, "labelDe", e.target.value)}
                  placeholder="Beschaffung"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t("labelEn")}</Label>
                  <Input
                    value={cat.labelEn}
                    onChange={(e) => updateCategory(index, "labelEn", e.target.value)}
                    placeholder="Procurement"
                  />
                </div>
                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-auto"
                    onClick={() => removeCategory(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCategory}>
            {t("addCategory")}
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? "..." : t("createProject")}
      </Button>
    </form>
  );
}
