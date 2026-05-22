"use client";

import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { GoogleLoginPanel } from "./google-login-panel";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnUrl?: string;
}

export function LoginModal({ open, onOpenChange, returnUrl }: LoginModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden border-border p-0 sm:max-w-lg md:max-w-3xl">
        <DialogTitle className="sr-only">Sign in with Google</DialogTitle>
        <GoogleLoginPanel variant="modal" returnUrl={returnUrl} />
      </DialogContent>
    </Dialog>
  );
}
