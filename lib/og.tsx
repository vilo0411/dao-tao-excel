import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import { clip, columnLetter, toSheetStrip, type SheetStrip } from "./schema.ts";
import { SITE_NAME, SITE_URL } from "./site.ts";

/**
 * Xưởng dựng ảnh OG — ảnh duy nhất của site này mà người CHƯA vào trang nhìn
 * thấy.
 *
 * Vì sao vẽ bằng code chứ không thiết kế tay: thư viện có hàng chục file và sẽ
 * còn dài ra. Một ảnh vẽ tay cho mỗi file là một món nợ bảo trì — đổi tiêu đề
 * là ảnh nói sai, mà không có gì nhắc. Ở đây ảnh sinh từ chính spec đã dựng ra
 * trang, nên nó không bao giờ lệch được với nội dung.
 *
 * Ảnh phải nói đúng một câu, cùng câu mà cả site đang nói: "ở đây công thức
 * phơi ra". Nên nhân vật chính của ảnh là một mảnh bảng tính thật lấy từ file,
 * có ô xanh dương người nhập và ô xanh lá Excel tự tính — không phải một cái
 * banner có chữ to.
 *
 * Ràng buộc của Satori (bộ dựng phía sau ImageResponse) chi phối gần hết cách
 * viết ở dưới:
 *   - Chỉ có flexbox. Không `display: grid`, nên bảng phải dựng bằng flex lồng.
 *   - Phần tử có nhiều hơn một con BẮT BUỘC khai `display: flex`.
 *   - Không có CSS variable, nên màu phải gõ thẳng hex (xem OG_COLORS).
 *   - Ngân sách gói 500KB, tính cả font — lý do chỉ nạp hai font, mỗi font một
 *     nét, thay vì cả ba họ chữ của site.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Bản sao token màu của `@theme` trong app/globals.css. Satori không đọc được
 * CSS nên đây là chỗ duy nhất trong repo được phép nhắc lại các hex đó — sửa
 * màu ở globals.css thì phải sửa cả ở đây.
 */
const OG_COLORS = {
  ink: "#181d26",
  inkSoft: "#41454d",
  inkFaint: "#6b7280",
  paper: "#ffffff",
  panel: "#f8fafc",
  rule: "#dddddd",
  coral: "#aa2d00",
  input: "#1f4b99",
  inputBg: "#eaf0f9",
  computed: "#0e6b4a",
  computedBg: "#e6f2ec",
} as const;

/**
 * Font nạp từ file .ttf trong repo chứ không qua next/font/google: Satori chỉ
 * nhận ttf/otf/woff và cần buffer thật lúc dựng ảnh, trong khi next/font là cơ
 * chế cho trình duyệt. Hai file này là bản Archivo và JetBrains Mono tải từ
 * Google Fonts, cùng họ chữ với trang web nên ảnh và trang đọc ra là một.
 *
 * Be Vietnam Pro cố ý không nạp: trong ảnh OG không có đoạn văn dài nào, chỉ có
 * tiêu đề (Archivo) và ô bảng tính (mono). Nạp thêm font thứ ba là tốn ~110KB
 * ngân sách cho thứ không xuất hiện.
 *
 * Cả hai file đều đã kiểm có đủ dấu tiếng Việt. Riêng ký tự ✓ thì KHÔNG có
 * trong cả hai — đừng dùng dấu tick trong ảnh OG, nó sẽ rơi về font dự phòng.
 */
