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

    const byQuery = normalizedQuery
      ? byScan.filter((c) => matchesQuery(c, normalizedQuery))
      : byScan;

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
    const st: UrlState = {
      scan: scanFilter,
      q: query,
      sort: sortMode,
      compact,
    };

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
      const st: UrlState = {
        scan: scanFilter,
        q: query,
        sort: sortMode,
        compact,
      };

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs opacity-70">Scan:</label>
          <select
            value={scanFilter}
            onChange={(e) => setScanFilter(e.target.value)}
            className="rounded-md border bg-white px-2 py-1 text-sm"
          >
            <option value="ALL">Todas</option>
            {scanOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="text-xs opacity-70 ml-2">Ordenar:</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-md border bg-white px-2 py-1 text-sm"
          >
            <option value="NUMBER_DESC">Número (desc)</option>
            <option value="NEWEST">Mais recentes</option>
            <option value="OLDEST">Mais antigos</option>
          </select>

          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            className="rounded-md border bg-white px-2 py-1 text-sm hover:bg-gray-50"
            title="Alternar modo compacto"
          >
            {compact ? "Compacto: ON" : "Compacto: OFF"}
          </button>

          <button
            type="button"
            onClick={() => void copyCurrentLink()}
            className="rounded-md border bg-white px-2 py-1 text-sm hover:bg-gray-50"
            title="Copiar link com filtros"
          >
            {copyStatus === "COPIED"
              ? "Copiado!"
              : copyStatus === "ERROR"
              ? "Falhou :("
              : "Copiar link"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Buscar: "12", "reaper", "paginado"...'
            className="w-full sm:w-72 rounded-md border bg-white px-3 py-2 text-sm"
          />
          <div className="text-xs opacity-60 whitespace-nowrap">
            {filtered.length}/{props.chapters.length}
          </div>
        </div>
      </div>

      {/* Latest */}
      {latest.length > 0 && (
        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Últimos uploads</div>
            <div className="text-xs opacity-60">Top {latest.length}</div>
          </div>

          <div className="mt-2 grid gap-2">
            {latest.map((c) => {
              const scanName = displayScanName(c.scanlator);
              const d = new Date(c.createdAtIso);
              const rel = formatRelativeFromNow(d);
              const full = formatDateTimeBR(d);

              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-3 rounded-md border bg-white ${
                    compact ? "px-2 py-2" : "px-3 py-2"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{chapterLabel(c)}</div>
                    <div className="text-xs opacity-70 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border bg-white px-2 py-0.5">{scanName}</span>
                      <span className="rounded-full border bg-white px-2 py-0.5">
                        {kindBadge(c.kind, c.readMode)}
                      </span>
                      <span className="opacity-60" title={full}>
                        {rel}
                      </span>
                    </div>
                  </div>

                  <Link
                    className="shrink-0 rounded-md bg-black text-white px-3 py-2 hover:opacity-90"
                    href={`/read/${c.id}`}
                    title={`Ler (${scanName})`}
                  >
                    Ler
                  </Link>
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
                <div className="text-xs opacity-60">{g.items.length} versão(ões)</div>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <div className={`grid grid-cols-12 gap-2 bg-gray-50 ${listPadding} ${textSize} font-medium`}>
                  <div className="col-span-5">Scan / Título</div>
                  <div className="col-span-3">Tipo</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>

                <ul className="divide-y">
                  {g.items.map((c) => {
                    const scanName = displayScanName(c.scanlator);
                    const d = new Date(c.createdAtIso);
                    const rel = formatRelativeFromNow(d);
                    const full = formatDateTimeBR(d);
                    const kind = kindBadge(c.kind, c.readMode);

                    return (
                      <li key={c.id} className={`grid grid-cols-12 gap-2 ${listPadding}`}>
                        <div className="col-span-5 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {scanName}
                            {c.title ? <span className="opacity-70"> • {c.title}</span> : null}
                          </div>
                          <div className={`${textSize} opacity-60 truncate`}>{chapterLabel(c)}</div>
                        </div>

                        <div className="col-span-3 flex items-center">
                          <span className={`${textSize} rounded-full border bg-white px-2 py-0.5`}>
                            {kind}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center">
                          <span className={`${textSize} opacity-70`} title={full}>
                            {rel}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <Link
                            className={`rounded-md bg-black text-white ${
                              compact ? "px-2 py-1.5 text-sm" : "px-3 py-1.5 text-sm"
                            } hover:opacity-90`}
                            href={`/read/${c.id}`}
                            title={`Ler (${scanName})`}
                          >
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
        <div className="text-sm opacity-70">Nenhum capítulo encontrado com esses filtros.</div>
      )}

      <div className="text-xs opacity-60">
        Dica: para ver tudo novamente, selecione <span className="font-medium">Scan: Todas</span> e
        limpe a busca.
      </div>
    </div>
  );
}