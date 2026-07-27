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

export type Template = TemplateSpec & {
  /** Hàm Excel trích tự động từ công thức thật — không khai báo thủ công. */
  functions: string[];
  computed?: ComputedValues;
  ctaTarget: CtaTarget;
  categoryName: string;
  href: string;
  downloadUrl: string;
};

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
    .replaceAll("{row}", String(row));
}
