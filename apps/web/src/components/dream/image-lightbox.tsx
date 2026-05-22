"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LightboxImage = {
  src: string;
  title: string;
  subtitle?: string;
};

type Props = {
  image: LightboxImage | null;
  onClose: () => void;
};

export type { LightboxImage };

export function ImageLightbox({ image, onClose }: Props) {
  useEffect(() => {
    if (!image) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-background/95 text-foreground backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
    >
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">
            {image.title}
          </p>
          {image.subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {image.subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="icon" asChild>
            <a href={image.src} target="_blank" rel="noreferrer" aria-label="Open image in new tab">
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onClose} aria-label="Close image viewer">
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <button
        type="button"
        className="grid min-h-0 flex-1 place-items-center p-3 sm:p-6"
        onClick={onClose}
        aria-label="Close image viewer"
      >
        <img
          src={image.src}
          alt={image.title}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl outline outline-1 outline-black/10 dark:outline-white/10"
        />
      </button>
    </div>
  );
}
