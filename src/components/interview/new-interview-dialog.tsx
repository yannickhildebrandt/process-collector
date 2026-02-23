"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  key: string;
  labelDe: string;
  labelEn: string;
}

interface NewInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  categories: Category[];
}

export function NewInterviewDialog({
  open,
  onOpenChange,
  projectId,
  categories,
}: NewInterviewDialogProps) {
  const t = useTranslations("interview");
  const locale = useLocale();
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!category || !title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processCategory: category, title: title.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create interview");
        return;
      }

      const data = await res.json();
      onOpenChange(false);
      router.push(`/${locale}/interview/${data.interview.id}?projectId=${projectId}`);
    } catch {
      toast.error("Failed to create interview");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("startNew")}</DialogTitle>
          <DialogDescription>{t("selectCategory")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("categoryLabel")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {locale === "de" ? cat.labelDe : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("titleLabel")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            {t("discard")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!category || !title.trim() || creating}
          >
            {creating ? "..." : t("startNew")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
