"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { authClient, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const isDev = process.env.NODE_ENV === "development";

export function MagicLinkForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.signIn.magicLink({
        email,
      });
      setSent(true);
    } catch {
      setError(t("magicLinkInvalid"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(t("invalidCredentials"));
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {t("magicLinkSent")}
        </p>
        <Button
          variant="outline"
          onClick={() => setSent(false)}
          className="w-full"
        >
          {t("requestNewLink")}
        </Button>
      </div>
    );
  }

  if (isDev) {
    return (
      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emp-email">{t("email")}</Label>
          <Input
            id="emp-email"
            type="email"
            placeholder={t("enterEmail")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emp-password">{t("password")}</Label>
          <Input
            id="emp-password"
            type="password"
            placeholder={t("enterPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("signIn")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleMagicLink} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("employeeInstructions")}
      </p>
      <div className="space-y-2">
        <Label htmlFor="magic-email">{t("email")}</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder={t("enterEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "..." : t("sendMagicLink")}
      </Button>
    </form>
  );
}
