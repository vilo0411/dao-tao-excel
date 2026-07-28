import { z } from "zod";
import { columnLetter } from "./schema.ts";
import { CATEGORY_SLUGS, type CtaTarget } from "./site.ts";

/**
 * Schema của "bộ file" — một nhóm template chạy chung một quy trình công việc,
 * gồm các file đầu vào, các file xử lý, và đúng một file tổng.
 *
 * Tách khỏi lib/systems.ts vì cùng lý do lib/schema.ts tách khỏi
 * lib/templates.ts: sơ đồ vẽ ở phía client, mà loader thì import node:fs.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ROLES = ["input", "process", "master"] as const;
export type NodeRole = (typeof ROLES)[number];

/**
 * Thứ hạng vai trò, quyết định cột trên sơ đồ và chiều hợp lệ của mũi tên.
 * Dữ liệu chỉ được chảy sang hạng cao hơn — xem luật trong superRefine.
 */
export const ROLE_RANK: Record<NodeRole, number> = {
  input: 0,
  process: 1,
  master: 2,
};

export const ROLE_LABEL: Record<NodeRole, string> = {
  input: "Đầu vào",
  process: "Xử lý",
  master: "Tổng hợp",
};

/** Câu mô tả vai trò, dùng ở dải "file này nằm ở đâu" trên trang template. */
export const ROLE_SENTENCE: Record<NodeRole, string> = {
  input: "file đầu vào",
  process: "file xử lý",
  master: "file tổng",
};

const nodeSchema = z.object({
  /** Slug template. Node "live" phải khớp một template có thật. */
  slug: z.string().regex(SLUG, "slug phải viết thường, không dấu, nối bằng -"),
  role: z.enum(ROLES),
  /** "planned" = file chưa viết. Ô vẫn hiện trên sơ đồ nhưng mờ và không link. */
  status: z.enum(["live", "planned"]),
  /**
   * Tên ngắn để vẽ trong ô sơ đồ. Bắt buộc khai riêng vì h1 của template dài
   * tới cỡ "Mẫu Excel tính lương nhân viên 2026 (đã cập nhật thuế TNCN mới)" —
   * nhét nguyên vào một ô lưới thì vỡ layout.
   */
  shortName: z.string().min(1).max(24, "shortName tối đa 24 ký tự"),
  /** Ai chịu trách nhiệm và nhập gì, vd "HR nhập hằng ngày". */
  owner: z.string().min(1),
});

const edgeSchema = z.object({
  from: z.string().regex(SLUG),
  to: z.string().regex(SLUG),
  /** Dữ liệu chảy qua cạnh này, vd "số công tháng". Đây mới là phần có giá trị. */
  label: z.string().min(1).max(40, "nhãn mũi tên tối đa 40 ký tự"),
});

/**
 * Trần dòng của vùng tham chiếu xuyên sheet trong file gộp.
 *
 * Không dùng tham chiếu cả cột ($B:$B) vì Excel vẫn quét tới dòng 1.048.576 —
 * với năm sheet nối chằng chịt thì file mở lên tính lại hàng giây. Trần 500
 * dòng đủ cho quy mô mà bộ file này nhắm tới; vượt qua đó thì vấn đề không còn
 * là công thức nữa mà là nên dùng phần mềm.
 */
export const BUNDLE_ROW_LIMIT = 500;

/** Tên sheet hướng dẫn trong file gộp — chiếm chỗ, không cho bundle đặt trùng. */
export const BUNDLE_GUIDE_SHEET = "Hướng dẫn";

