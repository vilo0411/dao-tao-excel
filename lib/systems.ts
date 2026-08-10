import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
// Import tương đối (không dùng alias @/) để script Node chạy trực tiếp được.
import { CATEGORIES, CATEGORY_SLUGS, type CategorySlug } from "./site.ts";
import { getAllTemplates } from "./templates.ts";
import type { Template, TemplateSpec } from "./schema.ts";
import {
  resolveBundleFormula,
  ROLE_RANK,
  sortNodes,
  systemSchema,
  type ResolvedLink,
  type System,
  type SystemCardData,
  type SystemMapData,
  type SystemNode,
  type SystemSpec,
} from "./systems-schema.ts";

export {
  BUNDLE_ROW_LIMIT,
  resolveBundleFormula,
  ROLE_LABEL,
  ROLE_RANK,
  ROLE_SENTENCE,
  sortNodes,
  systemSchema,
  type BundleLink,
  type ResolvedLink,
  type NodeRole,
  type System,
  type SystemCardData,
  type SystemEdge,
  type SystemMapData,
  type SystemNode,
  type SystemSpec,
} from "./systems-schema.ts";

const DATA_DIR = join(process.cwd(), "data", "systems");

type TemplateSheet = TemplateSpec["sheets"][number];

/**
 * Đối chiếu khối bundle với cột thật của từng template, rồi resolve công thức
 * nối sang ô Excel.
 *
 * Schema chỉ kiểm được những gì đọc trong một file JSON: tên sheet có trùng
 * không, sheet nguồn có đứng trước không. Còn "cột [Danh sách NV!hoTen] có tồn
 * tại không" thì phải mở template ra mới biết — mà đúng chỗ đó mới là chỗ gãy
 * khi ai đó đổi tên cột.
 */
function resolveBundle(
  spec: SystemSpec,
  templateBySlug: Map<string, Template>,
): ResolvedLink[] {
  const bundle = spec.bundle;
  if (!bundle) return [];

  const fail = (message: string): never => {
    throw new Error(`Bộ file "${spec.slug}": ${message}`);
  };

  // Tên sheet trong file gộp → cột của sheet template tương ứng.
  const sheetColumns = new Map<string, TemplateSheet["columns"]>();
  for (const sheet of bundle.sheets) {
    const template = templateBySlug.get(sheet.node);
    if (!template) {
      fail(`file gộp lấy sheet từ "${sheet.node}" nhưng không có template nào dùng slug đó`);
    }

    const source = template!.sheets[sheet.sheet];
    if (!source) {
      fail(
        `file gộp lấy sheet số ${sheet.sheet} của "${sheet.node}" nhưng template đó chỉ có ${template!.sheets.length} sheet`,
      );
    }
    sheetColumns.set(sheet.name, source!.columns);
  }

  return bundle.links.map((link) => {
    const hostColumns = sheetColumns.get(link.sheet)!;
    const host = hostColumns.find((c) => c.key === link.column);
    if (!host) {
      fail(
        `công thức nối đè lên cột "${link.column}" nhưng sheet "${link.sheet}" không có cột nào dùng key đó`,
      );
    }

    /*
     * Đè lên một cột vốn đã là cột công thức nghĩa là template gốc và file gộp
     * tính cùng một ô theo hai cách khác nhau — sớm muộn cũng lệch, mà lệch ở
     * đây thì không có gì báo.
     */
    if (host!.type === "formula") {
      fail(
        `công thức nối đè lên "${link.sheet}.${link.column}", nhưng cột đó đã là cột công thức trong template gốc — chỉ được nối vào cột nhập liệu`,
      );
    }

    for (const [, ref] of link.formula.matchAll(/\[([^\]]+)\]/g)) {
      const split = ref.indexOf("!");
      const columns = split === -1 ? hostColumns : sheetColumns.get(ref.slice(0, split));
      const key = split === -1 ? ref : ref.slice(split + 1);

      if (!columns?.some((c) => c.key === key)) {
        fail(
          `công thức nối cho "${link.sheet}.${link.column}" trỏ tới [${ref}] nhưng không có cột nào dùng key đó`,
        );
      }
    }

    return {
      ...link,
      header: host!.header,
      resolved: resolveBundleFormula(link.formula, hostColumns, sheetColumns, 2),
    };
  });
}

