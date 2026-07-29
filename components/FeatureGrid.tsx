import type { ReactNode } from "react";

type Feature = {
  title: string;
  body: string;
  /**
   * Mảnh bảng tính minh họa đặt dưới đáy thẻ. Nó phải diễn lại đúng câu tiêu đề
   * bằng vật thật (thanh fx, ô kiểm, biểu đồ) chứ không phải một icon minh họa
   * chung chung — thẻ nào không nghĩ ra được vật thật thì để trống còn hơn.
   */
  visual: ReactNode;
};

/*
 * Hình ở đây thuộc phương ngữ bảng tính: bo góc 0, font mono, và hai màu mang
 * nghĩa — xanh dương "bạn gõ vào", xanh lá "Excel tự tính". Chúng được dùng ở
 * đúng nghĩa đó (ô công thức, ô kiểm công thức), không dùng làm màu nhấn.
 * Những chi tiết không phải ô bảng tính — thanh tải, cột biểu đồ — nằm ở tầng
 * biên tập nên chỉ dùng ink.
 */

/** Thanh fx thật của Excel: hộp tên ô, nhãn fx, công thức gõ dần ra. */
function FormulaBarVisual() {
  return (
    <div className="border border-rule bg-paper">
      <div className="flex items-stretch text-xs">
        <span className="flex w-10 shrink-0 items-center justify-center border-r border-rule py-1.5 font-mono text-ink-soft">
          B9
        </span>
        <span className="flex shrink-0 items-center border-r border-rule px-2 py-1.5 font-mono text-ink-faint italic">
          fx
        </span>
        <span className="flex min-w-0 flex-1 items-center px-2 py-1.5">
          {/*
            Bề rộng phải đặt cứng theo số ký tự: animation gõ chữ chạy từ
            width 0 tới giá trị tĩnh, mà width:auto thì trình duyệt không nội
            suy được. Font mono nên 9ch khớp đúng "=B4-B5-B8".
          */}
          <code
            className="fx-type inline-block overflow-hidden whitespace-nowrap align-middle text-computed"
            style={{ width: "9ch" }}
          >
            =B4-B5-B8
          </code>
          <span
            aria-hidden
            className="fx-caret ml-px inline-block h-3.5 w-px bg-computed"
          />
        </span>
      </div>
      <div className="flex border-t border-rule text-xs">
        <span className="flex-1 border-r border-rule px-2 py-1.5 text-ink-soft">
          Thực lĩnh
        </span>
        <span className="relative w-28 bg-computed-bg px-2 py-1.5 text-right font-mono tabular-nums text-computed">
          <span
            aria-hidden
            className="absolute top-0 right-0 h-0 w-0 border-t-[5px] border-l-[5px] border-t-computed border-l-transparent"
          />
          17.510.000
        </span>
      </div>
    </div>
  );
}

/** Một lượt kiểm công thức, ba dòng tick dần từ trên xuống. */
function CheckRunVisual() {
  const checks = ["=B4-B5-B6", "=MAX(0,B4-B5)", "=IF(B7<=1E7,...)"];

  return (
    <div className="border border-rule bg-paper">
      {checks.map((formula, i) => (
        <div
          key={formula}
          className="fx-row flex items-center justify-between gap-2 border-b border-rule bg-computed-bg px-2 py-1.5 font-mono text-xs text-computed"
          style={{ animationDelay: `${i * 110}ms` }}
        >
          <code className="truncate">{formula}</code>
          <span aria-hidden>✓</span>
        </div>
      ))}
      <div
        className="fx-row flex items-center justify-between px-2 py-1.5 font-mono text-xs text-ink-soft"
        style={{ animationDelay: "330ms" }}
      >
        <span>bang-tinh-luong.xlsx</span>
        <span className="tabular-nums">18/18 ô khớp</span>
      </div>
    </div>
  );
}

