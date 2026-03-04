import Link from "next/link";
import { headers } from "next/headers";

type WorkItem = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  description: string | null;
  type: "MANGA" | "MANHWA" | "MANHUA" | "WEBTOON" | "NOVEL";
  _count: { chapters: number };
};

type ApiResponse = {
  items: WorkItem[];
  total: number;
  page: number;
  take: number;
};

type SearchParams = {
  q?: string;
  page?: string;
  sort?: string;
  type?: string;
  tag?: string;
};

function clampInt(value: string | undefined, def: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function formatChaptersCount(n: number) {
  if (n === 1) return "1 capítulo";
  return `${n} capítulos`;
}

function buildSearchHref(params: {
  q?: string;
  page?: number;
  sort?: string;
  type?: string;
  tag?: string;
}) {
  const sp = new URLSearchParams();
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());
  sp.set("page", String(params.page ?? 1));
  if (params.sort) sp.set("sort", params.sort);
  if (params.type) sp.set("type", params.type);
  if (params.tag) sp.set("tag", params.tag);
  return `/search?${sp.toString()}`;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "TITLE_ASC", label: "A-Z" },
  { value: "RECENT", label: "Mais recentes" },
  { value: "CHAPTERS_DESC", label: "Mais capítulos" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "MANGA", label: "Manga" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "MANHUA", label: "Manhua" },
  { value: "WEBTOON", label: "Webtoon" },
  { value: "NOVEL", label: "Novel" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const page = clampInt(sp.page, 1, 1, 10000);
  const take = 12;

  const sort = (sp.sort ?? "TITLE_ASC").toUpperCase();
  const type = (sp.type ?? "").toUpperCase();
  const tag = (sp.tag ?? "").trim().toLowerCase();

  let data: ApiResponse = { items: [], total: 0, page, take };

  const canSearch = q.length >= 2 || tag.length >= 2;

  if (canSearch) {
    const baseUrl = await getBaseUrl();

    const url =
      `${baseUrl}/api/works/search?` +
      new URLSearchParams({
        ...(q.length >= 2 ? { q } : {}),
        page: String(page),
        take: String(take),
        sort,
        ...(type ? { type } : {}),
        ...(tag ? { tag } : {}),
      }).toString();

    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      data = (await res.json()) as ApiResponse;
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / take));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-xl font-semibold">Busca</h1>
          <div className="mt-2 text-sm text-gray-600">
            {!canSearch ? (
              <span>Digite pelo menos 2 caracteres ou selecione uma tag para buscar.</span>
            ) : (
              <span>
                Resultados
                {q.length >= 2 ? (
                  <>
                    {" "}
                    para <b>{q}</b>
                  </>
                ) : null}
                {tag ? (
                  <>
                    {" "}
                    em <b>#{tag}</b>
                  </>
                ) : null}
                : {data.total}
              </span>
            )}
          </div>

          {/* Chip da tag ativa */}
          {tag ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs">
                #{tag}
                <Link
                  className="text-gray-600 hover:text-black"
                  href={buildSearchHref({ q, page: 1, sort, type, tag: "" })}
                  title="Remover tag"
                >
                  ✕
                </Link>
              </span>
            </div>
          ) : null}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Ordenação */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Ordenar</span>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={buildSearchHref({ q, page: 1, sort: opt.value, type: type || "", tag })}
                  className={[
                    "text-sm rounded-md border px-3 py-2 hover:bg-gray-50",
                    opt.value === sort ? "bg-gray-200 border-black" : "bg-white",
                  ].join(" ")}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Tipo</span>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                <Link
                  key={opt.value || "ALL"}
                  href={buildSearchHref({ q, page: 1, sort, type: opt.value, tag })}
                  className={[
                    "text-sm rounded-md border px-3 py-2 hover:bg-gray-50",
                    (opt.value || "") === (type || "") ? "bg-gray-200 border-black" : "bg-white",
                  ].join(" ")}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-6">
        {canSearch && data.items.length === 0 ? (
          <div className="text-sm text-gray-600">Nenhuma obra encontrada.</div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.items.map((w) => (
            <Link
              key={w.id}
              href={`/works/${w.slug}`}
              className="rounded-lg border bg-white hover:bg-gray-50 overflow-hidden"
            >
              <div className="aspect-[3/4] bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.coverUrl ? <img src={w.coverUrl} alt="" className="h-full w-full object-cover" /> : null}
              </div>

              <div className="p-3">
                <div className="font-semibold text-sm line-clamp-2">{w.title}</div>
                <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {w.description ?? "Sem descrição."}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-500">{formatChaptersCount(w._count.chapters)}</div>
                  <div className="text-[11px] text-gray-500">{w.type}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Paginação */}
      {canSearch ? (
        <div className="mt-6 flex items-center justify-between">
          {hasPrev ? (
            <Link
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              href={buildSearchHref({ q, page: page - 1, sort, type, tag })}
            >
              ← Anterior
            </Link>
          ) : (
            <span />
          )}

          <div className="text-sm text-gray-600">
            Página <b>{page}</b> de <b>{totalPages}</b>
          </div>

          {hasNext ? (
            <Link
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              href={buildSearchHref({ q, page: page + 1, sort, type, tag })}
            >
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}