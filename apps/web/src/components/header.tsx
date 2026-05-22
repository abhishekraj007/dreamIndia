"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { MapPinned, Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const links = [
  { to: "/" as const, label: "Atlas" },
  { to: "/#transform" as const, label: "Transform" },
  { to: "/dashboard" as const, label: "Reports" },
  { to: "/docs" as const, label: "Plan" },
];

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-[#0d4f3b] text-white">
            <MapPinned className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            cockroachdreamindia
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {links.map(({ to, label }) => (
            <Link key={to} href={to} className="hover:text-[#0d4f3b]">
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
              onClick={() => router.push("/auth?redirectTo=/")}
              className="bg-[#e46d2d] text-white hover:bg-[#c75d25]"
            >
              <Sparkles className="size-4" />
              Sign in
            </Button>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>cockroachdreamindia</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 px-4">
                {links.map(({ to, label }) => (
                  <Link
                    key={to}
                    href={to}
                    className="rounded-md px-2 py-2 text-base font-medium hover:bg-slate-100"
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
