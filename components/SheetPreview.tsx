"use client";

import { useState } from "react";
import {
  columnLetter,
  display,
  resolveFormula,
  type TemplateSpec,
} from "@/lib/schema";

type Sheet = TemplateSpec["sheets"][number];

// "Ô xanh" từng đủ nghĩa khi chỉ ô công thức được tô màu. Giờ ô nhập tay cũng
// có nền xanh dương nên phải nói rõ xanh lá, không thì câu này chỉ vào cả hai.
const HINT = "Bấm vào ô xanh lá để xem công thức thật trong file";

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
 *
 * Vùng này là phương ngữ riêng của hệ thiết kế: bo góc 0 tuyệt đối, và chỉ
 * dùng input / computed / rule. Không rounded-*, không màu band signature —
 * một bảng tính bo góc là một bảng tính sai.
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
                      /*
                       * Ô nhập tay được tô nền xanh nhạt, đối xứng với nền xanh
                       * lá của ô công thức. Trước đây nó để trắng trơn nên
                       * không phân biệt được với ô trống — nghĩa là một nửa
                       * quy ước màu mà chú thích bên dưới khai báo thật ra
                       * chưa từng hiện ra ở đâu cả.
                       */
                      return (
                        <td
                          key={col.key}
                          className="bg-input-bg border-r border-b border-rule px-3 py-2 whitespace-nowrap last:border-r-0"
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
                        className={`relative border-r border-b border-rule p-0 last:border-r-0 ${
                          isActive ? "bg-computed/15" : "bg-computed-bg"
                        }`}
                      >
                        {/*
                          Tam giác góc trên bên phải: mượn đúng dấu Excel đánh
                          vào ô có ghi chú. Trên cảm ứng không có hover nên nếu
                          không có dấu này thì không gì cho biết ô bấm được.
                        */}
                        <span
                          aria-hidden
                          className="border-t-computed pointer-events-none absolute top-0 right-0 h-0 w-0 border-t-[6px] border-l-[6px] border-l-transparent"
                        />
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
            className="bg-input-bg border-input/40 inline-block h-3 w-3 border"
          />
          ô bạn nhập
        </span>
        {/* Bảng rộng hơn khung bài viết ngay cả trên desktop, nên nói ở mọi
            khổ màn hình — không riêng di động — để không ai tưởng đã hết cột. */}
        <span className="text-ink-faint">Cuộn ngang để xem hết cột</span>
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
        /*
         * `minmax(0,1fr)` chứ không phải `1fr`: công thức dài viết liền không
         * ngắt dòng, và một cột grid mặc định nở ra vừa nội dung dài nhất —
         * đủ để đẩy toàn trang tràn ngang trên điện thoại. Chốt cận dưới về 0
         * thì cột chịu co lại, và `<code>` bên trong tự cuộn như thiết kế.
         */
        <div
          key={col.key}
          className="grid grid-cols-[minmax(0,1fr)] gap-2 py-5 sm:grid-cols-[5rem_minmax(0,1fr)]"
        >
          <dt className="cell-ref text-computed pt-0.5 text-sm">
            {columnLetter(index)}2
          </dt>
          <dd className="min-w-0">
            <p className="font-medium">{col.header}</p>
            <code className="mt-2 block overflow-x-auto rounded-sm bg-panel px-3 py-2 text-xs whitespace-pre">
              {resolveFormula(col.formula!, sheet.columns, 2)}
            </code>
            <p className="mt-2 text-ink-soft">{col.note}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
