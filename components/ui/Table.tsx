"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 8,
  searchable = false,
  searchKeys,
  filterSlot,
  rowClassName,
}: {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  filterSlot?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => {
      const keys = searchKeys ?? (Object.keys(row as object) as (keyof T)[]);
      return keys.some((k) => String(row[k]).toLowerCase().includes(q));
    });
  }, [data, query, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = col?.accessor ? col.accessor(a) : (a as never)[sortKey];
      const vb = col?.accessor ? col.accessor(b) : (b as never)[sortKey];
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return copy;
  }, [columns, filtered, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-3">
      {(searchable || filterSlot) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <input
              placeholder="Buscar…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-control border border-margify-border bg-margify-cardAlt px-3 py-2 text-sm text-margify-text outline-none transition-[border] duration-margify focus:border-margify-cyan sm:max-w-xs"
            />
          ) : (
            <div />
          )}
          {filterSlot}
        </div>
      )}
      <div className="overflow-x-auto rounded-card border border-margify-border">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-margify-black text-margify-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3 font-medium", col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 text-margify-text transition-colors duration-margify hover:text-margify-cyan"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-margify-muted"
                >
                  No hay datos para mostrar.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-margify-border bg-margify-card/80 transition-colors duration-margify hover:bg-margify-cardAlt/80",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-margify-text", col.className)}>
                      {col.render
                        ? col.render(row)
                        : String((row as never)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-margify-muted sm:flex-row">
        <span>
          Mostrando {pageRows.length ? currentPage * pageSize + 1 : 0}–
          {Math.min((currentPage + 1) * pageSize, sorted.length)} de {sorted.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-control border border-margify-border px-3 py-1 transition-colors duration-margify enabled:hover:border-margify-cyan enabled:hover:text-margify-cyan disabled:opacity-30"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-control border border-margify-border px-3 py-1 transition-colors duration-margify enabled:hover:border-margify-cyan enabled:hover:text-margify-cyan disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
