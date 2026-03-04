"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Progress = {
  chapterId: string;
  mode: "SCROLL" | "PAGINATED";
  pageIndex: number | null;
  scrollY: number | null;
  chapter?: { number: number | null; title: string | null } | null; // opcional se API mandar
};

export default function ContinueReading({ workId }: { workId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    fetch(`/api/progress?workId=${encodeURIComponent(workId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProgress(d.progress ?? null))
      .catch(() => setProgress(null));
  }, [workId]);

  if (!progress) return null;

  const qs =
    progress.mode === "PAGINATED"
      ? `?p=${progress.pageIndex ?? 0}`
      : `?s=${progress.scrollY ?? 0}`;

  const where =
    progress.mode === "PAGINATED"
      ? `Página ${(progress.pageIndex ?? 0) + 1}`
      : `Scroll ${progress.scrollY ?? 0}px`;

  const chapterLabel =
    progress.chapter?.number != null
      ? `Cap. ${progress.chapter.number}${progress.chapter.title ? ` — ${progress.chapter.title}` : ""}`
      : progress.chapter?.title
      ? `Capítulo — ${progress.chapter.title}`
      : null;

  return (
    <Link
      className="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2 hover:opacity-90"
      href={`/read/${progress.chapterId}${qs}`}
      title={chapterLabel ? `${chapterLabel} • ${where}` : where}
    >
      <span>Continuar lendo</span>
      <span className="text-xs opacity-80 hidden sm:inline">
        {chapterLabel ? `${chapterLabel} • ${where}` : where}
      </span>
    </Link>
  );
}