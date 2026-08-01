"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { cardGridClass, TemplateCard } from "@/components/TemplateCard";
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

/**
 * Hai kiểu hiển thị kết quả, và cả hai component đã có sẵn từ trước — thiếu
 * mỗi cái nút để người đọc tự chọn.
 *
 * Hai kiểu tồn tại vì đây là hai câu hỏi khác nhau. Người biết mình cần file gì
 * đang TRA: họ muốn dòng dày, quét dọc theo cột tên. Người mới vào đang DUYỆT:
 * họ chưa biết mình cần gì nên cần đoạn mô tả và dải cột của từng file. Ép cả
 * hai vào một kiểu thì luôn có một nhóm phải chịu thiệt.
 *
 * Mặc định là `list`, và điều đó phải giữ nguyên vì một lý do ngoài thẩm mỹ:
 * TemplateBrowser chạy phía client, nên HTML tĩnh mà crawler đọc chính là lần
 * render đầu tiên. Đổi mặc định sang `grid` là đổi luôn HTML của trang thư
 * viện — và TemplateList cố ý đẩy MỌI dòng vào HTML để link file không bị mất
 * khỏi bản tĩnh (xem chú thích bên đó).
 */
type View = "list" | "grid";

/*
 * Lựa chọn kiểu hiển thị sống trong localStorage, và component đọc nó qua
 * useSyncExternalStore chứ không qua useState + useEffect.
 *
 * Lý do không phải sở thích: localStorage không tồn tại lúc render trên server,
 * nên không thể đọc nó lúc khởi tạo state — mà chữa bằng cách setState trong
 * effect thì React 19 chặn thẳng (react-hooks/set-state-in-effect), vì đó là
 * một vòng render thừa. useSyncExternalStore sinh ra đúng cho hình này: nó
 * nhận một snapshot riêng cho server, nên lần render đầu ở hai bên khớp nhau
 * mà không cần vòng nào.
 *
 * Được thêm một thứ: nghe luôn sự kiện `storage`, nên mở hai tab thư viện thì
 * đổi kiểu ở tab này tab kia đổi theo.
 */
const VIEW_KEY = "mau-excel:view";

const viewListeners = new Set<() => void>();

function subscribeView(onChange: () => void) {
  viewListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    viewListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/* Trả về primitive nên useSyncExternalStore so sánh được bằng giá trị — không
   cần cache snapshot như khi trả về object. */
function readView(): View {
  return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
}

/* Snapshot phía server, và cũng là snapshot của lần render đầu khi hydrate.
   Phải là "list" — xem lý do SEO ở chú thích của type View. */
const serverView = (): View => "list";

function writeView(view: View) {
  localStorage.setItem(VIEW_KEY, view);
  // `storage` chỉ bắn sang tab KHÁC, nên tab đang thao tác phải tự báo.
  for (const onChange of viewListeners) onChange();
}

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
  const view = useSyncExternalStore(subscribeView, readView, serverView);
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
        <div className="flex items-center gap-4">
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
          <ViewToggle view={view} onSelect={writeView} />
        </div>
      </div>

      {category && !query.trim() && (
        <p className="mt-4 max-w-prose text-ink-soft">
          {categoryDescriptions[category]}
        </p>
      )}

      {results.length > 0 ? (
        <div className="mt-6">
          {view === "list" ? (
            <TemplateList templates={results} />
          ) : (
            /*
              Lưới card KHÔNG phân trang, khác danh sách. Phân trang nằm trong
              TemplateList cùng với dải tab sheet của nó, và lôi ra dùng chung
              thì phải tách state ra khỏi cả hai — chưa đáng ở quy mô thư viện
              hiện tại. Mốc phải xem lại: khoảng 40 file, lúc lưới vượt 13 hàng.
            */
            <ul className={cardGridClass(results.length)}>
              {results.map((template) => (
                <TemplateCard key={template.slug} template={template} />
              ))}
            </ul>
          )}
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

/**
 * Chuyển giữa danh sách và lưới card.
 *
 * Đảo nền sang ink khi chọn, giống hệt nút lọc — cả hai đứng NGOÀI lưới bảng
 * tính nên theo quy ước của tầng biên tập. Cố ý ngược chiều với dải tab sheet
 * dưới đáy danh sách (tab đang mở là tab SÁNG), vì dải tab là một phần của
 * chính bảng tính còn nút này thì không.
 *
 * Hai nút dính liền trong một khung thay vì rời nhau: chúng loại trừ nhau, mà
 * hai nút rời đọc ra là hai thao tác độc lập.
 */
function ViewToggle({
  view,
  onSelect,
}: {
  view: View;
  onSelect: (view: View) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Kiểu hiển thị"
      className="flex shrink-0 overflow-hidden rounded-sm border border-rule"
    >
      <ViewButton on={view === "list"} onClick={() => onSelect("list")}>
        Danh sách
      </ViewButton>
      <ViewButton on={view === "grid"} onClick={() => onSelect("grid")}>
        Lưới
      </ViewButton>
    </div>
  );
}

function ViewButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`px-3 py-1 text-sm transition-colors ${
        on ? "bg-ink text-paper" : "text-ink-soft hover:bg-panel"
      }`}
    >
      {children}
    </button>
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