function loadAll(): System[] {
  let files: string[];
  try {
    files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return []; // chưa dựng bộ nào
  }

  const templates = getAllTemplates();
  const templateBySlug = new Map(templates.map((t) => [t.slug, t]));
  const systems: System[] = [];

  for (const file of files) {
    const path = join(DATA_DIR, file);
    const parsed = systemSchema.safeParse(
      JSON.parse(readFileSync(path, "utf8")),
    );

    // Fail build thay vì âm thầm bỏ qua — cùng lý do như loader template.
    if (!parsed.success) {
      throw new Error(
        `Bộ file không hợp lệ: ${path}\n${z.prettifyError(parsed.error)}`,
      );
    }

    const spec = parsed.data;
    if (`${spec.slug}.json` !== file) {
      throw new Error(
        `Bộ file không hợp lệ: ${path}\n  tên file phải là "${spec.slug}.json"`,
      );
    }

    const nodes: SystemNode[] = sortNodes(spec.nodes).map((node) => {
      const template = templateBySlug.get(node.slug);

      if (node.status === "live" && !template) {
        throw new Error(
          `Bộ file "${spec.slug}": node "${node.slug}" khai status="live" nhưng không có template nào dùng slug đó`,
        );
      }
      /*
       * Chiều ngược lại cũng phải chặn: template đã viết xong mà node vẫn để
       * "planned" thì sơ đồ hiện ô mờ trong khi trang thật đang sống — người
       * đọc mất một file, và ta mất một internal link.
       */
      if (node.status === "planned" && template) {
        throw new Error(
          `Bộ file "${spec.slug}": node "${node.slug}" khai status="planned" nhưng template đã tồn tại — đổi sang "live"`,
        );
      }

      return {
        ...node,
        href: template?.href,
        downloadUrl: template?.downloadUrl,
      };
    });

    const liveCount = nodes.filter((n) => n.status === "live").length;

    systems.push({
      ...spec,
      nodes,
      ctaTarget:
        spec.ctaTarget ?? CATEGORIES[spec.category as CategorySlug].defaultCta,
      categoryName: CATEGORIES[spec.category as CategorySlug].name,
      /*
       * Bộ file nằm ngay dưới category, cùng route với template lẻ
       * (/mau-excel/[category]/[slug]) — không có nhánh "bo-file" riêng. Một
       * bộ và một template không bao giờ là hai loại cửa vào khác nhau cho
       * cùng một chủ đề, nên chúng chia sẻ luôn một không gian slug.
       */
      href: `/mau-excel/${spec.category}/${spec.slug}`,
      bundleUrl: spec.bundle
        ? `/downloads/${spec.category}/${spec.slug}.xlsx`
        : undefined,
      bundleLinks: resolveBundle(spec, templateBySlug),
      liveCount,
      totalCount: nodes.length,
    });
  }

  const slugs = new Set(systems.map((s) => s.slug));
  if (slugs.size !== systems.length) {
    throw new Error("Có slug bị trùng giữa các bộ file");
  }

  /*
   * Bộ file và template lẻ cùng chia sẻ /mau-excel/[category]/[slug], nên slug
   * trùng nhau bây giờ là một va chạm URL thật, không chỉ là mơ hồ về sau.
   */
  for (const system of systems) {
    if (templateBySlug.has(system.slug)) {
      throw new Error(
        `Bộ file "${system.slug}" trùng slug với một template — đặt tên khác`,
      );
    }
    if ((CATEGORY_SLUGS as readonly string[]).includes(system.slug)) {
      throw new Error(`Bộ file "${system.slug}" trùng slug với một category`);
    }
  }

  // Một template chỉ thuộc tối đa một bộ, để dải "file này nằm ở đâu" trên
  // trang template không mơ hồ.
  const owner = new Map<string, string>();
  for (const system of systems) {
    for (const node of system.nodes) {
      const previous = owner.get(node.slug);
      if (previous) {
        throw new Error(
          `File "${node.slug}" nằm trong cả hai bộ "${previous}" và "${system.slug}" — mỗi file chỉ thuộc một bộ`,
        );
      }
      owner.set(node.slug, system.slug);
    }
  }

  return systems.sort((a, b) => a.slug.localeCompare(b.slug));
}

let cache: System[] | undefined;

export function getAllSystems(): System[] {
  cache ??= loadAll();
  return cache;
}

export function getSystem(slug: string): System | undefined {
  return getAllSystems().find((s) => s.slug === slug);
}

export function getSystemsByCategory(category: string): System[] {
  return getAllSystems().filter((s) => s.category === category);
}

/**
 * Số template tối thiểu để một nhóm việc được mở trang hub (PRD mục 2.1).
 *
 * Trang hub của một nhóm có hai file là trang mỏng: cùng một khung h1, câu mô
 * tả, dải thông số, mà bên dưới gần như không có gì. Với domain mới thì vài
 * trang như vậy đủ để kéo đánh giá chất lượng toàn site xuống.
 */
