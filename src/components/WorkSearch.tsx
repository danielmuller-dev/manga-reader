"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

type WorkResult = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  description: string | null;
  _count: {
    chapters: number;
  };
};

type SearchResponse = {
  items?: WorkResult[];
};

function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (q.length < 2) return <>{text}</>;

  const safe = escapeRegExp(q);
  const re = new RegExp(`(${safe})`, "ig");
  const parts = text.split(re);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === q.toLowerCase();
        if (!isMatch) return <span key={i}>{part}</span>;
        return (
          <mark key={i} className="rounded bg-yellow-200 px-1 text-inherit">
            {part}
          </mark>
        );
      })}
    </>
  );
}

function formatChaptersCount(n: number) {
  if (n === 1) return "1 capítulo";
  return `${n} capítulos`;
}

export default function WorkSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<WorkResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  // Fecha ao clicar fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ESC fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Busca
  useEffect(() => {
    async function run() {
      if (debounced.length < 2) {
        setItems([]);
        setLoading(false);
        setActiveIndex(-1);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const res = await fetch(
          `/api/works/search?q=${encodeURIComponent(debounced)}`,
          { method: "GET", cache: "no-store", signal: controller.signal }
        );

        if (!res.ok) {
          setItems([]);
          setActiveIndex(-1);
          return;
        }

        const data = (await res.json()) as SearchResponse;
        const nextItems = Array.isArray(data.items) ? data.items : [];

        setItems(nextItems);
        setOpen(true);
        setActiveIndex(nextItems.length > 0 ? 0 : -1);
      } catch (err: unknown) {
        if (!isAbortError(err)) {
          setItems([]);
          setActiveIndex(-1);
        }
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, [debounced]);

  // Auto-scroll do item ativo
  useEffect(() => {
    if (!open) return;
    if (activeIndex < 0) return;
    const listEl = listRef.current;
    if (!listEl) return;

    const activeEl = listEl.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`
    );
    if (!activeEl) return;

    activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const showDropdown = useMemo(() => {
    return open && (loading || items.length > 0 || debounced.length >= 2);
  }, [open, loading, items.length, debounced.length]);

  function closeDropdown() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function goToIndex(index: number) {
    if (index < 0 || index >= items.length) return;
    const w = items[index];
    closeDropdown();
    router.push(`/works/${w.slug}`);
  }

  function goToSearchPage(q: string) {
    const clean = q.trim();
    if (clean.length < 2) return;
    closeDropdown();
    router.push(`/search?q=${encodeURIComponent(clean)}&page=1`);
  }

  function onKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    // Setas/enter devem funcionar mesmo com dropdown fechado, se tiver query
    if (e.key === "ArrowDown") {
      if (!showDropdown || items.length === 0) return;
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, items.length - 1)
      );
      return;
    }

    if (e.key === "ArrowUp") {
      if (!showDropdown || items.length === 0) return;
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? 0 : prev - 1));
      return;
    }

    if (e.key === "Enter") {
      // 1) Se tem seleção válida, abre a obra
      if (showDropdown && activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        goToIndex(activeIndex);
        return;
      }

      // 2) Caso contrário, vai pra página /search?q=...
      const q = query.trim();
      if (q.length >= 2) {
        e.preventDefault();
        goToSearchPage(q);
      }
      return;
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={onKeyDownInput}
          placeholder="Buscar obras..."
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-400"
          aria-expanded={showDropdown}
          aria-controls="work-search-dropdown"
          aria-autocomplete="list"
        />

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          {loading ? "Buscando..." : ""}
        </div>
      </div>

      {showDropdown ? (
        <div
          id="work-search-dropdown"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border bg-white shadow-lg"
          role="listbox"
        >
          {items.length === 0 && !loading ? (
            <div className="px-3 py-3 text-sm text-gray-500">
              Nenhum resultado. Pressione Enter para buscar.
            </div>
          ) : null}

          <ul ref={listRef} className="max-h-[360px] overflow-auto">
            {items.map((w, idx) => {
              const active = idx === activeIndex;

              return (
                <li key={w.id} role="option" aria-selected={active}>
                  <Link
                    href={`/works/${w.slug}`}
                    data-idx={idx}
                    className={[
                      "flex items-center gap-3 px-3 py-2",
                      "border-l-4",
                      active
                        ? "bg-gray-200 border-black ring-1 ring-black/10"
                        : "bg-white border-transparent hover:bg-gray-50",
                    ].join(" ")}
                    onClick={() => {
                      closeDropdown();
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="h-10 w-8 flex-none overflow-hidden rounded bg-gray-100">
                      {w.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        <HighlightText text={w.title} query={debounced} />
                      </div>

                      <div className="truncate text-xs text-gray-600">
                        {w.description ?? "Sem descrição."}
                      </div>

                      <div className="text-[11px] text-gray-500">
                        {formatChaptersCount(w._count.chapters)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}