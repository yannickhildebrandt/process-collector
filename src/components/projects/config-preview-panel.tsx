"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectConfigurationData } from "@/lib/validators/config-schema";

interface ConfigPreviewPanelProps {
  configuration: ProjectConfigurationData | null;
  onApply: () => void;
  isApplying: boolean;
}

export function ConfigPreviewPanel({
  configuration,
  onApply,
  isApplying,
}: ConfigPreviewPanelProps) {
  const t = useTranslations("configChat");

  if (!configuration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("previewTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("noConfig")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("previewTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Industry */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            {t("industrySector")}
          </h4>
          <p className="text-sm mt-1">
            {configuration.industryClassification.sector}
            {configuration.industryClassification.subSector && (
              <span className="text-muted-foreground">
                {" "}
                / {configuration.industryClassification.subSector}
              </span>
            )}
          </p>
        </div>

        {/* Categories */}
        {configuration.processCategories.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              {t("categories")}
            </h4>
            <div className="mt-1 space-y-1">
              {configuration.processCategories.map((cat) => (
                <div key={cat.key} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs font-mono">
                    {cat.key}
                  </Badge>
                  <span>
                    {cat.labelDe} / {cat.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terminology */}
        {configuration.customTerminology &&
          Object.keys(configuration.customTerminology).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                {t("terminology")}
              </h4>
              <table className="mt-1 w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left font-medium pr-2">
                      {t("term")}
                    </th>
                    <th className="text-left font-medium pr-2">
                      {t("german")}
                    </th>
                    <th className="text-left font-medium">
                      {t("english")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(configuration.customTerminology).map(
                    ([term, value]) => (
                      <tr key={term}>
                        <td className="pr-2 font-mono text-xs">{term}</td>
                        <td className="pr-2">{value.de}</td>
                        <td>{value.en}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* Template Refs */}
        {configuration.interviewTemplateRefs &&
          configuration.interviewTemplateRefs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                {t("templateRefs")}
              </h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {configuration.interviewTemplateRefs.map((ref) => (
                  <Badge key={ref} variant="secondary">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        <Button
          onClick={onApply}
          disabled={isApplying}
          className="w-full mt-4"
        >
          {isApplying ? t("applying") : t("applyConfig")}
        </Button>
      </CardContent>
    </Card>
  );
}
