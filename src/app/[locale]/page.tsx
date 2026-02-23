"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultantLoginForm } from "@/components/auth/consultant-login-form";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicLinkError = searchParams.get("error");
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      const role = (session.user as { role?: string }).role;
      if (role === "CONSULTANT") {
        router.replace(`/${locale}/projects`);
      } else {
        router.replace(`/${locale}/dashboard`);
      }
    }
  }, [session, locale, router]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Process Collector</CardTitle>
        </CardHeader>
        <CardContent>
          {magicLinkError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {magicLinkError === "expired"
                ? t("magicLinkExpired")
                : t("magicLinkInvalid")}
            </div>
          )}
          <Tabs defaultValue="consultant">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consultant">
                {t("consultantLogin")}
              </TabsTrigger>
              <TabsTrigger value="employee">
                {t("employeeLogin")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="consultant" className="mt-4">
              <ConsultantLoginForm />
            </TabsContent>
            <TabsContent value="employee" className="mt-4">
              <MagicLinkForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
