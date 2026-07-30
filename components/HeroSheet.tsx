"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  DEMO_FORMULA,
  GIAM_TRU_BAN_THAN,
  GIAM_TRU_PHU_THUOC,
  TY_LE_BAO_HIEM,
  tinhThue,
} from "@/lib/thue-tncn";

/**
 * Bảng tính lương chạy thật, đặt ngay dưới hero trang chủ.
 *
 * Cả site chỉ có một luận điểm: file ở đây phơi công thức ra thay vì giấu đi.
 * Nói câu đó bằng chữ thì ai cũng nói được — nên trang chủ đưa luôn một bảng
 * sửa được. Người đọc kéo lương lên, thấy năm ô xanh lá tự nhảy theo, bấm vào
 * một ô thì công thức hiện ở thanh fx. Đó là toàn bộ sản phẩm, gói trong mười
 * giây đầu tiên, không cần tải gì.
 *
 * Con số và công thức lấy đúng từ data/templates/nhan-su/bang-tinh-luong-nhan-vien.json.
 * Bảng dưới đây là bản dựng đứng, rút gọn còn một nhân viên; file thật là bảng
 * ngang nhiều dòng. Hằng số thuế và chuỗi công thức nằm ở lib/thue-tncn.ts, và
 * npm run validate đối chiếu chúng với spec JSON — sửa lệch một bên là gãy ở
 * đó, không phải chờ ai đọc lại trang chủ mới phát hiện.
 *
 * Vùng này thuộc phương ngữ bảng tính: bo góc 0, font mono, chỉ dùng
 * input (ô người dùng gõ) và computed (ô Excel tự tính).
 */

const dong = new Intl.NumberFormat("vi-VN");

type Row = {
  ref: string;
  label: string;
  value: number;
  formula?: string;
  strong?: boolean;
};

