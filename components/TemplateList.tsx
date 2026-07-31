"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SheetShape } from "@/components/SheetThumb";
import { DIFFICULTY_LABEL, type TemplateCardData } from "@/lib/schema";

/**
 * Danh sách file dựng theo một vùng dữ liệu của bảng tính: mỗi file là một
 * DÒNG, có số thứ tự ở gutter trái đúng như row header của Excel.
 *
 * Vì sao không dùng lưới card ở đây: card cao ~190px, 18 file thành 6 hàng
 * ≈ 1150px và còn tệ hơn khi thư viện lớn lên (40 file ≈ 2700px). Dòng cao
 * ~44px nên cùng 18 file chỉ còn ~800px — nhưng cái được lớn hơn là mắt quét
 * dọc theo cột thay vì đọc 18 đoạn văn rời.
 *
 * Cái mất: metaDesc không lên danh sách nữa. Đó là đánh đổi cố ý — ở tầng
 * danh sách người ta đang tìm TÊN việc mình cần, phần mô tả chờ ở trang file.
 * Lưới card vẫn giữ nguyên cho "File mới nhất" ngoài trang chủ, chỗ chỉ có 6
 * file và cần bán chứ không cần tra.
 *
 * Header row dính khi cuộn (freeze panes). Được phép dính vì nav của site
 * không dính — nếu sau này nav thành sticky thì phải bù `top` ở đây.
 *
 * Cắt trang 10 dòng một, chuyển trang bằng dải tab dưới đáy — xem SheetTabs.
 * Component chạy phía client vì phân trang là trạng thái, nên trang category
 * phải truyền xuống TemplateCardData chứ đừng truyền Template đầy đủ: cả
 * `sheets` sẽ bị serialize vào HTML, hàng chục KB không ai đọc ở tầng này.
 */

const PAGE_SIZE = 10;

/*
 * Lưới cột khai báo một chỗ rồi dùng cho cả header lẫn dòng: hai chuỗi class
 * rời nhau là kiểu lỗi lệch cột chỉ lộ ra khi đọc bằng mắt trên trình duyệt.
 *
 * Cột "Hàm dùng" biến mất dưới md — nó là thông tin để lọc chứ không phải để
 * quyết định, mà dưới 768px thì tên file cần hết chỗ còn lại. Ô ẩn bằng
 * `hidden` rời khỏi luồng grid nên số cột tự khớp, không cần lưới riêng.
 */
const ROW =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_5.5rem] items-baseline gap-x-4 px-3 md:grid-cols-[2.25rem_minmax(0,1fr)_11.5rem_4.25rem_5.5rem]";