async function loadFonts() {
  const dir = join(process.cwd(), "assets", "fonts");
  const [archivo, mono] = await Promise.all([
    readFile(join(dir, "Archivo-Regular.ttf")),
    readFile(join(dir, "JetBrainsMono-Regular.ttf")),
  ]);

  return [
    { name: "Archivo", data: archivo, weight: 400 as const, style: "normal" as const },
    { name: "JetBrainsMono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

/** Tuỳ chọn truyền vào ImageResponse, giống nhau ở mọi route ảnh. */
export async function ogOptions() {
  return { ...OG_SIZE, fonts: await loadFonts() };
}

/**
 * Luật rút một sheet xuống còn vài cột sống ở lib/schema.ts, vì thumbnail trên
 * card cũng dùng đúng luật đó. Cho các route ảnh mượn lại tên quen thuộc thay
 * vì bắt mỗi route nhớ nó nằm ở file nào.
 */
export { toSheetStrip };

/**
 * Bộ file vẽ bằng đúng bộ khung đó, nhưng mỗi ô là một FILE chứ không phải một
 * ô tính. Đây là chỗ DESIGN.md cho phép nâng hai màu ngữ nghĩa lên một cấp:
 * xanh dương vẫn là "bạn nhập vào đây", xanh lá vẫn là "Excel kéo số từ nơi
 * khác về" — chỉ là nói về file thay vì về ô. Nghĩa không đổi nên không phải
 * trang trí.
 *
 * Dải chữ cái A/B/C phía trên giữ nguyên, khớp với cách SystemMap vẽ trên
 * trang bộ file.
 */
export function toNodeStrip(
  nodes: readonly { shortName: string; owner: string; role: string }[],
  { maxWidth = 1220 }: { maxWidth?: number } = {},
): SheetStrip {
  const px = 230;
  const shown = nodes.slice(0, Math.ceil(maxWidth / px));

  return {
    headers: shown.map((n) => clip(n.shortName, 22)),
    isFormula: shown.map((n) => n.role !== "input"),
    widths: shown.map(() => px),
    // 16 ký tự là sức chứa thật của ô 230px ở cỡ mono 19px. Khai rộng hơn thì
    // chữ chạm mép ô bên cạnh, mà ô thì không cho xuống dòng.
    rows: [shown.map((n) => clip(n.owner, 16))],
  };
}

const CELL_BORDER = `1px solid ${OG_COLORS.rule}`;

/**
 * Mảnh bảng tính đặt ở đáy ảnh: dải chữ cái cột, dòng tiêu đề, rồi vài dòng dữ
 * liệu. Bo góc 0 tuyệt đối và font mono, đúng luật của tầng bảng tính.
 */
function SheetVisual({ strip }: { strip: SheetStrip }) {
  const cellBase = {
    display: "flex",
    alignItems: "center",
    borderRight: CELL_BORDER,
    borderBottom: CELL_BORDER,
    padding: "0 14px",
    height: 54,
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", borderTop: CELL_BORDER }}>
      {/* Dải chữ cái cột — khung của bảng tính, không phải dữ liệu. */}
      <div style={{ display: "flex" }}>
        {strip.widths.map((px, i) => (
          <div
            key={i}
            style={{
              ...cellBase,
              width: px,
              height: 34,
              justifyContent: "center",
              backgroundColor: OG_COLORS.panel,
              color: OG_COLORS.inkFaint,
              fontFamily: "JetBrainsMono",
              fontSize: 18,
            }}
          >
            {columnLetter(i)}
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        {strip.headers.map((header, i) => (
          <div
            key={i}
            style={{
              ...cellBase,
              width: strip.widths[i],
              color: OG_COLORS.ink,
              fontSize: 19,
            }}
          >
            {header}
          </div>
        ))}
      </div>

      {strip.rows.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: "flex" }}>
          {row.map((value, i) => {
            const formula = strip.isFormula[i];
            return (
              <div
                key={i}
                style={{
                  ...cellBase,
                  width: strip.widths[i],
                  backgroundColor: formula
                    ? OG_COLORS.computedBg
                    : OG_COLORS.inputBg,
                  color: formula ? OG_COLORS.computed : OG_COLORS.ink,
                  fontFamily: "JetBrainsMono",
                  fontSize: 19,
                  justifyContent: formula ? "flex-end" : "flex-start",
                  /*
                   * Dòng dữ liệu không được xuống dòng. Ô cao cố định 54px nên
                   * một giá trị dài tự ngắt làm hai dòng sẽ bị cắt ngang thân
                   * chữ — trông như font lỗi chứ không như bảng bị cắt. Dòng
                   * tiêu đề thì vẫn cho ngắt: "Tổng công hưởng lương" thành
                   * hai dòng vẫn vừa ô và vẫn đọc được.
                   */
                  whiteSpace: "nowrap",
                }}
              >
                {value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Khung ảnh                                                           */
/* ------------------------------------------------------------------ */

/**
 * Thanh công thức thu nhỏ, dùng làm dòng dẫn ở đỉnh ảnh. Đây chính là ký hiệu
 * mở đầu trang chủ (hộp tên ô → fx → nội dung), nên người bấm vào link từ Zalo
 * gặp lại đúng hình đó ngay khi trang mở ra.
 */
function FormulaKicker({ cell, text }: { cell: string; text: string }) {
  const box = {
    display: "flex",
    alignItems: "center",
    height: 44,
    padding: "0 14px",
    border: CELL_BORDER,
    fontFamily: "JetBrainsMono",
    fontSize: 20,
  } as const;

  return (
    <div style={{ display: "flex" }}>
      <div style={{ ...box, backgroundColor: OG_COLORS.panel, color: OG_COLORS.inkSoft }}>
        {cell}
      </div>
      <div
        style={{
          ...box,
          borderLeft: "none",
          backgroundColor: OG_COLORS.panel,
          color: OG_COLORS.inkFaint,
        }}
      >
        fx
      </div>
      <div
        style={{
          ...box,
          borderLeft: "none",
          fontFamily: "Archivo",
          color: OG_COLORS.inkSoft,
        }}
      >
        {clip(text, 46)}
      </div>
    </div>
  );
}

export type OgFrameProps = {
  /** Nội dung thanh fx ở đỉnh — thường là tên nhóm việc. */
  kicker: string;
  /** Ô hiển thị trong hộp tên ô. Mặc định A1. */
  cell?: string;
  title: string;
  /** Một câu dưới tiêu đề. Bỏ trống khi đã có mảnh bảng tính chiếm chỗ. */
  subtitle?: string;
  /** Hàm Excel dùng trong file, in bằng mono màu computed. */
  functions?: string[];
  /** Dòng chân trái — mặc định là tên site kèm domain. */
  footer?: string;
  /**
   * Dòng chân phải, in bằng mono. Mặc định là ba lời hứa về file. Trang không
   * bán file nào (trang khóa học) phải ghi đè, nếu không ảnh đi khoe "0 macro"
   * cho một thứ không phải file.
   */
  note?: string;
  /** Mảnh bảng tính ở đáy. */
  strip?: SheetStrip;
  /**
   * Câu đóng đáy ảnh bằng band coral, dùng khi trang không có bảng tính nào để
   * khoe. Không có cả hai thì đáy chỉ là một vạch coral mỏng.
   */
  band?: string;
};

/**
 * Khung chung cho mọi ảnh OG.
 *
 * Padding chỉ có ba phía (trên, trái, dưới=0): mảnh bảng tính phải chạy tràn
 * qua mép phải rồi bị cắt. Chữ thì tự chừa lề phải riêng.
 */
export function OgFrame({
  kicker,
  cell = "A1",
  title,
  subtitle,
  functions,
  // Domain suy từ SITE_URL: bản xem thử trên GitHub Pages ghi đè biến đó, và
  // một ảnh OG khoe domain thật trên bản preview là ảnh nói dối.
  footer = `${SITE_NAME} · ${new URL(SITE_URL).host}`,
  note = ".xlsx · 0 macro · tải không cần email",
  strip,
  band,
}: OgFrameProps): ReactElement {
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG_COLORS.paper,
        color: OG_COLORS.ink,
        fontFamily: "Archivo",
        padding: "52px 0 0 56px",
        overflow: "hidden",
      }}
    >
      <FormulaKicker cell={cell} text={kicker} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingRight: 56,
          marginTop: 34,
        }}
      >
        <div
          style={{
            fontSize: title.length > 46 ? 54 : 64,
            lineHeight: 1.08,
            letterSpacing: "-0.01em",
          }}
        >
          {clip(title, 92)}
        </div>

        {subtitle && (
          <div
            style={{
              marginTop: 20,
              fontSize: 26,
              lineHeight: 1.45,
              color: OG_COLORS.inkSoft,
            }}
          >
            {clip(subtitle, 120)}
          </div>
        )}

        {functions && functions.length > 0 && (
          <div style={{ display: "flex", gap: 18, marginTop: 24 }}>
            {functions.slice(0, 5).map((fn) => (
              <div
                key={fn}
                style={{
                  fontFamily: "JetBrainsMono",
                  fontSize: 21,
                  color: OG_COLORS.computed,
                }}
              >
                {fn}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Đẩy mọi thứ còn lại xuống đáy. */}
      <div style={{ display: "flex", flexGrow: 1 }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingRight: 56,
          paddingBottom: 18,
          fontSize: 21,
          color: OG_COLORS.inkFaint,
        }}
      >
        <div style={{ display: "flex" }}>{footer}</div>
        <div style={{ display: "flex", fontFamily: "JetBrainsMono" }}>{note}</div>
      </div>

      {strip ? (
        <SheetVisual strip={strip} />
      ) : (
        /* Không có bảng tính để khoe thì đóng đáy bằng band coral — đúng vai
           trò band coral vẫn gánh trên trang chủ: một mảng màu đặc cắt ngang
           để ảnh không kết thúc bằng khoảng trắng trôi. Có chữ thì band cao
           hẳn lên và mang được một câu; không có thì còn một vạch mỏng. */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: band ? 112 : 14,
            padding: band ? "0 56px" : 0,
            backgroundColor: OG_COLORS.coral,
            color: OG_COLORS.paper,
            fontSize: 32,
          }}
        >
          {band ? clip(band, 64) : ""}
        </div>
      )}
    </div>
  );
}
