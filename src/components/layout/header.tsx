"use client";

import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  const switchLocale = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(en|de)/, "");
    router.push(`/${newLocale}${pathWithoutLocale || "/"}`);
    setSheetOpen(false);
  };

  const userRole = (session?.user as { role?: string })?.role;

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="text-lg font-semibold">
            {t("common.appName")}
          </Link>
          {/* Desktop nav links */}
          {session && (
            <nav className="hidden md:flex items-center gap-4">
              {userRole === "CONSULTANT" && (
                <Link
                  href={`/${locale}/projects`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.projects")}
                </Link>
              )}
              {userRole === "EMPLOYEE" && (
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

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile hamburger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t("common.menu")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>{t("common.appName")}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-4">
              {session && userRole === "CONSULTANT" && (
                <Link
                  href={`/${locale}/projects`}
                  onClick={() => setSheetOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t("nav.projects")}
                </Link>
              )}
              {session && userRole === "EMPLOYEE" && (
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setSheetOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
              {session && (
                <Link
                  href={`/${locale}/settings`}
                  onClick={() => setSheetOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t("nav.settings")}
                </Link>
              )}

              <div className="border-t my-2" />

              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase">
                {t("common.language")}
              </p>
              <button
                onClick={() => switchLocale("en")}
                className="block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {t("common.english")}
              </button>
              <button
                onClick={() => switchLocale("de")}
                className="block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {t("common.german")}
              </button>

              {session && (
                <>
                  <div className="border-t my-2" />
                  <button
                    onClick={() => {
                      setSheetOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    {t("auth.signOut")}
                  </button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