export function TemplateList({
  templates,
}: {
  templates: TemplateCardData[];
}) {
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * Lọc lại thì phải về trang 1: đang ở trang 3 mà bộ lọc rút kết quả xuống
   * còn 4 file thì người dùng nhìn thấy một bảng rỗng và tưởng là không có gì
   * khớp. Chỉnh state ngay trong lúc render là cách React khuyến nghị cho
   * "reset khi prop đổi" — rẻ hơn useEffect vì không phải vẽ ra rồi vẽ lại.
   *
   * So sánh bằng identity chạy đúng ở đây vì `results` bên TemplateBrowser đi
   * ra từ useMemo, tức chỉ đổi tham chiếu khi bộ lọc thật sự đổi.
   */
  const [seen, setSeen] = useState(templates);
  if (seen !== templates) {
    setSeen(templates);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(templates.length / PAGE_SIZE));
  // Kẹp lại phòng khi số trang co lại trước lúc state kịp reset.
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  function goTo(next: number) {
    setPage(next);

    /*
     * Dải tab nằm dưới đáy bảng, nên sau khi bấm thì đầu bảng thường đã trôi
     * lên trên khung nhìn — không kéo về thì trang mới hiện ra ở chỗ không ai
     * nhìn. Chỉ kéo khi đầu bảng thật sự nằm trên khung nhìn, để người đang
     * thấy cả bảng không bị giật màn hình vô cớ.
     */
    const top = containerRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      containerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div ref={containerRef} className="border border-rule bg-paper">
      {/*
        Nhãn cột là chú thích cho thứ đã đọc được ngay trong dòng, nên trình
        đọc màn hình bỏ qua: mỗi dòng đã là một link tự nói đủ nghĩa.
      */}
      <div
        aria-hidden
        className={`${ROW} sticky top-0 z-10 border-b border-rule bg-panel py-2 font-mono text-[0.7rem] tracking-wide text-ink-faint uppercase`}
      >
        <span className="text-right">#</span>
        <span>Tên file</span>
        <span className="hidden md:block">Hàm dùng</span>
        {/* "Cột tự tính" xuống hai dòng ở cột 4.25rem, mà nhãn cột dài hơn
            chính hàng dữ liệu nó chú thích thì đội cao cả dải header dính. */}
        <span className="hidden md:block">Tự tính</span>
        <span>Độ khó</span>
      </div>

      {/*
        MỌI dòng đều vào HTML, dòng ngoài trang hiện tại chỉ bị ẩn bằng CSS —
        không cắt mảng. Trang này sống bằng tìm kiếm, mà cắt mảng thì 8 link
        file nằm ngoài trang 1 biến mất khỏi HTML tĩnh; link trong phần tử ẩn
        thì crawler vẫn đọc và vẫn đi theo. Đổi lại là vài KB HTML, rẻ.
      */}
      {/*
        Không phân trang thì dòng cuối bỏ viền dưới, để nó không chồng lên viền
        đáy khung thành một nét 2px. Có phân trang thì giữ nguyên: viền dưới của
        dòng cuối chính là nét ngăn với dải tab, nên dải tab không tự vẽ viền.
      */}
      <ul className={totalPages > 1 ? undefined : "[&>li:last-child]:border-b-0"}>
        {templates.map((template, index) => (
          <li
            key={template.slug}
            hidden={index < start || index >= end}
            className="border-b border-rule"
          >
            <Link href={template.href} className={`${ROW} py-2.5 hover:bg-panel`}>
              {/*
                Số dòng đánh liên tục xuyên suốt các trang (trang 2 bắt đầu từ
                11), đúng như cuộn xuống một vùng dữ liệu dài — không phải đếm
                lại từ 1 mỗi trang.
              */}
              <span className="text-right font-mono text-xs text-ink-faint tabular-nums">
                {index + 1}
              </span>

              <span className="font-medium text-pretty">{template.h1}</span>

              {/*
                Cắt còn 3 hàm rồi đếm phần dư: cột rộng cố định, để tràn thì
                dòng bên dưới lệch theo và cả vùng hết ra hình bảng tính.
              */}
              <span className="hidden gap-x-2 overflow-hidden md:flex">
                {template.functions.slice(0, 3).map((fn) => (
                  <span key={fn} className="cell-ref text-xs text-computed">
                    {fn}
                  </span>
                ))}
                {template.functions.length > 3 && (
                  <span className="cell-ref text-xs text-ink-faint">
                    +{template.functions.length - 3}
                  </span>
                )}
              </span>

              {/*
                Dải ô cho biết file này phần lớn là chỗ bạn nhập hay phần lớn
                là chỗ Excel tính. Ẩn dưới md cùng lúc với cột hàm, vì lý do
                giống hệt: dưới 768px tên file cần hết chỗ còn lại.

                self-center chứ không theo baseline như các ô chữ khác — dải ô
                không có đường chân chữ để canh, để nguyên thì nó treo lệch lên
                so với cả dòng.
              */}
              <span className="hidden self-center md:flex">
                <SheetShape shape={template.shape} />
              </span>

              <span className="text-xs text-ink-faint">
                {DIFFICULTY_LABEL[template.difficulty]}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <SheetTabs current={current} total={totalPages} onGoTo={goTo} />
      )}
    </div>
  );
}

/**
 * Chuyển trang dựng theo dải tab sheet dưới đáy workbook: cặp mũi tên điều
 * hướng bên trái, rồi các tab nối nhau bằng viền 1px. Tab đang mở là tab
 * SÁNG trên nền panel xám — đúng chiều tương phản của Excel, và ngược với các
 * nút lọc (chọn thì đảo nền sang ink) vì hai thứ này ở hai thế giới: nút lọc
 * đứng ngoài lưới, dải tab là một phần của chính bảng tính.
 *
 * Dải tab cuộn ngang được. Thư viện lớn lên thì số tab tăng theo, mà đó cũng
 * đúng là cách Excel xử lý workbook nhiều sheet.
 */
function SheetTabs({
  current,
  total,
  onGoTo,
}: {
  current: number;
  total: number;
  onGoTo: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Phân trang danh sách file"
      className="flex items-stretch bg-panel"
    >
      <div className="flex shrink-0 border-r border-rule">
        <ArrowButton
          label="Trang trước"
          disabled={current === 1}
          onClick={() => onGoTo(current - 1)}
        >
          ◀
        </ArrowButton>
        <ArrowButton
          label="Trang sau"
          disabled={current === total}
          onClick={() => onGoTo(current + 1)}
        >
          ▶
        </ArrowButton>
      </div>

      <ul className="flex min-w-0 flex-1 overflow-x-auto">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const on = n === current;
          return (
            <li key={n} className="shrink-0">
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => onGoTo(n)}
                /* Viền trên 2px luôn có mặt, tab không hoạt động thì để trong
                   suốt — nếu chỉ tab đang mở mới có viền thì chữ của nó tụt
                   xuống 2px so với các tab bên cạnh. */
                className={`border-t-2 border-r border-r-rule px-4 py-2 text-sm whitespace-nowrap ${
                  on
                    ? "border-t-ink bg-paper font-medium text-ink"
                    : "border-t-transparent text-ink-soft hover:bg-paper/60"
                }`}
              >
                Trang <span className="tabular-nums">{n}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-2 text-xs text-ink-soft hover:bg-paper/60 disabled:text-ink-faint disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
