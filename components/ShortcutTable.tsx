"use client";

import { useMemo, useState } from "react";
import type { Shortcut } from "@/lib/knowledge-schema";

/**
 * Bảng tra phím tắt có ô tìm và chuyển Windows / macOS.
 *
 * NGUYÊN TẮC QUYẾT ĐỊNH CÁCH DỰNG: toàn bộ số dòng được render vào HTML ngay
 * từ đầu, rồi mới ẩn bớt bằng CSS-in-JS khi lọc. Cách làm ngược lại — chỉ
 * render những dòng khớp bộ lọc — sẽ khiến Google nhìn thấy một bảng rỗng, và
 * cả trang mất sạch nội dung mà nó tồn tại để có. Bộ lọc là tiện ích cho người
 * đọc, không phải cơ chế sinh nội dung.
 *
 * Vì lý do đó, `hidden` được đặt trên từng <tr> thay vì lọc mảng: dòng vẫn nằm
 * trong DOM và trong HTML nguồn, chỉ là không hiện.
 *
 * Đối thủ có 41 slug về phím tắt và tất cả đều là bài liệt kê tĩnh — không ai
 * có bảng tra lọc được.
 */
export function ShortcutTable({
  shortcuts,
  groups,
}: {
  shortcuts: Shortcut[];
  groups: string[];
}) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"win" | "mac">("win");

  const q = query.trim().toLowerCase();

  /**
   * Đánh dấu dòng nào khớp, KHÔNG lọc mảng.
   *
   * Tìm trên cả ba trường — mô tả, phím Windows và phím macOS — để gõ "ctrl
   * shift l" cũng ra, mà gõ "lọc" cũng ra. Người tra phím tắt đến từ hai
   * hướng: biết việc muốn làm, hoặc biết tổ hợp mà quên nó làm gì.
   */
  const matches = useMemo(() => {
    if (q === "") return shortcuts.map(() => true);
    return shortcuts.map((s) =>
      `${s.action} ${s.win} ${s.mac} ${s.group}`.toLowerCase().includes(q),
    );
  }, [q, shortcuts]);

  const found = matches.filter(Boolean).length;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo việc muốn làm, hoặc theo phím"
          aria-label="Tìm phím tắt"
          className="h-11 min-w-0 flex-1 rounded-sm border border-rule bg-paper px-4"
        />

        {/* Nhóm nút chuyển hệ điều hành. Radio để bàn phím dùng được. */}
        <fieldset className="flex items-center gap-1 rounded-sm border border-rule p-1">
          <legend className="sr-only">Hệ điều hành</legend>
          {(["win", "mac"] as const).map((p) => (
            <label
              key={p}
              className={`cursor-pointer px-3 py-1 text-sm ${
                platform === p ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              <input
                type="radio"
                name="platform"
                checked={platform === p}
                onChange={() => setPlatform(p)}
                className="sr-only"
              />
              {p === "win" ? "Windows" : "macOS"}
            </label>
          ))}
        </fieldset>
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-ink-faint">
        {q === ""
          ? `${shortcuts.length} phím tắt`
          : `${found} / ${shortcuts.length} khớp với "${query}"`}
      </p>

      {groups.map((group) => {
        const rows = shortcuts
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => s.group === group);
        const groupHasMatch = rows.some(({ i }) => matches[i]);

        return (
          <section key={group} hidden={!groupHasMatch} className="mt-10">
            <h2 className="font-display text-xl">{group}</h2>
            <div className="mt-3 overflow-x-auto border border-rule">
              <table className="w-full border-collapse text-left">
                <thead className="sr-only">
                  <tr>
                    <th>Tổ hợp phím</th>
                    <th>Việc nó làm</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ s, i }) => (
                    <tr
                      key={s.action}
                      hidden={!matches[i]}
                      className="border-t border-rule first:border-t-0"
                    >
                      <td className="w-56 border-r border-rule px-4 py-2 align-top font-mono text-sm whitespace-nowrap">
                        {/*
                          Cả hai phiên bản đều nằm trong HTML; chỉ một cái hiện.
                          Ẩn bằng thuộc tính hidden chứ không bỏ khỏi DOM, để
                          bản Windows và bản macOS đều index được.
                        */}
                        <span hidden={platform !== "win"}>{s.win}</span>
                        <span hidden={platform !== "mac"}>{s.mac}</span>
                      </td>
                      <td className="px-4 py-2 text-ink-soft">{s.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {found === 0 && (
        <p className="mt-10 text-ink-soft">
          Không có phím tắt nào khớp. Thử gõ việc bạn muốn làm thay vì tên phím,
          ví dụ &ldquo;lọc&rdquo; hoặc &ldquo;định dạng ngày&rdquo;.
        </p>
      )}
    </div>
  );
}
