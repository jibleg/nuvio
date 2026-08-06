import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => ReactNode;
};

const ALIGN_CLASS: Record<"left" | "right" | "center", string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Tabla genérica del design system. La navegación/interacción de fila (Link,
 * onClick…) la resuelve el `render` de cada columna — este componente solo
 * dibuja la grilla, para no acoplar routing a un primitivo compartido.
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyState,
  className,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  emptyState?: ReactNode;
  className?: string;
}) {
  if (data.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-surface shadow-soft", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th key={col.key} className={cn("px-5 py-3", ALIGN_CLASS[col.align ?? "left"])}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-line/60 last:border-0 hover:bg-cloud/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-5 py-3.5", ALIGN_CLASS[col.align ?? "left"], col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
