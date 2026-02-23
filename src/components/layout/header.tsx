"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  const switchLocale = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(en|de)/, "");
    router.push(`/${newLocale}${pathWithoutLocale || "/"}`);
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="text-lg font-semibold">
            {t("common.appName")}
          </Link>
          {session && (
            <nav className="flex items-center gap-4">
              {(session.user as { role?: string }).role === "CONSULTANT" && (
                <Link
                  href={`/${locale}/projects`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.projects")}
                </Link>
              )}
              {(session.user as { role?: string }).role === "EMPLOYEE" && (
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {locale === "de" ? "DE" : "EN"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => switchLocale("en")}>
                {t("common.english")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale("de")}>
                {t("common.german")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {session.user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/settings`}>
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  {t("auth.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
