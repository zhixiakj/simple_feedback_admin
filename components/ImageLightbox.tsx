"use client";

import { useEffect } from "react";

export default function ImageLightbox({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="反馈图片"
        className="max-h-full max-w-full cursor-zoom-out object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
