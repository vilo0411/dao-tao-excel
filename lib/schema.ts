import { z } from "zod";
import { CATEGORY_SLUGS, type CtaTarget } from "./site.ts";

/**
 * Schema spec và các hàm thuần, tách khỏi phần đọc file.
 *
 * Component preview chạy phía client cần columnLetter và resolveFormula, mà
 * lib/templates.ts lại import node:fs nên không bundle cho trình duyệt được.
 * Tách ra đây để cả server lẫn client dùng chung đúng một cài đặt công thức.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const columnSchema = z
  .object({
    key: z
      .string()
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "key phải là định danh hợp lệ"),
    header: z.string().min(1),
    type: z.enum(["text", "number", "date", "currency", "percent", "formula"]),
    width: z.number().int().min(4).max(60).default(16),
    /**
     * Công thức Excel viết theo tên cột thay vì chữ cái cột:
     *   `[key]` → chữ cái cột, `{row}` → số dòng hiện tại.
     * Ví dụ: "=IFERROR([ngayCong]{row}/[congChuan]{row},0)" → "=IFERROR(E5/D5,0)"
     *
     * `{row-1}` trỏ lên dòng ngay trên, dùng cho các cột lũy kế kiểu số dư sổ
     * quỹ hay tồn kho. Ở dòng dữ liệu đầu tiên nó rơi vào dòng tiêu đề, tức là
     * chữ — nên công thức lũy kế phải bọc `N(...)` để chữ đọc thành 0 thay vì
     * lỗi. Chỉ cho lùi lên, không cho `{row+1}`: trỏ xuống dòng chưa nhập là
     * tạo vòng lặp tham chiếu.
     *
     * Viết thẳng "E5" sẽ hỏng ngay khi chèn thêm cột; tham chiếu theo key thì
     * không, và cho phép validate lúc build xem cột được trỏ tới có tồn tại không.
     */
    formula: z.string().optional(),
    /** Giải thích công thức, hiển thị trên trang. Bắt buộc với cột formula. */
    note: z.string().optional(),
    /**
     * Định dạng hiển thị cho cột formula (cột nhập liệu đã lấy theo `type`).
     * Ví dụ cột tỷ lệ tính bằng công thức nhưng cần hiện dưới dạng phần trăm.
     */
    format: z.enum(["text", "number", "date", "currency", "percent"]).optional(),
    validation: z
      .object({
        type: z.enum(["list", "decimal", "whole", "date"]),
        options: z.array(z.string()).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
  })
  .refine((c) => c.type !== "formula" || Boolean(c.formula), {
    message: "cột type='formula' bắt buộc phải có trường formula",
    path: ["formula"],
  })
  .refine((c) => c.type !== "formula" || Boolean(c.note), {
    // Ràng buộc này chính là thứ chống thin content: mỗi công thức đều buộc
    // phải kèm lời giải thích, và lời giải thích đó lên thẳng trang.
    message: "cột type='formula' bắt buộc phải có note giải thích công thức",
    path: ["note"],
  })
  .refine((c) => c.type === "formula" || !c.formula, {
    message: "chỉ cột type='formula' mới được đặt formula",
    path: ["formula"],
  });

const sheetSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(31, "tên sheet trong Excel tối đa 31 ký tự")
      .refine((n) => !/[\\/*?:[\]]/.test(n), {
        message: "tên sheet không được chứa \\ / * ? : [ ]",
      }),
    description: z.string().min(1),
    columns: z.array(columnSchema).min(1),
    /** Dữ liệu mẫu, key khớp với column.key. Cột formula để script tự điền. */
    sampleRows: z.array(z.record(z.string(), z.unknown())).min(1),
    /** Số dòng trống có sẵn công thức, để người dùng nhập tiếp mà không vỡ file. */
    blankRows: z.number().int().min(0).max(500).default(20),
  })
  .superRefine((sheet, ctx) => {
    const keys = new Set<string>();
    for (const col of sheet.columns) {
      if (keys.has(col.key)) {
        ctx.addIssue({
          code: "custom",
          message: `trùng column key: ${col.key}`,
          path: ["columns"],
        });
      }
      keys.add(col.key);
    }

    // Mọi tham chiếu [key] trong công thức phải trỏ tới cột có thật.
    for (const col of sheet.columns) {
      if (!col.formula) continue;
      for (const [, ref] of col.formula.matchAll(/\[([^\]]+)\]/g)) {
        if (!keys.has(ref)) {
          ctx.addIssue({
            code: "custom",
            message: `công thức cột "${col.key}" trỏ tới [${ref}] nhưng sheet không có cột nào dùng key đó`,
            path: ["columns"],
          });
        }
      }
      if (!col.formula.includes("{row}")) {
        ctx.addIssue({
          code: "custom",
          message: `công thức cột "${col.key}" thiếu {row} — sẽ trỏ sai dòng khi điền xuống`,
          path: ["columns"],
        });
      }
      // Gõ nhầm thành {row -1} hay {row+1} thì token không khớp ROW_TOKEN, nên
      // nó sẽ đi thẳng vào file .xlsx nguyên văn dấu ngoặc nhọn. Excel báo lỗi
      // cú pháp lúc mở file, tức là lỗi chỉ lộ ra ở tay người tải về.
      for (const [token] of col.formula.matchAll(/\{row[^}]*\}/g)) {
        if (!/^\{row(?:-\d+)?\}$/.test(token)) {
          ctx.addIssue({
            code: "custom",
            message: `công thức cột "${col.key}" dùng ${token} — chỉ chấp nhận {row} hoặc {row-N} (trỏ lên dòng trên)`,
            path: ["columns"],
          });
        }
      }
    }

    const inputKeys = new Set(
      sheet.columns.filter((c) => c.type !== "formula").map((c) => c.key),
    );
    sheet.sampleRows.forEach((row, i) => {
      for (const key of Object.keys(row)) {
        if (!inputKeys.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: `sampleRows[${i}] có key "${key}" không khớp cột nhập liệu nào`,
            path: ["sampleRows", i],
          });
        }
      }
    });
  });

export const templateSchema = z.object({
  slug: z.string().regex(SLUG, "slug phải viết thường, không dấu, nối bằng -"),
  category: z.enum(CATEGORY_SLUGS as [string, ...string[]]),

  /** Tiêu đề hiển thị (H1). */
  h1: z.string().min(1),
  metaTitle: z.string().min(1).max(60, "meta title nên <= 60 ký tự"),
  metaDesc: z
    .string()
    .min(120, "meta description nên >= 120 ký tự")
    .max(165, "meta description nên <= 165 ký tự"),

  /** Đoạn mở đầu, phải chứa primary keyword. */
  intro: z.string().min(120),
  primaryKeyword: z.string().min(1),

  difficulty: z.enum(["co-ban", "trung-cap", "nang-cao"]),
  features: z.array(z.string().min(1)).min(3).max(6),
  howToUse: z
    .array(z.object({ step: z.string().min(1), detail: z.string().min(1) }))
    .min(3)
    .max(6),
  faq: z
    .array(z.object({ q: z.string().min(1), a: z.string().min(1) }))
    .min(2)
    .max(6),

  /** Ghi đè đích CTA mặc định của category. */
  ctaTarget: z.enum(["consult", "hrCourse"]).optional(),
  ctaText: z.string().min(1),

  relatedSlugs: z.array(z.string().regex(SLUG)).max(5).default([]),
  updatedAt: z.iso.date(),

  sheets: z.array(sheetSchema).min(1),
});

export type TemplateSpec = z.infer<typeof templateSchema>;

/**
 * Giá trị các ô công thức của dòng mẫu, do scripts/qa_check.py tính lại từ
 * file .xlsx thật rồi ghi ra — và chỉ ghi khi QA đạt.
 *
 * Nhờ vậy con số hiển thị trên trang là con số Excel thực sự tính ra, không
 * phải số người viết spec gõ tay vào (vốn có thể sai mà không ai phát hiện).
 * Cấu trúc: sheets[chỉ số sheet][chỉ số dòng mẫu][key cột] = giá trị.
 */
export type ComputedValues = Record<string, unknown>[][];

export const DIFFICULTY_LABEL: Record<TemplateSpec["difficulty"], string> = {
  "co-ban": "Cơ bản",
  "trung-cap": "Trung cấp",
  "nang-cao": "Nâng cao",
};

/**
 * Phần dữ liệu vừa đủ để vẽ một card.
 *
 * Bộ lọc ở trang thư viện chạy phía client, nghĩa là mọi thứ truyền vào nó đều
 * bị serialize xuống HTML. `Template` đầy đủ mang theo cả `sheets` — hàng chục
 * KB cột, công thức và dòng mẫu cho mỗi file, không dùng đến ở tầng danh sách.
 */
