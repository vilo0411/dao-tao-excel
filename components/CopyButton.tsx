"use client";

import { useState } from "react";

/**
 * Nút chép dữ liệu mẫu để dán thẳng vào Excel.
 *
 * Chép ra TSV — các ô ngăn bằng ký tự tab, các dòng ngăn bằng xuống dòng. Đây
 * là định dạng Excel và Google Sheets đều hiểu là "một vùng ô", nên dán vào là
 * ra đúng từng ô. Chép ra text thường thì cả dòng dồn vào một ô và người đọc
 * phải ngồi tách tay, tức là mất luôn lý do tồn tại của cái nút.
 *
 * Không dùng dấu phẩy: dữ liệu tiếng Việt có dấu phẩy trong nội dung, và số
 * tiền cũng hay mang dấu phân cách. Tab thì gần như không bao giờ xuất hiện
 * trong một ô, nên nó là ký tự ngăn an toàn duy nhất.
 */
export function CopyButton({
  rows,
  label = "Chép bảng",
}: {
  /** Từng dòng, từng ô. Đã là chuỗi hiển thị. */
  rows: readonly (readonly string[])[];
  label?: string;
}) {
  const [state, setState] = useState<"san-sang" | "xong" | "loi">("san-sang");

  const tsv = rows.map((r) => r.join("\t")).join("\n");

  async function copy() {
    try {
      // navigator.clipboard chỉ tồn tại trong ngữ cảnh bảo mật (https hoặc
      // localhost). Không có nó thì báo lỗi và hiện vùng chọn sẵn ở dưới, chứ
      // không im lặng — một nút bấm không phản hồi gì là tệ hơn cả không có nút.
      if (!navigator.clipboard) throw new Error("không có clipboard API");
      await navigator.clipboard.writeText(tsv);
      setState("xong");
      setTimeout(() => setState("san-sang"), 2000);
    } catch {
      setState("loi");
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-sm border border-rule px-2 py-1 text-xs text-ink-soft hover:bg-panel"
      >
        {state === "xong" ? "Đã chép ✓" : label}
      </button>

      {/* aria-live để trình đọc màn hình biết nút vừa làm gì. */}
      <span className="sr-only" aria-live="polite">
        {state === "xong" ? "Đã chép dữ liệu vào clipboard" : ""}
      </span>

      {state === "loi" && (
        <div className="mt-2">
          <p className="text-xs text-flag">
            Trình duyệt không cho chép tự động. Bấm vào ô dưới rồi Ctrl+A, Ctrl+C.
          </p>
          <textarea
            readOnly
            value={tsv}
            rows={Math.min(rows.length + 1, 8)}
            onFocus={(e) => e.currentTarget.select()}
            className="cell-ref mt-1 w-full border border-rule bg-panel p-2 text-xs"
          />
        </div>
      )}
    </div>
  );
}
