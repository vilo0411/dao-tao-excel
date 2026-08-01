import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
// Import tương đối (không dùng alias @/) để script Node chạy trực tiếp được
// đúng loader này, thay vì phải dựng lại logic validate lần thứ hai.
import { CATEGORIES, CATEGORY_SLUGS } from "./site.ts";
import {
  templateSchema,
  toColumnMap,
  type ComputedValues,
  type Template,
  type TemplateCardData,
  type TemplateSpec,
} from "./schema.ts";

export {
  templateSchema,
  columnLetter,
  resolveFormula,
  toColumnMap,
  toSheetStrip,
  DIFFICULTY_LABEL,
  type ColumnMap,
  type SheetStrip,
  type TemplateSpec,
  type ComputedValues,
  type Template,
  type TemplateCardData,
} from "./schema.ts";

/**
 * Các token trông giống lời gọi hàm nhưng không phải hàm Excel, cần loại bỏ
 * khỏi danh sách "hàm sử dụng" hiển thị trên trang.
 */
const NOT_FUNCTIONS = new Set(["IF_ERROR"]);

function extractFunctions(spec: TemplateSpec): string[] {
  const found = new Set<string>();
  for (const sheet of spec.sheets) {
    for (const col of sheet.columns) {
      if (!col.formula) continue;
      for (const [, name] of col.formula.matchAll(/\b([A-Z][A-Z0-9.]*)\s*\(/g)) {
        if (!NOT_FUNCTIONS.has(name)) found.add(name);
      }
    }
  }
  return [...found].sort();
}

const DATA_DIR = join(process.cwd(), "data", "templates");
const COMPUTED_DIR = join(process.cwd(), "data", "computed");

/**
 * Đọc giá trị đã qua QA. Không bắt buộc: thiếu file thì trang vẫn dựng được,
 * chỉ là ô công thức hiển thị nhãn thay cho con số. Để build không phụ thuộc
 * cứng vào việc đã chạy pipeline Python hay chưa.
 */
function loadComputed(
  category: string,
  slug: string,
): ComputedValues | undefined {
  try {
    return JSON.parse(
      readFileSync(join(COMPUTED_DIR, category, `${slug}.json`), "utf8"),
    ) as ComputedValues;
  } catch {
    return undefined;
  }
}

function loadAll(): Template[] {
  const templates: Template[] = [];

  for (const category of CATEGORY_SLUGS) {
    const dir = join(DATA_DIR, category);
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
      continue; // category chưa có template nào
    }

    for (const file of files) {
      const path = join(dir, file);
      const parsed = templateSchema.safeParse(
        JSON.parse(readFileSync(path, "utf8")),
      );

      // Fail build thay vì âm thầm bỏ qua: spec sinh bằng AI nên sai sót là
      // chuyện bình thường, phải chặn ngay ở build chứ không để lọt lên production.
      if (!parsed.success) {
        throw new Error(
          `Spec không hợp lệ: ${path}\n${z.prettifyError(parsed.error)}`,
        );
      }

      const spec = parsed.data;
      if (spec.category !== category) {
        throw new Error(
          `Spec không hợp lệ: ${path}\n  category "${spec.category}" không khớp thư mục "${category}"`,
        );
      }
      if (`${spec.slug}.json` !== file) {
        throw new Error(
          `Spec không hợp lệ: ${path}\n  tên file phải là "${spec.slug}.json"`,
        );
      }

      templates.push({
        ...spec,
        functions: extractFunctions(spec),
        computed: loadComputed(category, spec.slug),
        ctaTarget: spec.ctaTarget ?? CATEGORIES[category].defaultCta,
        categoryName: CATEGORIES[category].name,
        href: `/mau-excel/${spec.category}/${spec.slug}`,
        downloadUrl: `/downloads/${spec.category}/${spec.slug}.xlsx`,
      });
    }
  }

  const slugs = new Set(templates.map((t) => t.slug));
  const duplicates = templates.length - slugs.size;
  if (duplicates > 0) {
    throw new Error(`Có ${duplicates} slug bị trùng giữa các category`);
  }

  // Related link trỏ vào trang không tồn tại sẽ thành link gãy trên toàn site.
  for (const t of templates) {
    for (const related of t.relatedSlugs) {
      if (related === t.slug) {
        throw new Error(`${t.slug}: relatedSlugs không được trỏ về chính nó`);
      }
      if (!slugs.has(related)) {
        throw new Error(
          `${t.slug}: relatedSlugs trỏ tới "${related}" nhưng không có template nào dùng slug đó`,
        );
      }
    }
  }

  return templates.sort((a, b) => a.slug.localeCompare(b.slug));
}

let cache: Template[] | undefined;

export function getAllTemplates(): Template[] {
  cache ??= loadAll();
  return cache;
}

export function getTemplatesByCategory(category: string): Template[] {
  return getAllTemplates().filter((t) => t.category === category);
}

export function getTemplate(
  category: string,
  slug: string,
): Template | undefined {
  return getAllTemplates().find(
    (t) => t.category === category && t.slug === slug,
  );
}

/**
 * Cắt gọn còn đúng những trường tầng danh sách cần, trước khi đưa sang
 * component chạy phía client. Xem `TemplateCardData` để biết vì sao.
 */
export function toCardData(t: Template): TemplateCardData {
  return {
    slug: t.slug,
    href: t.href,
    h1: t.h1,
    metaDesc: t.metaDesc,
    functions: t.functions,
    difficulty: t.difficulty,
    category: t.category,
    categoryName: t.categoryName,
    shape: t.sheets[0].columns.map((c) => c.type === "formula"),
  };
}

/**
 * Gắn thêm danh sách cột rút gọn cho những chỗ vẽ card.
 *
 * Tách khỏi `toCardData` chứ không gộp vào: trang thư viện đẩy dữ liệu của cả
 * thư viện xuống component lọc phía client, tức mọi trường ở đây đều đi thẳng
 * vào HTML.
 *
 * Trang thư viện GIỜ CÓ trả giá đó — TemplateBrowser thêm kiểu xem lưới nên
 * nó gọi withThumb cho cả thư viện. Trước đây nó chỉ vẽ danh sách dạng dòng
 * nên dùng toCardData. Cái giá là mỗi file cõng thêm năm tên cột cùng mảng
 * boolean; ở 21 file là vài KB, chấp nhận được. Nếu thư viện lớn tới mức HTML
 * trang đó thành vấn đề thì chỗ phải sửa là đây: cắt thumb khỏi payload và cho
 * kiểu lưới tự lấy thêm, chứ đừng bỏ kiểu lưới.
 *
 * Năm cột là trần vừa một card ba-lên-một-hàng mà không phải cắt chữ tên cột.
 */
export function withThumb(t: Template): TemplateCardData {
  return { ...toCardData(t), thumb: toColumnMap(t.sheets[0], { max: 5 }) };
}

/**
 * Related templates để internal linking. Nếu spec khai thiếu thì bù bằng
 * template cùng category, đảm bảo không trang nào bị mồ côi.
 */
export function getRelatedTemplates(template: Template, limit = 3): Template[] {
  const all = getAllTemplates();
  const picked = template.relatedSlugs
    .map((slug) => all.find((t) => t.slug === slug))
    .filter((t): t is Template => Boolean(t));

  if (picked.length >= limit) return picked.slice(0, limit);

  const fallback = all.filter(
    (t) =>
      t.category === template.category &&
      t.slug !== template.slug &&
      !picked.some((p) => p.slug === t.slug),
  );

  return [...picked, ...fallback].slice(0, limit);
}