export type TemplateCardData = {
  slug: string;
  href: string;
  h1: string;
  metaDesc: string;
  functions: string[];
  difficulty: TemplateSpec["difficulty"];
  category: string;
  categoryName: string;
  /**
   * Mỗi cột của sheet đầu là ô nhập tay hay ô công thức. Một mảng boolean nên
   * gần như không tốn byte nào khi serialize xuống HTML cho bộ lọc phía client,
   * mà đủ để vẽ dải hình dạng cột ở danh sách dạng dòng.
   */
  shape: boolean[];
  /**
   * Danh sách cột rút gọn cho card. KHÔNG mặc định có: trang duy nhất dùng card
   * là trang chủ với sáu file, trong khi trang thư viện đẩy cả thư viện xuống
   * client. Xem `toCardData` / `withThumb`.
   */
  thumb?: ColumnMap;
};

export type Template = TemplateSpec & {
  /** Hàm Excel trích tự động từ công thức thật — không khai báo thủ công. */
  functions: string[];
  computed?: ComputedValues;
  ctaTarget: CtaTarget;
  categoryName: string;
  href: string;
  downloadUrl: string;
};

/*
 * Định dạng giá trị ô để hiển thị.
 *
 * Nằm ở đây chứ không nằm trong SheetPreview vì giờ có bốn chỗ vẽ lại cùng một
 * con số: bảng preview, thumbnail trên card, biểu đồ, và ảnh OG. Bốn cài đặt
 * rời nhau thì cùng một ô sẽ hiện "17.510.000" ở chỗ này và "17510000" ở chỗ
 * kia — mà lệch kiểu đó không có test nào bắt được, chỉ có mắt người.
 *
 * Hàm thuần, không đụng DOM, nên cả server component lẫn client component đều
 * dùng được.
 */

const FORMATTERS: Record<string, (value: unknown) => string> = {
  currency: (v) => Number(v).toLocaleString("vi-VN"),
  percent: (v) => `${(Number(v) * 100).toFixed(1)}%`,
  number: (v) => Number(v).toLocaleString("vi-VN"),
};

const ngay = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Ngày đến đây bằng hai dạng khác nhau và phải ra cùng một chuỗi.
 *
 * Ô nhập tay giữ nguyên chuỗi ISO của spec ("2026-07-09"). Ô công thức thì đi
 * qua qa_check nên mang số serial của Excel — cột "Ngày cần báo trước" trả về
 * 46524, và in thẳng con số đó lên trang thì vô nghĩa với người đọc.
 *
 * Mốc 0 của Excel là 30/12/1899 chứ không phải 31/12: Excel coi 1900 là năm
 * nhuận nên đếm thừa một ngày, và lùi mốc đi một ngày là cách bù lại. Dùng UTC
 * xuyên suốt để ngày không lệch theo múi giờ của người xem.
 */
export function formatDate(value: unknown): string {
  const serial = Number(value);
  const ms = Number.isNaN(serial)
    ? Date.parse(String(value))
    : Date.UTC(1899, 11, 30) + serial * 86_400_000;
  return Number.isNaN(ms) ? String(value) : ngay.format(new Date(ms));
}

export function display(value: unknown, type: string): string {
  if (value === undefined || value === null || value === "") return "";
  if (type === "date") return formatDate(value);
  const formatter = FORMATTERS[type];
  if (!formatter) return String(value);
  /*
   * Cột công thức không khai báo `format` sẽ rơi về "number" ở chỗ gọi, nhưng
   * công thức hoàn toàn có thể trả về chữ — cột "Xếp loại" cho ra "Đủ công".
   * Ép sang số lúc đó in thẳng chữ NaN lên bảng, nên chỉ định dạng khi giá trị
   * thật sự là số.
   */
  return Number.isNaN(Number(value)) ? String(value) : formatter(value);
}

/**
 * Cắt chuỗi theo số ký tự thay vì để CSS cắt.
 *
 * Ba chỗ dùng lại mảnh bảng tính (ảnh OG, thumbnail trên card, dải hình dạng
 * cột) đều có ô cao cố định, nên một chuỗi dài không được phép tự ngắt dòng.
 * Cắt trong JS thì tính được ngay lúc dựng; để CSS cắt thì lỗi chỉ lộ ra khi
 * nhìn bằng mắt, mà ảnh OG thì không ai nhìn lại sau khi đăng.
 */
