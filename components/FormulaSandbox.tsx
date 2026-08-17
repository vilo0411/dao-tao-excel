"use client";

import { useMemo, useState } from "react";
import { columnLetter } from "@/lib/schema";
import {
  evaluateFormula,
  formatValue,
  isError,
  SUPPORTED_FUNCTION_NAMES,
  type CellValue,
} from "@/lib/formula-eval";

/**
 * Ô thử công thức chạy ngay trong trình duyệt.
 *
 * Không đối thủ Việt nào có thứ này, và W3Schools có bản tương đương cho tiếng
 * Anh. Nó chạy được vì lib/formula-eval.ts là bộ tính thuần, không phụ thuộc
 * node:fs, và vì site xuất tĩnh nên không có máy chủ nào để gọi.
 *
 * TRUNG THỰC LÀ ĐIỀU KIỆN TỒN TẠI. Khung này chạy đúng mười hàm — đúng bằng số
 * hàm site có trang. Nó phải nói ra điều đó ngay trên màn hình. Một công cụ
 * giả vờ là Excel rồi trả khác Excel thì dạy sai, và dạy sai thì tệ hơn hẳn
 * không có công cụ. Vì lý do đó, khi người đọc gõ một hàm ngoài phạm vi, khung
 * không chỉ hiện #NAME? mà còn nói rõ vì sao.
 *
 * Phương ngữ bảng tính nghiêm ngặt: bo góc 0, font mono, `input` cho ô người
 * đọc gõ vào, `computed` cho ô kết quả — đúng nghĩa gốc của hai màu đó.
 */
export function FormulaSandbox({
  title,
  grid,
  prompt,
  answer,
  expected,
  hint,
}: {
  title: string;
  grid: CellValue[][];
  prompt: string;
  answer: string;
  expected: string;
  hint?: string;
}) {
  const [input, setInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const cols = Math.max(...grid.map((r) => r.length));

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return evaluateFormula(input, grid);
  }, [input, grid]);

  /**
   * Hàm người đọc gõ mà bộ tính không có.
   *
   * Tách riêng khỏi #NAME? chung: gõ nhầm SUMM và gõ XLOOKUP đều ra #NAME?,
   * nhưng lý do khác hẳn nhau. Cái đầu là lỗi của người đọc, cái sau là giới
   * hạn của công cụ, và gộp hai thứ vào một thông báo là đổ lỗi nhầm chỗ.
   */
  const unsupported = useMemo(() => {
    if (!input.startsWith("=") && input.trim() === "") return [];
    const found = new Set<string>();
    for (const [, name] of input.toUpperCase().matchAll(/\b([A-Z][A-Z0-9.]*)\s*\(/g)) {
      if (!SUPPORTED_FUNCTION_NAMES.includes(name)) found.add(name);
    }
    return [...found];
  }, [input]);

  return (
    <section className="mt-12">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-3 max-w-prose text-ink-soft">{prompt}</p>

      {/* Lưới dữ liệu. Chỉ đọc — công thức là thứ duy nhất người dùng nhập. */}
      <div className="mt-5 overflow-x-auto border border-rule">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th aria-hidden className="w-10 bg-panel" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  aria-hidden
                  className="border-l border-rule bg-panel px-3 py-1 text-center font-mono text-xs font-normal text-ink-faint"
                >
                  {columnLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r} className="border-t border-rule">
                <th
                  aria-hidden
                  className="bg-panel px-2 text-center font-mono text-xs font-normal text-ink-faint"
                >
                  {r + 1}
                </th>
                {Array.from({ length: cols }, (_, c) => (
                  <td
                    key={c}
                    className="border-l border-rule bg-input-bg px-3 py-1 font-mono text-sm whitespace-nowrap"
                  >
                    {formatValue(row[c] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Bản không có JavaScript.

        Tương tác là lớp phủ, không phải nội dung — đây là chỗ nguyên tắc đó
        được thi hành. Người tắt JS, và con bọ của Google khi nó không chạy JS,
        vẫn phải đọc được đáp án và kết quả dưới dạng chữ. Nếu đáp án chỉ sống
        trong state của React thì khối này là một khoảng trắng đối với họ, và
        phần giá trị nhất của bài biến mất khỏi trang.
      */}
      <noscript>
        <div className="mt-4 border border-rule bg-panel p-4">
          <p className="font-mono text-sm">
            <span className="text-ink-faint">Đáp án: </span>
            {answer}
          </p>
          <p className="mt-1 font-mono text-sm">
            <span className="text-ink-faint">Kết quả: </span>
            <span className="text-computed">{expected}</span>
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Khung thử tương tác cần JavaScript. Đáp án ở trên là kết quả thật
            khi chạy công thức đó trên lưới dữ liệu này.
          </p>
        </div>
      </noscript>

      {/* Thanh công thức, dựng theo đúng hình dạng của Excel. */}
      <div className="mt-4 flex items-stretch border border-rule bg-panel">
        <span
          aria-hidden
          className="flex items-center border-r border-rule px-3 font-mono text-xs text-ink-faint"
        >
          fx
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="=IFERROR(B2/C2, 0)"
          aria-label="Gõ công thức để thử"
          className="w-full bg-paper px-3 py-2 font-mono text-sm outline-none"
        />
      </div>

      {/* aria-live: người dùng trình đọc màn hình nghe được kết quả đổi. */}
      <div aria-live="polite" className="mt-3 min-h-6">
        {result !== null && (
          <p className="font-mono text-sm">
            <span className="text-ink-faint">Kết quả: </span>
            <span className={isError(result) ? "text-flag" : "text-computed"}>
              {formatValue(result)}
            </span>
          </p>
        )}
        {unsupported.length > 0 && (
          <p className="mt-2 max-w-prose text-sm text-flag">
            Khung thử này không chạy được {unsupported.join(", ")}. Đó là giới
            hạn của công cụ ở đây, không phải bạn gõ sai — trong Excel thật hàm
            đó vẫn chạy bình thường.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setShowAnswer(true);
            setInput(answer);
          }}
          className="rounded-sm border border-rule px-3 py-1 text-sm text-ink-soft hover:bg-panel"
        >
          Xem đáp án
        </button>
        {hint && !showAnswer && (
          <p className="text-sm text-ink-faint">Gợi ý: {hint}</p>
        )}
      </div>

      {/*
        Dòng giới hạn luôn hiện, không gập vào đâu cả. Nó là điều kiện để khung
        này không phản tác dụng, nên không được là thứ người đọc phải đi tìm.
      */}
      <p className="mt-4 text-xs text-ink-faint">
        Khung thử chạy được {SUPPORTED_FUNCTION_NAMES.length} hàm mà site này có
        trang: {SUPPORTED_FUNCTION_NAMES.join(", ")}. Không hỗ trợ tham chiếu
        tuyệt đối kiểu $A$1, không hỗ trợ ngày tháng. Đây không phải Excel thật.
      </p>
    </section>
  );
}
