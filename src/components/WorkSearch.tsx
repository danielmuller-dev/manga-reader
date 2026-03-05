"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type WorkItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  coverUrl: string | null;
  description?: string | null;
  chaptersCount?: number;
};

type SearchResponse = {
  works?: WorkItem[];
  items?: WorkItem[];
  results?: WorkItem[];
  error?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pickList(data: SearchResponse | null): WorkItem[] {
  if (!data) return [];
  if (Array.isArray(data.works)) return data.works;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function getErrorMessage(data: SearchResponse | null, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;
  return fallback;
}

async function fetchSearch(url: string, signal: AbortSignal) {
  const res = await fetch(url, { cache: "no-store", signal });
  const data = (await res.json().catch(() => null)) as SearchResponse | null;
  return { res, data };
}

export default function WorkSearch() {
  const [q, setQ] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const query = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = boxRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!query) {
      abortRef.current?.abort();
      setItems([]);
      setErr(null);
      setLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setErr(null);

      try {
        // ✅ compat: tenta "q" e depois "query"
        const urlQ = `/api/works/search?q=${encodeURIComponent(query)}`;
        const urlQuery = `/api/works/search?query=${encodeURIComponent(query)}`;

        const first = await fetchSearch(urlQ, ac.signal);

        // se 404 ou lista vazia, tenta outra querystring
        const list1 = pickList(first.data);
        const shouldFallback = first.res.status === 404 || list1.length === 0;

        const finalRes = shouldFallback ? await fetchSearch(urlQuery, ac.signal) : first;

        if (!finalRes.res.ok) {
          setErr(getErrorMessage(finalRes.data, "Erro ao buscar."));
          setItems([]);
          return;
        }

        setItems(pickList(finalRes.data));
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErr("Falha de rede ao buscar.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar obras..."
        className={cx(
          "w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition",
          "border-white/10 bg-white/5 text-white placeholder:text-white/40",
          "focus:ring-2 focus:ring-white/15"
        )}
      />

      {open ? (
        <div
          className={cx(
            "absolute left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border shadow-xl backdrop-blur",
            "border-white/10 bg-gray-950/85"
          )}
        >
          <div className="px-3 py-2 text-xs text-white/60 border-b border-white/10">
            {loading
              ? "Buscando..."
              : err
                ? err
                : query
                  ? `${items.length} resultado(s)`
                  : "Digite para buscar"}
          </div>

          {items.length === 0 ? (
            <div className="px-3 py-3 text-sm text-white/70">
              {query ? "Nenhuma obra encontrada." : "Comece digitando o nome da obra."}
            </div>
          ) : (
            <ul className="max-h-72 overflow-auto">
              {items.map((w) => (
                <li key={w.id} className="border-t border-white/10">
                  <Link
                    href={`/works/${w.slug}`}
                    className={cx(
                      "flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition",
                      "text-white"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {w.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.coverUrl} alt={w.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-white/50">CAPA</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{w.title}</div>
                      <div className="text-xs text-white/60 truncate">
                        /{w.slug} • {w.type}
                        {typeof w.chaptersCount === "number" ? ` • ${w.chaptersCount} cap.` : ""}
                      </div>
                    </div>

                    <span className="text-xs text-white/60 shrink-0">Abrir</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}