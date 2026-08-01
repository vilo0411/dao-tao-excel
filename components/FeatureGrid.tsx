"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

type Feature = {
  title: string;
  body: string;
  /**
   * Mảnh bảng tính minh họa hiện ở cột phải khi mục này đang mở. Nó phải diễn
   * lại đúng câu tiêu đề bằng vật thật (thanh fx, ô kiểm, biểu đồ) chứ không
   * phải một icon minh họa chung chung — mục nào không nghĩ ra được vật thật
   * thì bỏ mục đó còn hơn.
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
      <div className="flex items-stretch text-base">
        <span className="flex w-16 shrink-0 items-center justify-center border-r border-rule py-3.5 font-mono text-ink-soft">
          B9
        </span>
        <span className="flex shrink-0 items-center border-r border-rule px-3 py-3.5 font-mono text-ink-faint italic">
          fx
        </span>
        <span className="flex min-w-0 flex-1 items-center px-3 py-3.5">
          {/*
            Bề rộng phải đặt cứng theo số ký tự: animation gõ chữ chạy từ
            width 0 tới giá trị tĩnh, mà width:auto thì trình duyệt không nội
            suy được. Font mono nên 9ch khớp đúng "=B4-B5-B8".

            Con số đi qua biến --fx-w chứ không gõ thẳng vào width, vì vòng lặp
            cần một mốc "đã gõ xong" để giữ trong lúc chờ — mà keyframe thì
            không đọc được giá trị tĩnh của phần tử khi nó phải nêu cả hai đầu.
          */}
          <code
            className="fx-type inline-block overflow-hidden whitespace-nowrap align-middle text-computed"
            style={{ "--fx-w": "9ch", width: "var(--fx-w)" } as CSSProperties}
          >
            =B4-B5-B8
          </code>
          <span
            aria-hidden
            className="fx-caret ml-px inline-block h-5 w-px bg-computed"
          />
        </span>
      </div>
      <div className="flex border-t border-rule text-base">
        <span className="flex-1 border-r border-rule px-3 py-3.5 text-ink-soft">
          Thực lĩnh
        </span>
        <span className="relative w-40 bg-computed-bg px-3 py-3.5 text-right font-mono tabular-nums text-computed">
          <span
            aria-hidden
            className="absolute top-0 right-0 h-0 w-0 border-t-8 border-l-8 border-t-computed border-l-transparent"
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
          className="fx-row flex items-center justify-between gap-2 border-b border-rule bg-computed-bg px-4 py-3.5 font-mono text-base text-computed"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <code className="truncate">{formula}</code>
          <span aria-hidden>✓</span>
        </div>
      ))}
      <div
        className="fx-row flex items-center justify-between px-4 py-3.5 font-mono text-base text-ink-soft"
        style={{ animationDelay: "225ms" }}
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
    <div className="border border-rule bg-paper p-4">
      <div className="flex items-baseline justify-between font-mono text-base">
        <span className="truncate text-ink">bang-tinh-luong.xlsx</span>
        <span className="shrink-0 pl-2 tabular-nums text-ink-faint">48 KB</span>
      </div>
      <div aria-hidden className="mt-3 h-2 bg-rule">
        <div className="fx-fill h-full w-full bg-ink" />
      </div>
      <div
        aria-hidden
        className="mt-4 flex items-center gap-2 border border-dashed border-rule px-3 py-2"
      >
        <span className="flex-1 truncate font-mono text-base text-ink-faint line-through">
          email của bạn
        </span>
        <span className="shrink-0 font-mono text-sm text-ink-faint">
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
    <div className="flex gap-3">
      {panes.map((pane, paneIndex) => (
        <div key={pane} className="min-w-0 flex-1 border border-rule bg-paper">
          <div className="flex h-40 items-end gap-2 border-b border-rule p-4">
            {bars.map((height, i) => (
              <span
                key={height}
                className="fx-bar flex-1 bg-ink/70"
                style={{
                  height: `${height}%`,
                  animationDelay: `${paneIndex * 60 + i * 45}ms`,
                }}
              />
            ))}
          </div>
          <div className="truncate bg-panel px-3 py-2 font-mono text-sm text-ink-faint">
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
 * khối scannable, đặt sau demo sống để củng cố luận điểm vừa chứng minh.
 *
 * Hình dáng là accordion hai cột: trái là danh sách tiêu đề, mục đang mở nhả
 * thêm đoạn mô tả; phải là mảnh bảng tính diễn lại đúng câu đó. Lưới bốn thẻ
 * cũ bắt người đọc chọn giữa bốn hình cùng nhấp nháy một lúc; ở đây mỗi lúc
 * chỉ có một hình chạy, nên mắt biết phải nhìn đâu.
 *
 * Không có timer nào trong file này: thanh tiến trình trên mục đang mở CHÍNH
 * là đồng hồ. Nó chạy hết một vòng CSS rồi `onAnimationEnd` chuyển mục. Nhờ
 * vậy tạm dừng là tạm dừng thật (`animation-play-state`) — thanh dừng ở đúng
 * chỗ nó đang tới, chứ không phải thanh đứng im trong khi một setTimeout vẫn
 * đếm ngầm rồi nhảy mục giữa lúc người ta đang đọc.
 *
 * Hình đọc màn hình không thấy: nó chỉ lặp lại chữ đã có ngay bên trái, nghe
 * hai lần cùng một ý là nhiễu chứ không phải thêm thông tin.
 */
export function FeatureGrid() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = () => setActive((i) => (i + 1) % FEATURES.length);

  return (
    /*
      Rê chuột hoặc tab vào bất cứ đâu trong khối đều dừng, không chỉ riêng cột
      phải: người đang đọc mô tả ở cột trái cũng là người đang đọc, mà mục tự
      trôi giữa câu thì khó chịu hơn là tiện.

      onFocus/onBlur ở đây là bản React của focusin/focusout — chúng nổi bọt từ
      các nút bên trong, nên bàn phím được đối xử y như chuột.
    */
    <div
      data-fx-paused={paused ? "true" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10"
    >
      <ul className="border-y border-rule">
        {FEATURES.map((feature, i) => {
          const isActive = i === active;
          const panelId = `feature-panel-${i}`;

          return (
            <li
              key={feature.title}
              className="relative border-b border-rule last:border-b-0"
            >
              {/*
                Thanh tiến trình vừa là đồng hồ vừa là lời hứa: nó cho người
                đọc biết mục sẽ tự trôi, và trôi sau bao lâu. Không có nó thì
                mục tự đổi đọc ra như trang bị lỗi.

                key={active} để mỗi lần đổi mục là một phần tử mới — animation
                chạy lại từ 0 thay vì tiếp tục vòng cũ.
              */}
              {isActive && (
                <span
                  key={active}
                  aria-hidden
                  onAnimationEnd={() => {
                    // prefers-reduced-motion bị rút mọi animation về 0.01ms ở
                    // globals.css, nên nếu vẫn nghe sự kiện này thì mục sẽ
                    // nhảy vài chục lần một giây. Ai đã tắt chuyển động thì
                    // tự bấm chọn mục.
                    if (
                      window.matchMedia("(prefers-reduced-motion: reduce)")
                        .matches
                    ) {
                      return;
                    }
                    next();
                  }}
                  className="fx-progress absolute inset-x-0 top-0 h-1 origin-left bg-coral"
                />
              )}

              <h3>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  className="flex w-full items-center gap-4 py-6 text-left"
                >
                  {/*
                    Số thứ tự đặt trong ô viền như đầu dòng của Excel — đây là
                    chỗ duy nhất trên trang có một danh sách được đánh số, nên
                    mượn luôn ký hiệu người dùng Excel đã quen.
                  */}
                  <span
                    aria-hidden
                    className={`flex size-8 shrink-0 items-center justify-center border font-mono text-sm tabular-nums ${
                      isActive
                        ? "border-ink bg-ink text-paper"
                        : "border-rule bg-panel text-ink-faint"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`font-display flex-1 text-xl font-medium text-balance lg:text-2xl ${
                      isActive ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {feature.title}
                  </span>
                </button>
              </h3>

              {/*
                grid-rows 0fr → 1fr là cách mở/đóng có chuyển động mà không phải
                đo chiều cao bằng JS. Ô con buộc phải overflow-hidden, nếu không
                chữ tràn ra ngoài lúc đang đóng.
              */}
              <div
                id={panelId}
                role="region"
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-prose pr-4 pb-6 pl-12 text-base text-ink-soft">
                    {feature.body}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/*
        Khung hình neo cứng chiều cao: bốn mảnh bảng tính cao thấp khác nhau,
        không neo thì mỗi lần đổi mục là cả cột trái nhảy theo trên mobile.

        key={active} để hình được dựng lại từ đầu mỗi lần đổi mục — animation
        trong hình chạy lại từ đầu, khớp với thời điểm người đọc vừa nhìn sang.
      */}
      <div
        aria-hidden
        className="flex min-h-[28rem] items-center justify-center rounded-md border border-rule bg-panel p-8 sm:p-12 lg:sticky lg:top-24 lg:min-h-[32rem]"
      >
        {/* Không có trần max-w: hình là nhân vật chính của cột này, để nó ăn
            hết bề ngang. Chỉ chặn ở max-w-xl cho màn rất rộng, quá cỡ đó thì
            mảnh bảng tính bắt đầu đọc ra như một cái bảng thật bị phóng to. */}
        <div key={active} className="w-full max-w-xl">
          {FEATURES[active].visual}
        </div>
      </div>
    </div>
  );
}