export const MIN_TEMPLATES_PER_CATEGORY = 5;

/**
 * Nhóm việc đã đủ ngưỡng mở trang hub.
 *
 * Loại khỏi sitemap thôi là chưa đủ — sitemap là gợi ý khám phá chứ không phải
 * chỉ thị index, trang vẫn bị crawl nếu Google tìm ra đường khác. Không dựng
 * thì nó 404, đúng với thực tế "chưa có gì ở đây", và tự sống lại ngay khi
 * nhóm đủ file.
 *
 * Nhóm đang dở dang (có file nhưng chưa đủ ngưỡng) thì FAIL BUILD chứ không
 * lặng lẽ bị lọc ra. Lọc im lặng nghe có vẻ an toàn hơn nhưng nó tạo ra thứ tệ
 * hơn cả trang mỏng: các trang template vẫn được dựng, vẫn nằm trong sitemap,
 * mà breadcrumb của chúng trỏ về một hub 404 — trang mồ côi thật sự, đúng thứ
 * mà cả site đang cố tránh. Hai lối ra đều nằm trong tay người viết: viết cho
 * đủ ngưỡng, hoặc chuyển file sang nhóm khác.
 *
 * Đặt ở đây vì đây là module duy nhất đã nhìn thấy cả template lẫn bộ file.
 */
export function getPopulatedCategories(): CategorySlug[] {
  const templates = getAllTemplates();
  const systems = getAllSystems();

  return CATEGORY_SLUGS.filter((category) => {
    const count = templates.filter((t) => t.category === category).length;
    if (count === 0) {
      // Bộ file luôn gồm các template cùng nhóm, nên nhóm không template mà có
      // bộ là chuyện không thể — kiểm lại cho chắc thay vì tin vào lập luận đó.
      if (systems.some((s) => s.category === category)) {
        throw new Error(
          `Nhóm "${category}" có bộ file nhưng không có template nào — bộ file phải gồm các template cùng nhóm.`,
        );
      }
      return false;
    }
    if (count < MIN_TEMPLATES_PER_CATEGORY) {
      throw new Error(
        `Nhóm "${category}" mới có ${count} template, cần ít nhất ${MIN_TEMPLATES_PER_CATEGORY} mới mở được trang hub (PRD mục 2.1).\n` +
          `  Viết thêm ${MIN_TEMPLATES_PER_CATEGORY - count} template nữa, hoặc chuyển ${count} file đang có sang nhóm khác.\n` +
          `  Đừng lọc nhóm này ra: trang template vẫn dựng, còn breadcrumb của chúng sẽ trỏ về một hub 404.`,
      );
    }
    return true;
  });
}

/** Bộ chứa template này, kèm node tương ứng. Undefined nếu file đứng lẻ. */
export function getSystemForTemplate(
  slug: string,
): { system: System; node: SystemNode } | undefined {
  for (const system of getAllSystems()) {
    const node = system.nodes.find((n) => n.slug === slug);
    if (node) return { system, node };
  }
  return undefined;
}

/** Cắt gọn còn đúng phần sơ đồ cần — component vẽ sơ đồ chạy phía client. */
export function toMapData(system: System): SystemMapData {
  return { slug: system.slug, nodes: system.nodes, edges: system.edges };
}

export function toSystemCardData(system: System): SystemCardData {
  return {
    slug: system.slug,
    href: system.href,
    h1: system.h1,
    metaDesc: system.metaDesc,
    cadence: system.cadence,
    category: system.category,
    categoryName: system.categoryName,
    liveCount: system.liveCount,
    totalCount: system.totalCount,
    shape: system.nodes.map((n) => n.role),
    hasBundle: Boolean(system.bundleUrl),
  };
}

/**
 * Các bước chạy quy trình, suy ra từ node và edge chứ không viết tay — mô tả
 * bước mà lệch với sơ đồ ngay bên trên nó thì còn tệ hơn là không có.
 */
export function getFlowSteps(system: System): {
  node: SystemNode;
  receives: { from: SystemNode; label: string }[];
  sends: { to: SystemNode; label: string }[];
}[] {
  const bySlug = new Map(system.nodes.map((n) => [n.slug, n]));

  return [...system.nodes]
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role])
    .map((node) => ({
      node,
      receives: system.edges
        .filter((e) => e.to === node.slug)
        .map((e) => ({ from: bySlug.get(e.from)!, label: e.label })),
      sends: system.edges
        .filter((e) => e.from === node.slug)
        .map((e) => ({ to: bySlug.get(e.to)!, label: e.label })),
    }));
}
