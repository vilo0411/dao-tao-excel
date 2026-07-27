"use client";

import { useState } from "react";
import {
  columnLetter,
  resolveFormula,
  type TemplateSpec,
} from "@/lib/schema";

type Sheet = TemplateSpec["sheets"][number];

const FORMATTERS: Record<string, (value: unknown) => string> = {
  currency: (v) => Number(v).toLocaleString("vi-VN"),
  percent: (v) => `${(Number(v) * 100).toFixed(1)}%`,
  number: (v) => Number(v).toLocaleString("vi-VN"),
};

function display(value: unknown, type: string): string {
  if (value === undefined || value === null || value === "") return "";
  const formatter = FORMATTERS[type];
  return formatter ? formatter(value) : String(value);
}

const HINT = "Bấm vào ô xanh để xem công thức thật trong file";

/**
 * Bảng preview dựng theo đúng cách một bảng tính hiển thị: có dải chữ cái cột,
 * có cột số dòng, và có thanh công thức ở trên.
 *
 * Đây là điểm nhấn của cả site, và nó phục vụ đúng luận điểm: các trang mẫu
 * Excel khác đưa file rồi giấu cách làm, còn ở đây công thức được phơi ra ngay
 * trên bảng. Ô công thức là nút bấm được nên dùng chuột hay bàn phím đều xem
 * được, và thanh công thức là vùng aria-live để trình đọc màn hình đọc theo.
 *
 * Hiển thị dạng HTML thay vì ảnh chụp: Google đọc được nội dung, không tốn byte
 * ảnh, và luôn khớp với file .xlsx vì cùng sinh ra từ một spec.
 */
export function SheetPreview({
  sheet,
  computed,
}: {
  sheet: Sheet;
  /** Giá trị Excel tính ra cho từng dòng mẫu, đã qua QA. */
  computed?: Record<string, unknown>[];
}) {
  const [active, setActive] = useState<{ key: string; row: number } | null>(
    null,
  );

  const activeColumn = active
    ? sheet.columns.find((c) => c.key === active.key)
    : undefined;

  const activeRef = activeColumn
    ? `${columnLetter(sheet.columns.indexOf(activeColumn))}${active!.row}`
    : "";

  const activeFormula = activeColumn?.formula
    ? resolveFormula(activeColumn.formula, sheet.columns, active!.row)
    : "";

  return (
    <figure className="not-prose">
      {/* Thanh công thức: hộp tên ô bên trái, công thức bên phải — như Excel. */}
      <div className="flex items-stretch border border-b-0 border-rule bg-panel text-sm">
        <span className="flex w-16 shrink-0 items-center justify-center border-r border-rule px-2 py-2 font-mono text-xs text-ink-soft">
          {activeRef || "—"}
        </span>
        <span className="flex shrink-0 items-center border-r border-rule px-3 py-2 font-mono text-xs text-ink-faint italic">
          fx
        </span>
        <output
          aria-live="polite"
          className="flex min-w-0 flex-1 items-center overflow-x-auto px-3 py-2"
        >
          {activeFormula ? (
            <code className="text-computed whitespace-pre">{activeFormula}</code>
          ) : (
            <span className="text-ink-faint">{HINT}</span>
          )}
        </output>
      </div>

      <div className="overflow-x-auto border border-rule">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <caption className="sr-only">
            Xem trước sheet {sheet.name}: {sheet.description}
          </caption>

          <thead>
            {/* Dải chữ cái cột là khung của bảng tính, không phải dữ liệu. */}
            <tr aria-hidden className="bg-panel text-ink-faint">
              <td className="w-10 border-r border-b border-rule" />
              {sheet.columns.map((col, index) => (
                <td
                  key={col.key}
                  className="border-r border-b border-rule px-3 py-1 text-center font-mono text-xs last:border-r-0"
                >
                  {columnLetter(index)}
                </td>
              ))}
            </tr>

            {/* Tiêu đề nằm ở dòng 1, đúng như trong file thật. */}
            <tr>
              <td
                aria-hidden
                className="border-r border-b border-rule bg-panel px-1 py-2 text-center font-mono text-xs text-ink-faint"
              >
                1
              </td>
              {sheet.columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="border-r border-b border-rule px-3 py-2 text-left align-bottom font-semibold whitespace-nowrap last:border-r-0"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sheet.sampleRows.map((row, rowIndex) => {
              const rowNumber = rowIndex + 2;
              return (
                <tr key={rowIndex}>
                  <td
                    aria-hidden
                    className="border-r border-b border-rule bg-panel px-1 py-2 text-center font-mono text-xs text-ink-faint"
                  >
                    {rowNumber}
                  </td>

                  {sheet.columns.map((col) => {
                    if (col.type !== "formula") {
                      return (
                        <td
                          key={col.key}
                          className="border-r border-b border-rule px-3 py-2 whitespace-nowrap last:border-r-0"
                        >
                          {display(row[col.key], col.type)}
                        </td>
                      );
                    }

                    const isActive =
                      active?.key === col.key && active.row === rowNumber;
                    const value = computed?.[rowIndex]?.[col.key];
                    const shown =
                      value === undefined
                        ? "tự tính"
                        : display(value, col.format ?? "number");

                    return (
                      <td
                        key={col.key}
                        className={`border-r border-b border-rule p-0 last:border-r-0 ${
                          isActive ? "bg-computed/15" : "bg-computed-bg"
                        }`}
                      >
                        <button
                          type="button"
                          onMouseEnter={() =>
                            setActive({ key: col.key, row: rowNumber })
                          }
                          onMouseLeave={() => setActive(null)}
                          onFocus={() =>
                            setActive({ key: col.key, row: rowNumber })
                          }
                          onBlur={() => setActive(null)}
                          className="text-computed w-full cursor-help px-3 py-2 text-left font-medium whitespace-nowrap"
                        >
                          <span className="sr-only">
                            {col.header}, ô Excel tự tính:{" "}
                          </span>
                          {shown}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="bg-computed-bg border-computed/40 inline-block h-3 w-3 border"
          />
          Excel tự tính
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 border border-rule bg-paper"
          />
          ô bạn nhập
        </span>
        <span className="text-ink-faint">{sheet.description}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Bảng công thức, có cột tham chiếu ô thật (J2, K2...).
 * Tham chiếu ở đây là thông tin đúng — chỉ ra chính xác công thức nằm ở ô nào
 * trong file — chứ không phải số thứ tự trang trí.
 */
export function FormulaTable({ sheet }: { sheet: Sheet }) {
  const formulas = sheet.columns
    .map((col, index) => ({ col, index }))
    .filter(({ col }) => col.formula);

  if (formulas.length === 0) return null;

  return (
    <dl className="divide-y divide-rule border-y border-rule">
      {formulas.map(({ col, index }) => (
        <div key={col.key} className="grid gap-2 py-5 sm:grid-cols-[5rem_1fr]">
          <dt className="cell-ref text-computed pt-0.5 text-sm">
            {columnLetter(index)}2
          </dt>
          <dd>
            <p className="font-medium">{col.header}</p>
            <code className="mt-2 block overflow-x-auto bg-panel px-3 py-2 text-xs whitespace-pre">
              {resolveFormula(col.formula!, sheet.columns, 2)}
            </code>
            <p className="mt-2 text-ink-soft">{col.note}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
