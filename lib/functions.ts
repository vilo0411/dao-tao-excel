// Import tương đối kèm .ts để tương thích cách các file lib/ khác chạy trực
// tiếp qua node --experimental-strip-types (dù file này hiện chỉ dùng trong
// Next.js), giữ đồng nhất quy ước import trong thư mục.
import { getAllTemplates } from "./templates.ts";
import { resolveFormula } from "./schema.ts";

/**
 * Glossary hàm Excel — PRD mục 2.8.
 *
 * Chỉ những hàm THẬT SỰ xuất hiện trong công thức của một template đã publish
 * mới lên trang, đúng nguyên tắc chống thin content áp cho category (mục 2.1):
 * một hàm chỉ mở trang khi có ≥ 1 template dùng thật.
 *
 * `template.functions` (lib/templates.ts) đã lọc bỏ các token trông giống hàm
 * nhưng không phải (IF_ERROR), nên dùng lại đúng danh sách đó thay vì viết lại
 * luật lọc ở đây — hai nơi lọc khác nhau sẽ có ngày lệch nhau.
 */

export type FunctionGroup = "Logic" | "Toán học" | "Văn bản";

type FunctionInfo = {
  syntax: string;
  definition: string;
  group: FunctionGroup;
};

/**
 * Cú pháp + định nghĩa trung lập, viết một lần cho mỗi hàm — không phải nội
 * dung nghiệp vụ, nên không cần người rà soát kế toán/nhân sự duyệt lại.
 *
 * Thêm hàm mới vào đây khi build báo thiếu: xem lỗi ném ra ở buildFunctions().
 */
const FUNCTION_INFO: Record<string, FunctionInfo> = {
  IF: {
    syntax: "=IF(điều_kiện, giá_trị_nếu_đúng, giá_trị_nếu_sai)",
    definition:
      "Trả về một giá trị nếu điều kiện đúng, và một giá trị khác nếu điều kiện sai.",
    group: "Logic",
  },
  IFERROR: {
    syntax: "=IFERROR(công_thức, giá_trị_khi_lỗi)",
    definition:
      "Trả về giá trị thay thế khi công thức bên trong báo lỗi (#DIV/0!, #N/A, #REF!...), thay vì để lỗi hiện thẳng ra bảng.",
    group: "Logic",
  },
  AND: {
    syntax: "=AND(điều_kiện_1, điều_kiện_2, ...)",
    definition:
      "Trả về TRUE khi tất cả điều kiện bên trong đều đúng; chỉ cần một điều kiện sai là cả hàm trả về FALSE.",
    group: "Logic",
  },
  OR: {
    syntax: "=OR(điều_kiện_1, điều_kiện_2, ...)",
    definition: "Trả về TRUE khi có ít nhất một điều kiện bên trong đúng.",
    group: "Logic",
  },
  N: {
    syntax: "=N(giá_trị)",
    definition:
      "Đổi giá trị sang số: số thì giữ nguyên, còn chữ hoặc ô trống thì trả về 0. Dùng để chặn lỗi khi công thức luỹ kế cộng dồn lỡ chạm lên dòng tiêu đề.",
    group: "Logic",
  },
  REPT: {
    syntax: "=REPT(chuỗi, số_lần)",
    definition:
      "Lặp lại một chuỗi đúng số lần chỉ định. Dùng để vẽ thanh tiến độ hoặc biểu đồ cột ngay trong một ô: độ dài thanh chính là con số bạn đưa vào. Số lần lặp âm sẽ làm hàm báo lỗi #VALUE!.",
    group: "Văn bản",
  },
  SUM: {
    syntax: "=SUM(số_1, số_2, ...) hoặc =SUM(vùng)",
    definition:
      "Cộng tất cả số trong danh sách hoặc trong một vùng ô. Viết dưới dạng vùng thì khi chèn thêm cột hoặc dòng vào giữa vùng, Excel tự nới vùng ra nên công thức không phải sửa lại.",
    group: "Toán học",
  },
  ROUND: {
    syntax: "=ROUND(số, số_chữ_số_thập_phân)",
    definition: "Làm tròn một số đến số chữ số thập phân chỉ định.",
    group: "Toán học",
  },
  MAX: {
    syntax: "=MAX(số_1, số_2, ...)",
    definition: "Trả về giá trị lớn nhất trong danh sách.",
    group: "Toán học",
  },
  MIN: {
    syntax: "=MIN(số_1, số_2, ...)",
    definition: "Trả về giá trị nhỏ nhất trong danh sách.",
    group: "Toán học",
  },
};

export type FunctionUsage = {
  templateSlug: string;
  templateHref: string;
  templateH1: string;
  categoryName: string;
  sheetName: string;
  columnHeader: string;
  /** Công thức thật đã resolve [key]{row} → chữ cái cột + số dòng (dòng 2, dòng dữ liệu đầu tiên). */
  formula: string;
  note: string;
};

export type FunctionEntry = {
  /** Slug URL, chữ thường. Tên hàm chỉ gồm chữ/số/dấu chấm nên đã là slug hợp lệ. */
  slug: string;
  name: string;
  syntax: string;
  definition: string;
  group: FunctionGroup;
  usages: FunctionUsage[];
};

function buildFunctions(): FunctionEntry[] {
  const byName = new Map<string, FunctionUsage[]>();

  for (const template of getAllTemplates()) {
    for (const sheet of template.sheets) {
      for (const col of sheet.columns) {
        if (!col.formula) continue;

        const names = new Set<string>();
        for (const [, name] of col.formula.matchAll(/\b([A-Z][A-Z0-9.]*)\s*\(/g)) {
          names.add(name);
        }

        for (const name of names) {
          // template.functions là nguồn lọc duy nhất — bỏ qua token không
          // phải hàm thật (vd IF_ERROR) mà không cần chép lại luật lọc.
          if (!template.functions.includes(name)) continue;

          const usage: FunctionUsage = {
            templateSlug: template.slug,
            templateHref: template.href,
            templateH1: template.h1,
            categoryName: template.categoryName,
            sheetName: sheet.name,
            columnHeader: col.header,
            formula: resolveFormula(col.formula, sheet.columns, 2),
            // Schema (lib/schema.ts) bắt buộc cột formula phải có note, nên
            // giá trị này luôn tồn tại — không cần fallback phòng thủ.
            note: col.note!,
          };

          if (!byName.has(name)) byName.set(name, []);
          byName.get(name)!.push(usage);
        }
      }
    }
  }

  const entries: FunctionEntry[] = [];
  for (const [name, usages] of byName) {
    const info = FUNCTION_INFO[name];
    if (!info) {
      throw new Error(
        `Hàm "${name}" xuất hiện trong công thức thật của một template nhưng chưa có mục từ điển trong lib/functions.ts (FUNCTION_INFO) — thêm syntax + definition trước khi build.`,
      );
    }
    entries.push({ slug: name.toLowerCase(), name, ...info, usages });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

let cache: FunctionEntry[] | undefined;

export function getAllFunctions(): FunctionEntry[] {
  cache ??= buildFunctions();
  return cache;
}

export function getFunction(slug: string): FunctionEntry | undefined {
  return getAllFunctions().find((f) => f.slug === slug);
}
