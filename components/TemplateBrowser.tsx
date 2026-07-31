"use client";

import { useId, useMemo, useState } from "react";
import { TemplateList } from "@/components/TemplateList";
import { DIFFICULTY_LABEL, type TemplateCardData } from "@/lib/schema";

/**
 * Bộ lọc thư viện, dựng theo AutoFilter của Excel.
 *
 * Trang này trước đây xổ thẳng ba khối theo nhóm việc. Với hai file thì đọc
 * được, với ba mươi sáu file thì thành một cột dài phải cuộn. Lọc ngay tại
 * chỗ nhanh hơn nhiều so với vào từng category rồi quay ra.
 *
 * Chạy phía client và không đụng tới URL: đây là thao tác lướt, không phải
 * trạng thái đáng chia sẻ hay đáng cho Google lập chỉ mục — mỗi nhóm việc đã
 * có sẵn một trang category riêng để làm việc đó.
 *
 * Ranh giới hệ thiết kế: các nút lọc nằm NGOÀI lưới bảng tính nên không được
 * dùng màu input / computed. Chọn rồi thì đảo nền sang ink, đơn giản vậy thôi.
 */

type Facet = { value: string; label: string; count: number };

function facetsOf(
  items: TemplateCardData[],
  pick: (t: TemplateCardData) => string[],
  label: (value: string) => string,
): Facet[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const value of pick(item)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function TemplateBrowser({
  templates,
  categoryDescriptions,
}: {
  templates: TemplateCardData[];
  categoryDescriptions: Record<string, string>;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [fn, setFn] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      facetsOf(
        templates,
        (t) => [t.category],
        (value) =>
          templates.find((t) => t.category === value)?.categoryName ?? value,
      ),
    [templates],
  );

  const functions = useMemo(
    () => facetsOf(templates, (t) => t.functions, (v) => v),
    [templates],
  );

  const difficulties = useMemo(
    () =>
      facetsOf(
        templates,
        (t) => [t.difficulty],
        (v) => DIFFICULTY_LABEL[v as keyof typeof DIFFICULTY_LABEL] ?? v,
      ),
    [templates],
  );

  const results = useMemo(() => {
    /*
     * Bỏ dấu trước khi so khớp: người dùng gõ "cham cong" phải ra "chấm công".
     * Gõ đủ dấu trên điện thoại là việc phiền, và không ai chịu gõ lại lần hai
     * chỉ vì bộ lọc khó tính.
     */
    const needle = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return templates.filter((t) => {
      if (category && t.category !== category) return false;
      if (difficulty && t.difficulty !== difficulty) return false;
      if (fn && !t.functions.includes(fn)) return false;
      if (!needle) return true;

      const haystack = `${t.h1} ${t.metaDesc} ${t.slug} ${t.functions.join(" ")}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [templates, query, category, fn, difficulty]);

  const filtered =
    Boolean(query.trim()) || category !== null || fn !== null || difficulty !== null;

  return (
    <div>
      {/* Ô tìm dựng theo thanh công thức, để nó thuộc cùng một thế giới. */}
      <div className="flex items-stretch border border-rule bg-panel">
        <label
          htmlFor={searchId}
          className="flex shrink-0 items-center border-r border-rule px-3 py-2 font-mono text-xs text-ink-faint"
        >
          TÌM
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="tên file, việc cần làm, hoặc tên hàm — vd: cham cong, VLOOKUP"
          className="min-w-0 flex-1 bg-paper px-3 py-2 focus:outline-none"
        />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <FacetRow
          legend="Nhóm việc"
          facets={categories}
          selected={category}
          onSelect={setCategory}
        />
        <FacetRow
          legend="Hàm Excel"
          facets={functions}
          selected={fn}
          onSelect={setFn}
        />
        <FacetRow
          legend="Độ khó"
          facets={difficulties}
          selected={difficulty}
          onSelect={setDifficulty}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-rule pb-3">
        <p className="cell-ref text-sm text-ink-faint tabular-nums">
          {results.length} / {templates.length} file
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
              setFn(null);
              setDifficulty(null);
            }}
            className="text-sm underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Bỏ hết bộ lọc
          </button>
        )}
      </div>

      {category && !query.trim() && (
        <p className="mt-4 max-w-prose text-ink-soft">
          {categoryDescriptions[category]}
        </p>
      )}

      {results.length > 0 ? (
        <div className="mt-6">
          <TemplateList templates={results} />
        </div>
      ) : (
        /*
         * Trạng thái rỗng vẽ thành một ô lỗi thật, bo góc 0 và font mono.
         * #N/A là thứ ai dùng Excel cũng từng gặp, nên nó nói "không tìm thấy"
         * nhanh hơn mọi câu chữ — và đúng quy ước: flag chỉ dành cho ô hỏng.
         */
        <div className="mt-6 border border-rule">
          <p className="border-b border-rule bg-panel px-3 py-2 font-mono text-xs text-ink-faint">
            A1
          </p>
          <div className="px-6 py-12 text-center">
            <p className="font-mono text-2xl text-flag">#N/A</p>
            <p className="mt-4 text-ink-soft">
              Không có file nào khớp. Thư viện mới có {templates.length} file
              nên còn nhiều việc chưa phủ tới.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FacetRow({
  legend,
  facets,
  selected,
  onSelect,
}: {
  legend: string;
  facets: Facet[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  if (facets.length < 2) return null;

  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Lọc theo {legend}</legend>
      <span aria-hidden className="w-20 shrink-0 text-sm text-ink-faint">
        {legend}
      </span>
      {facets.map((facet) => {
        const on = selected === facet.value;
        return (
          <button
            key={facet.value}
            type="button"
            aria-pressed={on}
            // Bấm lại lần nữa là bỏ chọn — không cần thêm một nút "tất cả".
            onClick={() => onSelect(on ? null : facet.value)}
            className={`rounded-sm border px-3 py-1 text-sm transition-colors ${
              on
                ? "border-ink bg-ink text-paper"
                : "border-rule hover:border-ink"
            }`}
          >
            {facet.label}
            <span
              className={`cell-ref ml-2 text-xs tabular-nums ${
                on ? "text-paper/60" : "text-ink-faint"
              }`}
            >
              {facet.count}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
