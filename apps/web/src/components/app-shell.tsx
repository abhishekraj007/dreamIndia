"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import {
  Coins,
  Home,
  LayoutDashboard,
  Map as MapIcon,
  MapPinned,
  Menu,
  Settings,
  Sparkles,
  User2,
  WandSparkles,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useLoginModal } from "@/hooks/use-login-modal";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CreditsModal } from "@/components/credits-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** show on mobile bottom bar */
  mobile?: boolean;
};

const primaryNav: NavItem[] = [
  { href: "/", label: "Atlas", icon: Home, mobile: true },
  { href: "/atlas", label: "Map", icon: MapIcon, mobile: true },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    mobile: true,
  },
  { href: "/tutor", label: "Tutor", icon: Sparkles },
  { href: "/uploads", label: "Uploads", icon: WandSparkles },
  { href: "/pricing", label: "Pricing", icon: Coins },
];

const mobileNav = primaryNav.filter((item) => item.mobile);

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { data: session } = authClient.useSession();
  const { openLogin } = useLoginModal();

  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );
  const userCredits = useQuery(
    api.features.credits.queries.getUserCredits,
    isAuthenticated ? {} : "skip",
  );
  const premiumStatus = useQuery(
    api.features.premium.queries.isPremium,
    isAuthenticated ? {} : "skip",
  );

  const userName =
    userData?.profile?.name ||
    userData?.userMetadata?.name ||
    session?.user?.name ||
    "Account";
  const userEmail = userData?.userMetadata?.email || session?.user?.email || "";
  const userImage =
    userData?.userMetadata?.image || session?.user?.image || undefined;

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-2 px-3 sm:h-16 sm:px-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground sm:size-10">
              <MapPinned className="size-4 sm:size-5" />
            </span>
            <span className="hidden text-base font-semibold tracking-tight sm:inline">
              cockroachdreamindia
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href as "/"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:block">
              <LocaleSwitcher />
            </div>
            <ModeToggle />
            {isAuthenticated && (
              <>
                {!authLoading && userCredits !== undefined ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsOpen(true)}
                    className="hidden sm:inline-flex"
                  >
                    <Coins className="size-4" />
                    {userCredits?.credits ?? 0}
                  </Button>
                ) : (
                  <Skeleton className="hidden h-8 w-16 rounded-md sm:block" />
                )}
                {!premiumStatus?.isPremium && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push("/pricing")}
                    className="hidden sm:inline-flex"
                  >
                    Upgrade
                  </Button>
                )}
              </>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full outline-none ring-ring/40 focus-visible:ring-2"
                    aria-label="Account"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={userImage} alt={userName} />
                      <AvatarFallback>
                        {(userName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium leading-tight">
                      {userName}
                    </p>
                    {userEmail && (
                      <p className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setCreditsOpen(true)}>
                    <Coins className="size-4" />
                    Credits ({userCredits?.credits ?? 0})
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/dashboard" as "/"}>
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/settings" as "/"}>
                      <Settings className="size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => router.push("/auth"),
                        },
                      })
                    }
                  >
                    <User2 className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => openLogin(pathname || "/")}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles className="size-4" />
                Sign in
              </Button>
            )}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Navigate</SheetTitle>
                  <SheetDescription>Primary sections</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-3 pb-6">
                  {primaryNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href as "/"}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="mt-3 border-t border-border pt-3">
                    <Link
                      href={"/settings" as "/"}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Settings className="size-4" />
                      Settings
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
        {children}
      </main>

      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      >
        <ul className="mx-auto flex max-w-[640px] items-stretch justify-around px-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href as "/"}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-5", active ? "scale-110" : "")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <CreditsModal open={creditsOpen} onOpenChange={setCreditsOpen} />
    </div>
  );
}