export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Danh sách cột của một sheet, rút gọn đủ để vẽ trong một card.
 *
 * Bản đầu của thumbnail trên card là một BẢNG thu nhỏ thật: dải chữ cái cột,
 * dòng tiêu đề, hai dòng dữ liệu. Nó hỏng vì một lý do đơn giản — ở bề ngang
 * ~300px thì bốn dòng chữ 10px là bốn dòng không ai đọc, mà vẫn chiếm chỗ và
 * vẫn đòi lượt nhìn. Tệ hơn, dữ liệu giả trong đó tự sinh ra rác: tên bị cắt
 * giữa từ ("Công ty TNH…"), và một ô công thức trả về 0 thì đọc ra là file
 * hỏng chứ không phải là dòng mẫu.
 *
 * Thứ duy nhất trong bảng đó mang thông tin ở cỡ này là TÊN CỘT. Nên chỉ giữ
 * tên cột, bỏ hết phần còn lại.
 */
export type ColumnMap = {
  /** Tên cột, không cắt chữ. */
  names: string[];
  /** Cột này do Excel tính hay người nhập. */
  isFormula: boolean[];
  /** Số cột không hiện, để card nói thật về phần nó giấu đi. */
  more: number;
  /** Tổng số cột công thức của sheet, kể cả cột không hiện. */
  computedCount: number;
};

/**
 * Cột "STT" và các cột đánh số thứ tự khác đều khai bề rộng rất hẹp. Chúng
 * không nói gì về file — mọi bảng đều có một cột đếm dòng — nên bỏ khỏi bản
 * rút gọn, nhường chỗ cho cột thật sự phân biệt được file này với file khác.
 */
const TRIVIAL_WIDTH = 6;

export function toColumnMap(
  sheet: TemplateSpec["sheets"][number],
  { max = 5 }: { max?: number } = {},
): ColumnMap {
  const columns = sheet.columns.filter((c) => c.width > TRIVIAL_WIDTH);
  const firstFormula = columns.findIndex((c) => c.type === "formula");

  // Cột công thức luôn nằm cuối bảng (nhập trước, tính sau), nên lấy tuần tự
  // là ra một danh sách toàn ô xanh dương — mất đúng thứ card cần khoe. Kéo
  // cột công thức đầu tiên lên đứng cuối nhóm được chọn.
  const picked = columns
    .filter((_, i) => i !== firstFormula)
    .slice(0, firstFormula >= 0 ? max - 1 : max);
  if (firstFormula >= 0) picked.push(columns[firstFormula]);

  return {
    names: picked.map((c) => c.header),
    isFormula: picked.map((c) => c.type === "formula"),
    more: sheet.columns.length - picked.length,
    computedCount: sheet.columns.filter((c) => c.type === "formula").length,
  };
}

/**
 * Một sheet thật rút xuống còn vài cột vài dòng, đủ để vẽ lại ở cỡ nhỏ.
 *
 * Cùng một cấu trúc phục vụ cả ảnh OG lẫn thumbnail trên card: hai chỗ đó vẽ
 * cùng một bảng ở hai cỡ, nên chúng phải chọn cột giống hệt nhau. Hai bộ luật
 * chọn cột rời nhau thì ảnh xem trước và card của cùng một file sẽ khoe hai
 * bảng khác nhau.
 */
export type SheetStrip = {
  /** Tiêu đề cột, theo đúng thứ tự trong file. */
  headers: string[];
  /** Cột này do Excel tính hay người nhập — quyết định màu ô. */
  isFormula: boolean[];
  /** Bề rộng cột, px. Chỗ vẽ co giãn thì dùng làm tỉ lệ. */
  widths: number[];
  /** Các dòng giá trị đã định dạng sẵn thành chuỗi. */
  rows: string[][];
};

/**
 * Bề rộng cột trong spec tính bằng SỐ KÝ TỰ (chuẩn của Excel), phải đổi sang px.
 * Hệ số 9 là bề ngang một ký tự mono ở cỡ 20px; chặn hai đầu để một cột "Ghi
 * chú" khai 60 ký tự không nuốt hết khung, và cột "STT" khai 4 ký tự vẫn đủ chỗ
 * cho tiêu đề của nó.
 */
function columnPx(width: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, width * 9));
}