/** File chạy thẳng về máy, và cái ô email mà trang này không hỏi. */
function DownloadVisual() {
  return (
    <div className="border border-rule bg-paper p-2">
      <div className="flex items-baseline justify-between font-mono text-xs">
        <span className="truncate text-ink">bang-tinh-luong.xlsx</span>
        <span className="shrink-0 pl-2 tabular-nums text-ink-faint">48 KB</span>
      </div>
      <div aria-hidden className="mt-1.5 h-1 bg-rule">
        <div className="fx-fill h-full w-full bg-ink" />
      </div>
      <div
        aria-hidden
        className="mt-2 flex items-center gap-2 border border-dashed border-rule px-2 py-1"
      >
        <span className="flex-1 truncate font-mono text-xs text-ink-faint line-through">
          email của bạn
        </span>
        <span className="shrink-0 font-mono text-[11px] text-ink-faint">
          không hỏi
        </span>
      </div>
    </div>
  );
}

/** Cùng một biểu đồ, vẽ hai lần — đó là toàn bộ luận điểm về tính di động. */
function PortabilityVisual() {
  const bars = [46, 72, 58, 92];
  const panes = ["Excel", "Google Sheets"];

  return (
    <div className="flex gap-2">
      {panes.map((pane, paneIndex) => (
        <div key={pane} className="min-w-0 flex-1 border border-rule bg-paper">
          <div className="flex h-16 items-end gap-1.5 border-b border-rule p-2">
            {bars.map((height, i) => (
              <span
                key={height}
                className="fx-bar flex-1 bg-ink/70"
                style={{
                  height: `${height}%`,
                  animationDelay: `${paneIndex * 90 + i * 70}ms`,
                }}
              />
            ))}
          </div>
          <div className="truncate bg-panel px-2 py-1 font-mono text-[11px] text-ink-faint">
            {pane}
          </div>
        </div>
      ))}
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    title: "Công thức luôn phơi ra, không khóa",
    body: "Không có sheet ẩn, không có mật khẩu bảo vệ. Bấm vào ô nào cũng thấy công thức chạy bằng gì.",
    visual: <FormulaBarVisual />,
  },
  {
    title: "Kiểm tra bằng máy trước khi đăng",
    body: "Mỗi file chạy qua một lượt kiểm công thức tự động trước khi lên trang, để số không lệch khi bạn đổi input.",
    visual: <CheckRunVisual />,
  },
  {
    title: "Tải thẳng, không email, không tường chắn",
    body: "Bấm tải là ra file .xlsx. Không đăng ký, không để lại email, không chuỗi thư nhắc mua hàng.",
    visual: <DownloadVisual />,
  },
  {
    title: "Mở được cả Excel lẫn Google Sheets",
    body: "Không dùng add-in hay macro riêng của một nền tảng, nên file mở đâu cũng chạy đúng công thức.",
    visual: <PortabilityVisual />,
  },
];

/**
 * Gom các tuyên bố đang rải rác trong văn xuôi (hero, band coral) thành một
 * khối scannable, đặt ngay sau demo sống để củng cố luận điểm vừa chứng minh.
 *
 * Mỗi thẻ kèm một mảnh bảng tính diễn lại câu của nó. Hình là minh họa lặp lại
 * chữ đã có ngay bên trên nên để aria-hidden — đọc màn hình nghe hai lần cùng
 * một ý là nhiễu, không phải thêm thông tin.
 */
export function FeatureGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {FEATURES.map((feature) => (
        <li
          key={feature.title}
          className="feature-card flex flex-col rounded-md border border-rule bg-panel p-6 sm:p-8"
        >
          <h3 className="font-display text-lg font-medium text-balance">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm text-ink-soft">{feature.body}</p>
          {/* mt-auto: hai thẻ cạnh nhau có tiêu đề dài ngắn khác nhau, để hình
              đáy thẳng hàng thì lưới mới đọc ra là một hàng. */}
          <div aria-hidden className="mt-auto pt-6">
            {feature.visual}
          </div>
        </li>
      ))}
    </ul>
  );
}