const SHEET_NAME = z
  .string()
  .min(1)
  .max(31, "tên sheet trong Excel tối đa 31 ký tự")
  .refine((n) => !/[\\/*?:[\]!]/.test(n), {
    // Dấu ! bị cấm thêm so với luật Excel: cú pháp [Sheet!key] tách theo nó.
    message: "tên sheet không được chứa \\ / * ? : [ ] !",
  });

const bundleSheetSchema = z.object({
  /** Slug template góp sheet này. Phải là node "live" của chính bộ. */
  node: z.string().regex(SLUG),
  /** Chỉ số sheet trong template đó (template có thể có nhiều sheet). */
  sheet: z.number().int().min(0).default(0),
  /**
   * Tên sheet trong file gộp. Khai tay chứ không suy ra từ template, vì công
   * thức nối trỏ tới nhau bằng đúng tên này — để script tự đặt thì đổi tên
   * template một cái là gãy hết liên kết mà không ai biết.
   */
  name: SHEET_NAME,
});

const bundleLinkSchema = z.object({
  /** Sheet trong file gộp bị đè công thức, theo bundleSheet.name. */
  sheet: SHEET_NAME,
  /** Cột bị đè, theo column.key của template gốc. */
  column: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  /**
   * Công thức nối. Ngoài `[key]{row}` như template, còn dùng được:
   *   `[Tên sheet!key]` → vùng tuyệt đối của cột đó ở sheet khác trong bộ.
   * Ví dụ: "=IFERROR(INDEX([Danh sách NV!hoTen],MATCH([maNV]{row},[Danh sách NV!maNV],0)),\"\")"
   */
  formula: z.string().min(1),
  /** Giải thích, lên thẳng trang bộ và sheet Hướng dẫn của file gộp. */
  note: z.string().min(1),
});