/**
 * Rút một sheet xuống còn mảnh vừa khung.
 *
 * Chỉ lấy các cột đầu cho tới khi vượt quá bề ngang cho phép — phần thừa để
 * khung cắt, và đó là chủ ý: một bảng tính bị cắt ở mép phải đọc ra là "còn
 * nữa", đúng như file thật. Một bảng vừa khít trông như đã hết cột.
 *
 * Nhưng cắt tuần tự có một cái bẫy: cột công thức của các file này gần như luôn
 * nằm ở cuối (nhập trước, tính sau), nên lấy sáu cột đầu là ra một mảnh bảng
 * KHÔNG CÓ Ô XANH LÁ NÀO — tức mất đúng thứ cần khoe. Nên cột công thức đầu
 * tiên luôn được kéo lên đứng ngay sau các cột nhập được chọn.
 */
export function toSheetStrip(
  sheet: TemplateSpec["sheets"][number],
  computed: Record<string, unknown>[] | undefined,
  {
    maxWidth = 1220,
    maxRows = 2,
    maxChars = 20,
    /**
     * Chặn dưới / chặn trên cho bề rộng một cột.
     *
     * Ảnh OG rộng 1200px nên sàn 96px là hợp lý — hẹp hơn thế thì tiêu đề cột
     * không đọc được. Thumbnail trên card chỉ rộng ~300px, mà ở đó sàn 96px làm
     * méo tỉ lệ: cột "STT" chiếm bằng cột "Họ và tên". Nên hai chỗ dùng hai bộ
     * chặn khác nhau, còn luật CHỌN cột thì vẫn dùng chung.
     */
    minColumn = 96,
    maxColumn = 230,
  }: {
    maxWidth?: number;
    maxRows?: number;
    maxChars?: number;
    minColumn?: number;
    maxColumn?: number;
  } = {},
): SheetStrip {
  const firstFormula = sheet.columns.findIndex((c) => c.type === "formula");

  const picked: { index: number; px: number }[] = [];
  let used = 0;

  // Chừa sẵn chỗ cho cột công thức sẽ kéo lên, nếu không cột nhập sẽ ăn hết.
  const reserved =
    firstFormula >= 0
      ? columnPx(sheet.columns[firstFormula].width, minColumn, maxColumn)
      : 0;

  for (const [index, col] of sheet.columns.entries()) {
    if (index === firstFormula) continue;
    const px = columnPx(col.width, minColumn, maxColumn);
    if (used + px + reserved > maxWidth) break;
    picked.push({ index, px });
    used += px;
  }

  if (firstFormula >= 0) {
    picked.push({ index: firstFormula, px: reserved });
  }

  const columns = picked.map((p) => sheet.columns[p.index]);

  return {
    headers: columns.map((c) => clip(c.header, maxChars + 2)),
    isFormula: columns.map((c) => c.type === "formula"),
    widths: picked.map((p) => p.px),
    rows: sheet.sampleRows.slice(0, maxRows).map((row, rowIndex) =>
      columns.map((col) => {
        if (col.type !== "formula")
          return clip(display(row[col.key], col.type), maxChars);
        // Giá trị ô công thức lấy từ data/computed — tức là con số Excel THẬT
        // sự tính ra, đã qua qa_check. Chưa chạy pipeline thì để trống còn hơn
        // in một con số bịa ra.
        const value = computed?.[rowIndex]?.[col.key];
        return value === undefined
          ? ""
          : clip(display(value, col.format ?? "number"), maxChars);
      }),
    ),
  };
}

/** Chỉ số cột (0-based) → chữ cái cột Excel: 0→A, 25→Z, 26→AA. */
export function columnLetter(index: number): string {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/** `{row}` → dòng hiện tại, `{row-1}` → dòng ngay trên. */
const ROW_TOKEN = /\{row(?:-(\d+))?\}/g;

/**
 * Đổi công thức dạng `[key]{row}` sang công thức Excel thật.
 * Script sinh .xlsx (Python) phải cài đặt hàm này giống hệt — nếu lệch nhau,
 * công thức hiển thị trên trang sẽ khác công thức trong file tải về.
 */
export function resolveFormula(
  formula: string,
  columns: { key: string }[],
  row: number,
): string {
  const letters = new Map(columns.map((c, i) => [c.key, columnLetter(i)]));
  return formula
    .replace(/\[([^\]]+)\]/g, (match, key: string) => letters.get(key) ?? match)
    .replace(ROW_TOKEN, (_, back?: string) =>
      String(row - (back ? Number(back) : 0)),
    );
}