export function HeroSheet({ templateHref }: { templateHref?: string }) {
  const [luongCoBan, setLuongCoBan] = useState(18_000_000);
  const [phuCap, setPhuCap] = useState(2_000_000);
  const [phuThuoc, setPhuThuoc] = useState(0);

  /*
   * Ô đang xem công thức đến từ hai đường, và phải tách ra vì tuổi thọ khác
   * nhau: hover là tạm (rời chuột là mất), ghim là do người đọc chủ động bấm.
   *
   * Không có ghim thì công thức thuế TNCN — chuỗi IF lồng 5 tầng, dài hơn
   * thanh fx — coi như không đọc được: muốn cuộn ngang thanh fx thì phải rời
   * chuột khỏi ô, mà rời chuột là công thức biến mất. Ghim xong nó ở lại, và
   * được phép xuống dòng thay vì cuộn.
   */
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = pinned ?? hovered;

  /*
   * Đổi mỗi lần một ô nhập thay đổi, dùng làm key cho ô kết quả. React dựng
   * lại phần tử đó nên animation chớp sáng chạy lại từ đầu — nếu chỉ đổi
   * nội dung, animation đã chạy xong sẽ không tự khởi động lại.
   */
  const [pulse, setPulse] = useState(0);
  const bumped = <T,>(set: (v: T) => void) => (value: T) => {
    set(value);
    setPulse((n) => n + 1);
  };

  /*
   * Làm tròn ngay trong chuỗi tính, không để dành tới lúc render.
   *
   * Làm tròn ở render thì mỗi ô tròn riêng còn phép tính chạy trên số lẻ, nên
   * người đọc lấy máy tính bấm lại đúng những số đang nhìn thấy sẽ ra lệch 1
   * đồng so với ô B9 (ví dụ lương 1.001.300: 3.001.300 − 105.137 − 0 =
   * 2.896.163, mà ô B9 hiện 2.896.164). Ở một trang có thanh fx ghi rõ
   * "=B4-B5-B8" thì lệch đó phá đúng thứ trang đang muốn chứng minh.
   *
   * Đây cũng là cách file thật làm: tiền đi qua ROUND ở từng bước.
   */
  const tongThuNhap = luongCoBan + phuCap;
  const baoHiem = Math.round(luongCoBan * TY_LE_BAO_HIEM);
  const giamTru = GIAM_TRU_BAN_THAN + phuThuoc * GIAM_TRU_PHU_THUOC;
  const thuNhapTinhThue = Math.max(0, tongThuNhap - baoHiem - giamTru);
  const thueTNCN = Math.round(tinhThue(thuNhapTinhThue));
  const thucLinh = tongThuNhap - baoHiem - thueTNCN;

  const rows: Row[] = [
    {
      ref: "B4",
      label: "Tổng thu nhập",
      value: tongThuNhap,
      formula: DEMO_FORMULA.B4,
    },
    {
      ref: "B5",
      label: "Bảo hiểm (10,5%)",
      value: baoHiem,
      formula: DEMO_FORMULA.B5,
    },
    {
      ref: "B6",
      label: "Giảm trừ gia cảnh",
      value: giamTru,
      formula: DEMO_FORMULA.B6,
    },
    {
      ref: "B7",
      label: "Thu nhập tính thuế",
      value: thuNhapTinhThue,
      formula: DEMO_FORMULA.B7,
    },
    { ref: "B8", label: "Thuế TNCN", value: thueTNCN, formula: DEMO_FORMULA.B8 },
    {
      ref: "B9",
      label: "Thực lĩnh",
      value: thucLinh,
      formula: DEMO_FORMULA.B9,
      strong: true,
    },
  ];

  const activeRow = rows.find((r) => r.ref === active);

  return (
    <figure
      className="not-prose"
      // Esc là đường thoát quen tay cho mọi thứ đang ghim. Đặt ở cấp figure để
      // bấm Esc khi đang đứng ở ô nào cũng nhả được.
      onKeyDown={(e) => {
        if (e.key === "Escape") setPinned(null);
      }}
    >
      {/* Thanh công thức, dựng đúng như Excel: hộp tên ô, nhãn fx, nội dung. */}
      <div className="flex items-stretch border border-b-0 border-rule bg-panel text-sm">
        <span className="flex w-14 shrink-0 items-center justify-center border-r border-rule px-2 py-2 font-mono text-xs text-ink-soft">
          {active ?? "—"}
        </span>
        <span className="flex shrink-0 items-center border-r border-rule px-3 py-2 font-mono text-xs text-ink-faint italic">
          fx
        </span>
        {/*
          Ô đang ghim thì công thức được xuống dòng, ô chỉ đang hover thì cuộn
          ngang. Lý do ở khối state phía trên: chuỗi IF 5 tầng của thuế TNCN dài
          hơn thanh fx, mà cuộn ngang đòi rời chuột khỏi ô — nên chỉ bản ghim
          mới đọc trọn được, và nó được phép cao thêm vài dòng.
        */}
        {/*
          Không đặt aria-live ở vùng này. Nó đổi theo cả hover, nên rê chuột
          ngang bảng là bắn liên tiếp sáu thông báo, trong đó có chuỗi IF 5
          tầng đọc mất cả phút. Công thức đã nằm trong nhãn của từng nút ô nên
          người dùng bàn phím vẫn nghe được — nhưng chỉ khi họ hỏi tới. Thứ
          duy nhất đáng thông báo tự động là dòng chốt, để ở cuối figure.
        */}
        <output
          className={`flex min-w-0 flex-1 items-baseline gap-3 px-3 py-2 ${
            pinned ? "" : "overflow-x-auto"
          }`}
        >
          {activeRow ? (
            <>
              <code
                className={`text-computed ${
                  pinned ? "break-all whitespace-pre-wrap" : "whitespace-pre"
                }`}
              >
                {activeRow.formula}
              </code>
              {pinned && (
                <span className="ml-auto hidden shrink-0 text-xs text-ink-faint sm:inline">
                  bấm lại hoặc Esc để bỏ ghim
                </span>
              )}
            </>
          ) : (
            /*
              Câu này từng nói "ô xanh dương / ô xanh lá". Người mù màu đỏ-lục
              đọc xong không hành động được, mà câu dài cũng wrap hai dòng trên
              mobile khiến thanh fx đổi chiều cao ngay khi hover. Chỉ chỗ và
              chỉ việc; phần màu để chú thích dưới bảng lo.
            */
            <span className="truncate text-ink-faint">
              Sửa ô lương, hoặc bấm ô kết quả để xem công thức
            </span>
          )}
        </output>
      </div>

      <div className="overflow-x-auto border border-rule">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <caption className="sr-only">
            Bảng tính lương rút gọn: nhập lương cơ bản, phụ cấp và số người phụ
            thuộc để xem bảo hiểm, thuế thu nhập cá nhân và lương thực lĩnh.
          </caption>

          <thead>
            <tr aria-hidden className="bg-panel text-ink-faint">
              <td className="w-9 border-r border-b border-rule" />
              <td className="border-r border-b border-rule px-3 py-1 text-center font-mono text-xs">
                A
              </td>
              <td className="border-b border-rule px-3 py-1 text-center font-mono text-xs">
                B
              </td>
            </tr>
          </thead>

          <tbody>
            <InputRow
              n={1}
              label="Lương cơ bản"
              value={luongCoBan}
              onChange={bumped(setLuongCoBan)}
            />
            <InputRow
              n={2}
              label="Phụ cấp"
              value={phuCap}
              onChange={bumped(setPhuCap)}
            />
            <StepperRow
              n={3}
              label="Số người phụ thuộc"
              value={phuThuoc}
              onChange={bumped(setPhuThuoc)}
            />

            {rows.map((row, i) => {
              const rowNumber = i + 4;
              const isActive = active === row.ref;
              const isPinned = pinned === row.ref;
              return (
                <tr key={row.ref}>
                  <RowHead n={rowNumber} />
                  <th
                    scope="row"
                    className={`border-r border-b border-rule px-3 py-2 text-left font-normal whitespace-nowrap ${
                      row.strong ? "font-medium" : "text-ink-soft"
                    }`}
                  >
                    {row.label}
                  </th>
                  <td
                    className={`relative border-b border-rule p-0 ${
                      isActive ? "bg-computed/15" : "bg-computed-bg"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-0 right-0 h-0 w-0 border-t-[6px] border-l-[6px] border-t-computed border-l-transparent"
                    />
                    {/*
                      Hover và focus chỉ đặt `hovered` — rời ra là mất. Bấm thì
                      ghim, bấm lại nhả ghim. Không xóa `hovered` khi ghim: rời
                      chuột khỏi ô đã ghim vẫn phải giữ công thức trên thanh fx,
                      mà đó chính là việc `pinned` được ưu tiên hơn.
                    */}
                    <button
                      type="button"
                      aria-pressed={isPinned}
                      onMouseEnter={() => setHovered(row.ref)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(row.ref)}
                      onBlur={() => setHovered(null)}
                      onClick={() =>
                        setPinned((current) =>
                          current === row.ref ? null : row.ref,
                        )
                      }
                      /*
                        Khung ô đang ghim vẽ bằng outline chứ không phải ring:
                        ring của Tailwind là box-shadow, mà hệ thiết kế cấm
                        box-shadow. Outline cũng đúng với Excel hơn — ô đang
                        chọn có khung, không có bóng.
                      */
                      className={`w-full cursor-pointer px-3 py-2 text-right font-mono tabular-nums text-computed ${
                        row.strong ? "font-medium" : ""
                      } ${
                        isPinned
                          ? "outline-2 -outline-offset-2 outline-computed"
                          : ""
                      }`}
                    >
                      {/*
                        Công thức nằm ngay trong nhãn của nút, không chỉ trên
                        thanh fx. Thanh fx không còn aria-live (lý do ở trên),
                        nên đây là đường duy nhất để người đọc màn hình lấy
                        được công thức — và lấy khi họ chủ động tab tới, chứ
                        không bị bắn vào tai.
                      */}
                      <span className="sr-only">
                        {row.label}, ô Excel tự tính bằng công thức{" "}
                        {row.formula}, kết quả{" "}
                      </span>
                      {/*
                        Chỉ chớp từ lần sửa đầu tiên trở đi. Cho chạy ngay lúc
                        tải trang thì sáu ô cùng lóe xanh khi chưa ai chạm vào
                        gì — trông như trang bị lỗi chứ không phải đang tính.

                        Độ trễ tăng dần theo hàng để cú chớp chạy từ trên
                        xuống, đúng thứ tự ô này phụ thuộc ô kia.
                      */}
                      <span
                        key={`${pulse}-${row.ref}`}
                        className={pulse > 0 ? "cell-recalc" : undefined}
                        style={pulse > 0 ? { animationDelay: `${i * 45}ms` } : undefined}
                      >
                        {dong.format(Math.round(row.value))}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/*
        Vùng thông báo duy nhất của bảng, và nó chỉ đọc dòng chốt.

        Sửa một ô nhập thì sáu ô kết quả nhảy số cùng lúc; thông báo hết sáu là
        không ai theo được. Người dùng sửa lương muốn biết một điều: cuối tháng
        lĩnh bao nhiêu. Nội dung này không đổi theo hover nên rê chuột ngang
        bảng cũng không bắn ra thông báo nào.
      */}
      <output aria-live="polite" className="sr-only">
        Thực lĩnh: {dong.format(Math.round(thucLinh))} đồng
      </output>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 border border-input/40 bg-input-bg"
          />
          ô bạn nhập
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 border border-computed/40 bg-computed-bg"
          />
          Excel tự tính
        </span>
        {/*
          Bảng có min-width 420px nên máy hẹp phải cuộn ngang, mà một bảng bị
          cắt ở mép không tự nói ra là nó còn phần bên phải. Hint chỉ hiện ở
          đúng khổ máy có cuộn thật.
        */}
        <span className="text-ink-faint sm:hidden">
          → cuộn ngang để xem hết bảng
        </span>
        <span className="text-ink-faint">
          Rút gọn từ mẫu bảng lương — cùng cách tính, ít cột hơn
        </span>
        {templateHref && (
          <Link
            href={templateHref}
            className="underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Mở file đầy đủ
          </Link>
        )}
      </figcaption>
    </figure>
  );
}

function RowHead({ n }: { n: number }) {
  return (
    <td
      aria-hidden
      className="border-r border-b border-rule bg-panel px-1 py-2 text-center font-mono text-xs text-ink-faint"
    >
      {n}
    </td>
  );
}

/**
 * Ô tiền: gõ được, và hiển thị có dấu phân cách hàng nghìn ngay trong lúc gõ.
 *
 * Không dùng <input type="number"> vì nó không cho định dạng "18.000.000" —
 * mà đọc một dãy tám chữ số trần thì không ai soát được mình gõ đúng chưa.
 */
function InputRow({
  n,
  label,
  value,
  onChange,
}: {
  n: number;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();

  return (
    <tr>
      <RowHead n={n} />
      <td className="border-r border-b border-rule px-3 py-2 whitespace-nowrap">
        <label htmlFor={id} className="text-ink-soft">
          {label}
        </label>
      </td>
      <td className="border-b border-rule bg-input-bg p-0">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={dong.format(value)}
          onChange={(e) => {
            const el = e.currentTarget;
            const raw = el.value;
            const caret = el.selectionStart ?? raw.length;

            const digits = raw.replace(/\D/g, "");
            // Chặn trên ở 999 triệu: quá số này bảng chạy sang bậc thuế cuối
            // và cột số vỡ khung, trong khi chẳng nói thêm được điều gì.
            const next = Math.min(Number(digits || 0), 999_000_000);
            const formatted = dong.format(next);

            /*
             * Giữ con trỏ ở đúng chữ số người ta vừa gõ.
             *
             * Ô này format lại sau mỗi phím, nên nếu để mặc kệ thì sửa một chữ
             * số ở giữa "18.000.000" là con trỏ bị ném về cuối chuỗi — phải
             * xóa sạch gõ lại. Cách neo: đếm xem bên trái con trỏ có bao nhiêu
             * CHỮ SỐ (bỏ qua dấu chấm, vì số dấu chấm thay đổi theo độ dài),
             * rồi đặt lại con trỏ sau đúng ngần ấy chữ số trong chuỗi mới.
             *
             * Ghi thẳng vào DOM thay vì đợi React render: gõ ký tự không phải
             * số thì `next` không đổi, React bail out không render lại, và ký
             * tự rác sẽ nằm lại trong ô.
             */
            const digitsBeforeCaret = raw
              .slice(0, caret)
              .replace(/\D/g, "").length;

            let seen = 0;
            let pos = 0;
            while (pos < formatted.length && seen < digitsBeforeCaret) {
              if (/\d/.test(formatted[pos])) seen++;
              pos++;
            }

            el.value = formatted;
            el.setSelectionRange(pos, pos);
            onChange(next);
          }}
          className="w-full bg-transparent px-3 py-2 text-right font-mono tabular-nums text-input focus:outline-none"
        />
      </td>
    </tr>
  );
}

/** Số người phụ thuộc là số nguyên nhỏ — hai nút bấm nhanh hơn gõ. */
function StepperRow({
  n,
  label,
  value,
  onChange,
}: {
  n: number;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <tr>
      <RowHead n={n} />
      <td className="border-r border-b border-rule px-3 py-2 whitespace-nowrap">
        <span className="text-ink-soft">{label}</span>
      </td>
      <td className="border-b border-rule bg-input-bg p-0">
        <div className="flex items-stretch justify-end">
          <StepButton
            label={`Bớt một người phụ thuộc, hiện có ${value}`}
            disabled={value <= 0}
            onClick={() => onChange(value - 1)}
          >
            −
          </StepButton>
          <output className="flex min-w-10 items-center justify-center px-2 font-mono tabular-nums text-input">
            {value}
          </output>
          <StepButton
            label={`Thêm một người phụ thuộc, hiện có ${value}`}
            disabled={value >= 9}
            onClick={() => onChange(value + 1)}
          >
            +
          </StepButton>
        </div>
      </td>
    </tr>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-9 border-l border-rule font-mono text-input hover:bg-input/10 disabled:text-ink-faint disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