const bundleSchema = z
  .object({
    /** Câu mô tả file gộp, dùng ở nút tải và đầu sheet Hướng dẫn. */
    summary: z.string().min(1),
    /** Cột khóa nối các sheet, vd "Mã NV" — nhắc ở hướng dẫn. */
    keyName: z.string().min(1),
    sheets: z.array(bundleSheetSchema).min(2).max(12),
    links: z.array(bundleLinkSchema).min(1).max(40),
  })
  .superRefine((bundle, ctx) => {
    const order = new Map<string, number>();
    bundle.sheets.forEach((sheet, i) => {
      if (order.has(sheet.name)) {
        ctx.addIssue({
          code: "custom",
          message: `trùng tên sheet trong file gộp: ${sheet.name}`,
          path: ["sheets", i, "name"],
        });
      }
      order.set(sheet.name, i);

      if (sheet.name === BUNDLE_GUIDE_SHEET) {
        ctx.addIssue({
          code: "custom",
          message: `"${BUNDLE_GUIDE_SHEET}" là tên sheet dành riêng cho phần hướng dẫn của file gộp`,
          path: ["sheets", i, "name"],
        });
      }
    });

    bundle.links.forEach((link, i) => {
      const host = order.get(link.sheet);
      if (host === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `link trỏ tới sheet "${link.sheet}" không có trong file gộp`,
          path: ["links", i, "sheet"],
        });
        return;
      }

      if (!link.formula.includes("{row}")) {
        ctx.addIssue({
          code: "custom",
          message: `công thức nối cho "${link.sheet}.${link.column}" thiếu {row} — sẽ trỏ sai dòng khi kéo xuống`,
          path: ["links", i, "formula"],
        });
      }

      for (const [, ref] of link.formula.matchAll(/\[([^\]]+)\]/g)) {
        if (!ref.includes("!")) continue;
        const sheetName = ref.slice(0, ref.indexOf("!"));
        const source = order.get(sheetName);

        if (source === undefined) {
          ctx.addIssue({
            code: "custom",
            message: `công thức nối cho "${link.sheet}.${link.column}" trỏ tới sheet "${sheetName}" không có trong file gộp`,
            path: ["links", i, "formula"],
          });
          continue;
        }
        /*
         * Sheet nguồn phải đứng trước sheet đích. Đây là thứ chặn vòng lặp
         * tham chiếu: Excel mở file có vòng lặp sẽ hiện cảnh báo rồi trả về 0
         * ở mọi ô liên quan, và người dùng không có cách nào tự gỡ.
         */
        if (source >= host) {
          ctx.addIssue({
            code: "custom",
            message: `"${link.sheet}.${link.column}" lấy dữ liệu từ sheet "${sheetName}" đứng sau nó — xếp lại thứ tự sheet theo chiều đầu vào → xử lý → tổng`,
            path: ["links", i, "formula"],
          });
        }
      }
    });

    const seen = new Set<string>();
    bundle.links.forEach((link, i) => {
      const key = `${link.sheet}.${link.column}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `hai công thức nối cùng đè lên "${key}"`,
          path: ["links", i],
        });
      }
      seen.add(key);
    });
  });

export const systemSchema = z
  .object({
    slug: z.string().regex(SLUG, "slug phải viết thường, không dấu, nối bằng -"),
    category: z.enum(CATEGORY_SLUGS as [string, ...string[]]),

    h1: z.string().min(1),
    /**
     * Tên gọn để nhắc giữa câu văn. h1 thường có phần mở ngoặc ("... (5 file
     * nối vào một file tổng)") — nhét nguyên vào giữa một câu thì đọc gượng.
     */
    name: z.string().min(1).max(40, "name tối đa 40 ký tự"),
    metaTitle: z.string().min(1).max(60, "meta title nên <= 60 ký tự"),
    metaDesc: z
      .string()
      .min(120, "meta description nên >= 120 ký tự")
      .max(165, "meta description nên <= 165 ký tự"),
    intro: z.string().min(120),
    primaryKeyword: z.string().min(1),

    /** Nhịp chạy của quy trình, vd "Chốt một lần mỗi tháng". */
    cadence: z.string().min(1),

    nodes: z.array(nodeSchema).min(3).max(8),
    edges: z.array(edgeSchema).min(1).max(12),

    /**
     * File gộp: toàn bộ sheet của các file trong bộ nằm trong một workbook,
     * nối nhau bằng công thức thật. Chỉ khai được khi mọi node đã "live" —
     * xem luật trong superRefine.
     *
     * Đây mới là thứ giữ lời hứa của sơ đồ. Không có nó, người tải về nhận
     * mấy file rời và phải tự ghép tay đúng cái quy trình mà sơ đồ vừa vẽ.
     */
    bundle: bundleSchema.optional(),

    faq: z
      .array(z.object({ q: z.string().min(1), a: z.string().min(1) }))
      .min(2)
      .max(6),

    ctaTarget: z.enum(["consult", "hrCourse"]).optional(),
    ctaText: z.string().min(1),
    updatedAt: z.iso.date(),
  })
  .superRefine((system, ctx) => {
    const seen = new Set<string>();
    for (const node of system.nodes) {
      if (seen.has(node.slug)) {
        ctx.addIssue({
          code: "custom",
          message: `trùng node slug: ${node.slug}`,
          path: ["nodes"],
        });
      }
      seen.add(node.slug);
    }

    const masters = system.nodes.filter((n) => n.role === "master");
    if (masters.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: `mỗi bộ phải có đúng một node role="master", đang có ${masters.length}`,
        path: ["nodes"],
      });
    }

    const bySlug = new Map(system.nodes.map((n) => [n.slug, n]));

    system.edges.forEach((edge, i) => {
      const from = bySlug.get(edge.from);
      const to = bySlug.get(edge.to);

      if (!from) {
        ctx.addIssue({
          code: "custom",
          message: `edge.from "${edge.from}" không phải node nào trong bộ`,
          path: ["edges", i, "from"],
        });
      }
      if (!to) {
        ctx.addIssue({
          code: "custom",
          message: `edge.to "${edge.to}" không phải node nào trong bộ`,
          path: ["edges", i, "to"],
        });
      }
      if (!from || !to) return;

      /*
       * Dữ liệu chỉ chảy sang hạng vai trò cao hơn. Luật này làm hai việc cùng
       * lúc: chặn vòng lặp, và bảo đảm sơ đồ ba cột luôn vẽ được từ trái sang
       * phải — không có mũi tên nào phải quay ngược.
       */
      if (ROLE_RANK[to.role] <= ROLE_RANK[from.role]) {
        ctx.addIssue({
          code: "custom",
          message: `edge "${edge.from}" → "${edge.to}" chảy ngược: ${ROLE_LABEL[from.role]} không đưa dữ liệu sang ${ROLE_LABEL[to.role]}`,
          path: ["edges", i],
        });
      }
    });

    // File tổng mà không nhận dữ liệu từ đâu thì không phải file tổng.
    for (const master of masters) {
      if (!system.edges.some((e) => e.to === master.slug)) {
        ctx.addIssue({
          code: "custom",
          message: `node master "${master.slug}" không có edge nào đi vào`,
          path: ["edges"],
        });
      }
    }

    if (system.bundle) {
      /*
       * File gộp thiếu một file trong bộ là trường hợp tệ nhất: người dùng tin
       * rằng tải một file là đủ, rồi phát hiện thiếu khi đã nhập nửa tháng dữ
       * liệu. Thà không có file gộp còn hơn có một file gộp thiếu.
       */
      const inBundle = new Set(system.bundle.sheets.map((s) => s.node));
      for (const node of system.nodes) {
        if (node.status !== "live") {
          ctx.addIssue({
            code: "custom",
            message: `bộ có file gộp thì mọi node phải "live", nhưng "${node.slug}" còn "planned" — viết xong file đó rồi hãy khai bundle`,
            path: ["bundle", "sheets"],
          });
        } else if (!inBundle.has(node.slug)) {
          ctx.addIssue({
            code: "custom",
            message: `node "${node.slug}" không góp sheet nào vào file gộp`,
            path: ["bundle", "sheets"],
          });
        }
      }

      for (const [i, sheet] of system.bundle.sheets.entries()) {
        if (!bySlug.has(sheet.node)) {
          ctx.addIssue({
            code: "custom",
            message: `sheet gộp lấy từ "${sheet.node}" nhưng đó không phải node nào trong bộ`,
            path: ["bundle", "sheets", i, "node"],
          });
        }
      }

      /*
       * Thứ tự sheet trong file gộp phải trùng chiều dữ liệu của sơ đồ. Luật
       * "sheet nguồn đứng trước" ở trên đã chặn vòng lặp, luật này chặn việc
       * sơ đồ vẽ một đằng còn file mở ra xếp một nẻo.
       */
      let previousRank = -1;
      for (const [i, sheet] of system.bundle.sheets.entries()) {
        const node = bySlug.get(sheet.node);
        if (!node) continue;
        const rank = ROLE_RANK[node.role];
        if (rank < previousRank) {
          ctx.addIssue({
            code: "custom",
            message: `sheet "${sheet.name}" (${ROLE_LABEL[node.role]}) đứng sau một sheet vai trò cao hơn — xếp sheet theo đúng chiều đầu vào → xử lý → tổng như trên sơ đồ`,
            path: ["bundle", "sheets", i],
          });
        }
        previousRank = Math.max(previousRank, rank);
      }
    }

    // Node đứng lẻ không thuộc quy trình nào — hoặc thiếu edge, hoặc thừa node.
    for (const node of system.nodes) {
      const connected = system.edges.some(
        (e) => e.from === node.slug || e.to === node.slug,
      );
      if (!connected) {
        ctx.addIssue({
          code: "custom",
          message: `node "${node.slug}" không nối với node nào khác`,
          path: ["nodes"],
        });
      }
    }
  });

export type SystemSpec = z.infer<typeof systemSchema>;
export type SystemNodeSpec = SystemSpec["nodes"][number];
export type SystemEdge = SystemSpec["edges"][number];
export type BundleSpec = NonNullable<SystemSpec["bundle"]>;
export type BundleSheetSpec = BundleSpec["sheets"][number];
export type BundleLink = BundleSpec["links"][number];

/** Node sau khi đối chiếu với thư viện template. */
export type SystemNode = SystemNodeSpec & {
  /** Có khi status = "live". Node "planned" chưa có trang để trỏ tới. */
  href?: string;
  downloadUrl?: string;
};

/** Một dòng của bảng "công thức nối" trên trang bộ, đã resolve sang ô Excel thật. */
export type ResolvedLink = BundleLink & {
  /** Tiêu đề cột bị đè, để người đọc dò được trong file. */
  header: string;
  /** Công thức thật ở dòng đầu tiên, vd "=IFERROR(INDEX('Danh sách NV'!$C$2:$C$500,…". */
  resolved: string;
};

export type System = Omit<SystemSpec, "nodes"> & {
  nodes: SystemNode[];
  ctaTarget: CtaTarget;
  categoryName: string;
  href: string;
  /** Có khi bộ khai bundle — đường dẫn tới file gộp một workbook. */
  bundleUrl?: string;
  /** Công thức nối đã resolve, rỗng khi bộ chưa có file gộp. */
  bundleLinks: ResolvedLink[];
  /** Đếm file đã có / tổng số file trong bộ, hiện trên card. */
  liveCount: number;
  totalCount: number;
};

/** Phần dữ liệu vừa đủ để vẽ sơ đồ — xem TemplateCardData để biết vì sao cắt. */
export type SystemMapData = {
  slug: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
};

export type SystemCardData = {
  slug: string;
  href: string;
  h1: string;
  metaDesc: string;
  cadence: string;
  category: string;
  categoryName: string;
  liveCount: number;
  totalCount: number;
  /** Vai trò từng node theo thứ tự quy trình, để vẽ dãy ô mini trên card. */
  shape: NodeRole[];
  /** Bộ đã có bản gộp một workbook chưa — khác biệt lớn nhất giữa các bộ. */
  hasBundle: boolean;
};

/**
 * Đổi công thức nối sang công thức Excel thật trong file gộp.
 *
 *   `[key]{row}`        → ô cùng dòng ở chính sheet đó          → "B5"
 *   `[Tên sheet!key]`   → vùng cột tuyệt đối ở sheet khác       → "'Tên sheet'!$C$2:$C$500"
 *
 * scripts/build_bundle.py phải cài đặt giống hệt hàm này. Lệch nhau thì công
 * thức in trên trang khác công thức nằm trong file người ta tải về — đúng loại
 * sai lệch mà không ai phát hiện cho tới khi có người đối chiếu.
 */
export function resolveBundleFormula(
  formula: string,
  /** Cột của chính sheet chứa công thức. */
  hostColumns: { key: string }[],
  /** Tên sheet trong file gộp → danh sách cột của sheet đó. */
  sheetColumns: Map<string, { key: string }[]>,
  row: number,
): string {
  const hostLetters = new Map(hostColumns.map((c, i) => [c.key, columnLetter(i)]));

  return formula
    .replace(/\[([^\]]+)\]/g, (match, ref: string) => {
      const split = ref.indexOf("!");
      if (split === -1) return hostLetters.get(ref) ?? match;

      const sheetName = ref.slice(0, split);
      const key = ref.slice(split + 1);
      const columns = sheetColumns.get(sheetName);
      if (!columns) return match;

      const index = columns.findIndex((c) => c.key === key);
      if (index === -1) return match;

      const letter = columnLetter(index);
      // Tuyệt đối cả cột lẫn dòng: vùng tra cứu phải đứng yên khi kéo xuống.
      return `'${sheetName}'!$${letter}$2:$${letter}$${BUNDLE_ROW_LIMIT}`;
    })
    .replaceAll("{row}", String(row));
}

/** Sắp node theo thứ tự quy trình: đầu vào → xử lý → tổng. Giữ nguyên thứ tự khai trong cùng vai trò. */
export function sortNodes<T extends { role: NodeRole }>(nodes: T[]): T[] {
  return [...nodes].sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role]);
}
