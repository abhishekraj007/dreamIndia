"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useLoginModal } from "@/hooks/use-login-modal";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { MapPinned, Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const links = [
  { to: "/" as const, label: "Atlas" },
  { to: "/atlas" as const, label: "Map" },
  { to: "/#transform" as const, label: "Transform" },
  { to: "/dashboard" as const, label: "Reports" },
  { to: "/docs" as const, label: "Plan" },
];

export default function Header() {
  const pathname = usePathname();
  const { openLogin } = useLoginModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MapPinned className="size-5" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight text-foreground sm:inline">
            cockroachdreamindia
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          {links.map(({ to, label }) => (
            <Link key={to} href={to} className="hover:text-primary">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          {session?.user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => authClient.signOut()}
            >
              Sign out
            </Button>
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
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>cockroachdreamindia</SheetTitle>
                <SheetDescription>Primary navigation links</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-3 px-4">
                {links.map(({ to, label }) => (
                  <Link
                    key={to}
                    href={to}
                    className="rounded-md px-2 py-2 text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
