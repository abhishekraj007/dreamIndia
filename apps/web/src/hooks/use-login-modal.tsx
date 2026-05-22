"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { LoginModal } from "@/components/login-modal";

type LoginModalContextValue = {
  open: boolean;
  returnUrl: string | undefined;
  openLogin: (returnUrl?: string) => void;
  setOpen: (open: boolean) => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | undefined>();

  const openLogin = useCallback((url?: string) => {
    setReturnUrl(url);
    setOpen(true);
  }, []);

  return (
    <LoginModalContext.Provider
      value={{ open, returnUrl, openLogin, setOpen }}
    >
      {children}
      <LoginModal open={open} onOpenChange={setOpen} returnUrl={returnUrl} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return context;
}
