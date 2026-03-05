"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DeleteChapterButton from "./DeleteChapterButton";

type ChapterKind = "IMAGES" | "TEXT";
type ReadMode = "SCROLL" | "PAGINATED";

type ChapterScanlator = { id: string; slug: string; name: string };

export type ChapterRowClient = {
  id: string;
  number: number | null;
  title: string | null;
  kind: ChapterKind;
  readMode: ReadMode | null;
  createdAtIso: string; // serializável
  scanlator: ChapterScanlator | null;
};

type SortMode = "NUMBER_DESC" | "NEWEST" | "OLDEST";

type UrlState = {
  scan: string; // "ALL" ou scanlatorId
  q: string;
  sort: SortMode;
  compact: boolean;
};

function chapterLabel(ch: { number: number | null; title: string | null }) {
  const base = ch.number != null ? `Cap. ${ch.number}` : "Capítulo";
  return `${base}${ch.title ? ` — ${ch.title}` : ""}`;
}

function kindBadge(kind: ChapterKind, readMode: ReadMode | null): string {
  if (kind === "TEXT") return "TEXT";
  return readMode ? `IMAGES • ${readMode}` : "IMAGES";
}

function formatDateTimeBR(d: Date) {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function formatRelativeFromNow(d: Date): string {
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "agora";
  if (diffSec < 60) return `${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d`;

  const diffM = Math.floor(diffD / 30);
  if (diffM < 12) return `${diffM}m`;

  const diffY = Math.floor(diffM / 12);
  return `${diffY}a`;
}

function safeLower(s: string) {
  return s.toLocaleLowerCase();
}

function matchesQuery(ch: ChapterRowClient, q: string): boolean {
  if (!q) return true;

  const scanName = ch.scanlator?.name ?? "";
  const num = ch.number != null ? String(ch.number) : "";
  const title = ch.title ?? "";
  const kind = ch.kind;
  const mode = ch.readMode ?? "";

  const hay = safeLower([scanName, num, title, kind, mode].join(" | "));
  return hay.includes(q);
}

function displayScanName(scanlator: ChapterScanlator | null) {
  return scanlator?.name ?? "Sem scanlator";
}

function parseSortMode(v: string | null): SortMode {
  if (v === "NEWEST" || v === "OLDEST" || v === "NUMBER_DESC") return v;
  return "NUMBER_DESC";
}

function parseCompact(v: string | null): boolean {
  if (!v) return true; // default
  return v === "1" || v === "true";
}

function buildUrl(pathname: string, st: UrlState): string {
  const sp = new URLSearchParams();

  // Só escreve quando diferente do default (URL limpa)
  if (st.scan !== "ALL") sp.set("scan", st.scan);
  if (st.q.trim() !== "") sp.set("q", st.q.trim());
  if (st.sort !== "NUMBER_DESC") sp.set("sort", st.sort);
  if (st.compact === false) sp.set("compact", "0"); // default é true

  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function readUrlState(sp: URLSearchParams): UrlState {
  const scan = sp.get("scan")?.trim() || "ALL";
  const q = sp.get("q") ?? "";
  const sort = parseSortMode(sp.get("sort"));
  const compact = parseCompact(sp.get("compact"));
  return { scan, q, sort, compact };
}

function inputGlass() {
  return [
    "rounded-xl border px-3 py-2 text-sm outline-none transition",
    "border-white/10 bg-white/5 text-white placeholder:text-white/35",
    "focus:ring-2 focus:ring-white/15",
  ].join(" ");
}

function selectGlass() {
  return [
    "rounded-xl border px-2 py-2 text-sm outline-none transition",
    "border-white/10 bg-white/5 text-white",
    "focus:ring-2 focus:ring-white/15",
  ].join(" ");
}

export default function ChapterListClient(props: {
  workSlug: string;
  chapters: ChapterRowClient[];
  canManageChapters: boolean;
  initial?: Partial<UrlState>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialFromUrl = useMemo<UrlState>(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    const st = readUrlState(sp);

    const hasAnyQuery = (searchParams?.toString() ?? "").trim().length > 0;
    if (hasAnyQuery) return st;

    return {
      scan: props.initial?.scan ?? st.scan,
      q: props.initial?.q ?? st.q,
      sort: props.initial?.sort ?? st.sort,
      compact: props.initial?.compact ?? st.compact,
    };
  }, [searchParams, props.initial]);

  const [scanFilter, setScanFilter] = useState<string>(initialFromUrl.scan);
  const [query, setQuery] = useState<string>(initialFromUrl.q);
  const [sortMode, setSortMode] = useState<SortMode>(initialFromUrl.sort);
  const [compact, setCompact] = useState<boolean>(initialFromUrl.compact);

  const [copyStatus, setCopyStatus] = useState<"IDLE" | "COPIED" | "ERROR">("IDLE");

  const lastAppliedUrl = useRef<string>("");

  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    const st = readUrlState(sp);
    const desiredUrl = buildUrl(pathname, st);

    if (lastAppliedUrl.current === desiredUrl) return;

    const needScan = scanFilter !== st.scan;
    const needQ = query !== st.q;
    const needSort = sortMode !== st.sort;
    const needCompact = compact !== st.compact;

    if (needScan) setScanFilter(st.scan);
    if (needQ) setQuery(st.q);
    if (needSort) setSortMode(st.sort);
    if (needCompact) setCompact(st.compact);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  const scanOptions = useMemo(() => {
    const map = new Map<string, ChapterScanlator>();
    for (const c of props.chapters) {
      if (c.scanlator) map.set(c.scanlator.id, c.scanlator);
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [props.chapters]);

  const normalizedQuery = useMemo(() => safeLower(query.trim()), [query]);

  const filtered = useMemo(() => {
    const byScan =
      scanFilter === "ALL"
        ? props.chapters
        : props.chapters.filter((c) => c.scanlator?.id === scanFilter);

    const byQuery = normalizedQuery ? byScan.filter((c) => matchesQuery(c, normalizedQuery)) : byScan;

    const sorted = [...byQuery].sort((a, b) => {
      const da = new Date(a.createdAtIso).getTime();
      const db = new Date(b.createdAtIso).getTime();

      if (sortMode === "NEWEST") {
        const d = db - da;
        if (d !== 0) return d;
      }

      if (sortMode === "OLDEST") {
        const d = da - db;
        if (d !== 0) return d;
      }

      const an = a.number;
      const bn = b.number;

      if (an == null && bn == null) {
        const d = db - da;
        if (d !== 0) return d;
      } else if (an == null) return 1;
      else if (bn == null) return -1;
      else {
        const d = bn - an;
        if (d !== 0) return d;
      }

      const asn = a.scanlator?.name ?? "";
      const bsn = b.scanlator?.name ?? "";
      const n = asn.localeCompare(bsn);
      if (n !== 0) return n;
      return a.id.localeCompare(b.id);
    });

    return sorted;
  }, [props.chapters, scanFilter, normalizedQuery, sortMode]);

  const latest = useMemo(() => filtered.slice(0, 8), [filtered]);

  const groups = useMemo(() => {
    const map = new Map<string, { number: number | null; items: ChapterRowClient[] }>();

    for (const ch of filtered) {
      const key = ch.number == null ? "null" : `n:${ch.number}`;
      const g = map.get(key);
      if (g) g.items.push(ch);
      else map.set(key, { number: ch.number, items: [ch] });
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      if (a.number == null && b.number == null) return 0;
      if (a.number == null) return 1;
      if (b.number == null) return -1;
      return b.number - a.number;
    });

    for (const g of arr) {
      g.items.sort((a, b) => {
        const da = new Date(a.createdAtIso).getTime();
        const db = new Date(b.createdAtIso).getTime();
        const d = db - da;
        if (d !== 0) return d;

        const asn = a.scanlator?.name ?? "";
        const bsn = b.scanlator?.name ?? "";
        const n = asn.localeCompare(bsn);
        if (n !== 0) return n;
        return a.id.localeCompare(b.id);
      });
    }

    return arr;
  }, [filtered]);

  // ✅ Persistência na URL (debounce na query)
  useEffect(() => {
    const st: UrlState = { scan: scanFilter, q: query, sort: sortMode, compact };

    const t = setTimeout(() => {
      const nextUrl = buildUrl(pathname, st);

      const currentUrl = buildUrl(
        pathname,
        readUrlState(new URLSearchParams(searchParams?.toString() ?? ""))
      );
      if (nextUrl === currentUrl) return;

      lastAppliedUrl.current = nextUrl;
      router.replace(nextUrl, { scroll: false });
    }, 350);

    return () => clearTimeout(t);
  }, [scanFilter, query, sortMode, compact, pathname, router, searchParams]);

  async function copyCurrentLink() {
    try {
      const st: UrlState = { scan: scanFilter, q: query, sort: sortMode, compact };

      const relative = buildUrl(pathname, st);
      const origin = window.location.origin;
      const full = `${origin}${relative}`;

      await navigator.clipboard.writeText(full);
      setCopyStatus("COPIED");
      window.setTimeout(() => setCopyStatus("IDLE"), 1200);
    } catch {
      setCopyStatus("ERROR");
      window.setTimeout(() => setCopyStatus("IDLE"), 1600);
    }
  }

  const listPadding = compact ? "px-2 py-1.5" : "px-3 py-2";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/50">Scan:</span>

          <select value={scanFilter} onChange={(e) => setScanFilter(e.target.value)} className={selectGlass()}>
            <option value="ALL">Todas</option>
            {scanOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-white/50 ml-2">Ordenar:</span>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className={selectGlass()}
          >
            <option value="NUMBER_DESC">Número (desc)</option>
            <option value="NEWEST">Mais recentes</option>
            <option value="OLDEST">Mais antigos</option>
          </select>

          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            className="btn-secondary"
            title="Alternar modo compacto"
          >
            {compact ? "Compacto: ON" : "Compacto: OFF"}
          </button>

          <button type="button" onClick={() => void copyCurrentLink()} className="btn-secondary" title="Copiar link com filtros">
            {copyStatus === "COPIED" ? "Copiado!" : copyStatus === "ERROR" ? "Falhou :(" : "Copiar link"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Buscar: "12", "reaper", "paginado"...'
            className={["w-full sm:w-72", inputGlass()].join(" ")}
          />
          <div className="text-xs text-white/50 whitespace-nowrap">
            {filtered.length}/{props.chapters.length}
          </div>
        </div>
      </div>

      {/* Latest */}
      {latest.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Últimos uploads</div>
            <div className="text-xs text-white/50">Top {latest.length}</div>
          </div>

          <div className="mt-3 grid gap-2">
            {latest.map((c) => {
              const scanName = displayScanName(c.scanlator);
              const d = new Date(c.createdAtIso);
              const rel = formatRelativeFromNow(d);
              const full = formatDateTimeBR(d);

              return (
                <div
                  key={c.id}
                  className={[
                    "rounded-2xl border border-white/10 bg-black/20",
                    "hover:bg-black/30 transition",
                    compact ? "px-2 py-2" : "px-3 py-2",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{chapterLabel(c)}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span className="chip">{scanName}</span>
                        <span className="chip">{kindBadge(c.kind, c.readMode)}</span>
                        <span className="text-white/45" title={full}>
                          {rel}
                        </span>
                      </div>
                    </div>

                    <Link className="btn-primary shrink-0" href={`/read/${c.id}`} title={`Ler (${scanName})`}>
                      Ler
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Groups table */}
      <div className="space-y-4">
        {groups.map((g) => {
          const groupTitle = g.number != null ? `Cap. ${g.number}` : "Sem número";

          return (
            <section key={g.number == null ? "null" : `n:${g.number}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{groupTitle}</div>
                <div className="text-xs text-white/50">{g.items.length} versão(ões)</div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
                <div
                  className={[
                    "grid grid-cols-12 gap-2",
                    "bg-black/20 border-b border-white/10",
                    listPadding,
                    textSize,
                    "font-medium text-white/70",
                  ].join(" ")}
                >
                  <div className="col-span-5">Scan / Título</div>
                  <div className="col-span-3">Tipo</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>

                <ul className="divide-y divide-white/10">
                  {g.items.map((c) => {
                    const scanName = displayScanName(c.scanlator);
                    const d = new Date(c.createdAtIso);
                    const rel = formatRelativeFromNow(d);
                    const full = formatDateTimeBR(d);
                    const kind = kindBadge(c.kind, c.readMode);

                    return (
                      <li
                        key={c.id}
                        className={[
                          "grid grid-cols-12 gap-2",
                          listPadding,
                          "bg-black/0 hover:bg-white/5 transition",
                        ].join(" ")}
                      >
                        <div className="col-span-5 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {scanName}
                            {c.title ? <span className="text-white/60"> • {c.title}</span> : null}
                          </div>
                          <div className={[textSize, "text-white/45 truncate"].join(" ")}>
                            {chapterLabel(c)}
                          </div>
                        </div>

                        <div className="col-span-3 flex items-center">
                          <span className="chip">{kind}</span>
                        </div>

                        <div className="col-span-2 flex items-center">
                          <span className={[textSize, "text-white/55"].join(" ")} title={full}>
                            {rel}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <Link className="btn-primary" href={`/read/${c.id}`} title={`Ler (${scanName})`}>
                            Ler
                          </Link>

                          {props.canManageChapters && <DeleteChapterButton chapterId={c.id} />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Nenhum capítulo encontrado com esses filtros.
        </div>
      )}

      <div className="text-xs text-white/50">
        Dica: para ver tudo novamente, selecione <span className="font-medium text-white/70">Scan: Todas</span> e limpe a busca.
      </div>
    </div>
  );
}