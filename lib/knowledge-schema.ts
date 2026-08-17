import { z } from "zod";
import { PILLAR_SLUGS, type CtaTarget, type PillarSlug } from "./site.ts";

/**
 * Schema của khu /kien-thuc-excel, cùng các hàm thuần đi kèm.
 *
 * Tách khỏi lib/knowledge.ts đúng vì lý do lib/schema.ts tách khỏi
 * lib/templates.ts: component chạy phía client cần slugifyHeading và
 * formatValue, mà nửa loader lại import node:fs nên không bundle cho trình
 * duyệt được.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LUẬT QUAN TRỌNG NHẤT CỦA FILE NÀY, và lý do nó nằm ở tầng hình dạng dữ liệu
 * chứ không nằm trong một đoạn tài liệu:
 *
 * Site có ba khu trả lời ba câu hỏi không giao nhau (xem PILLARS trong
 * lib/site.ts). Một bài viết ở khu kiến thức KHÔNG được viết lại nội dung của
 * /ham-excel hay /mau-excel. Cách ép luật đó không phải là cấm, mà là làm cho
 * việc vi phạm trở nên bất khả biểu diễn:
 *
 *   - Không có trường `syntax` hay `definition` → không có chỗ nào chép cú
 *     pháp một hàm vào. Muốn nói về hàm thì dùng khối `functionRef`, và khối
 *     đó chỉ mang `slug` + `why`; cú pháp do component đọc từ FUNCTION_INFO,
 *     tức là vẫn từ /ham-excel, và luôn kèm link sang đó.
 *   - Không có trường `sheets`, `columns`, `downloadUrl` → không có chỗ nào
 *     dựng lại một file mẫu. Muốn khoe bảng thì dùng khối `sheet`, kéo sheet
 *     thật của một template có sẵn.
 *
 * Hai tầng còn lại (tường lửa từ khóa, và luật công thức phải trỏ ra) nằm ở
 * lib/knowledge.ts vì chúng cần nhìn thấy cả ba corpus.
 * ─────────────────────────────────────────────────────────────────────────
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Ngưỡng chống thin content. Xem ghi chú từng hằng số. */
export const MIN_WORDS = 1000;
export const MIN_H2 = 3;
export const MAX_RELATED_POSTS = 5;

/** Ảnh của khu kiến thức sống riêng một thư mục để không lẫn với ảnh template. */
const IMAGE_SRC = /^\/kien-thuc\/[a-z0-9-]+\.(png|webp|jpg)$/;

/** Mã lỗi Excel dạng #VALUE!, #N/A, #DIV/0!. */
const ERROR_CODE = /^#[A-Z0-9/!?]+$/;

/**
 * Không phải hỏng hóc nào của Excel cũng có mã lỗi.
 *
 * Lỗi font tiếng Việt, công thức hiện ra dưới dạng chữ, file không mở được —
 * đều là thứ người ta gõ vào Google mà Excel không đặt tên bằng một chuỗi
 * `#...` nào cả. Ràng buộc ban đầu chỉ nhận mã `#...`, và nó chặn mất đúng
 * những bài đó khỏi khối errorCase, đẩy chúng thành bài không có bằng chứng.
 *
 * Nên `error` nhận hai dạng: một mã lỗi thật, hoặc một triệu chứng viết ngắn.
 * Chỉ dạng mã mới đi vào `errorTags` của thẻ bài (xem toPostCardData) — nhãn
 * trên thẻ để người đọc nhận ra mã lỗi họ đang gặp, và nhét một câu tiếng Việt
 * vào đó thì nhãn hết là nhãn.
 */
const SYMPTOM_MAX = 48;

export function isErrorCode(value: string): boolean {
  return ERROR_CODE.test(value);
}

// ---------------------------------------------------------------------------
// Khối thân bài
// ---------------------------------------------------------------------------

/**
 * Thân bài là mảng khối CÓ KIỂU, không phải HTML hay Markdown.
 *
 * Cái giá là viết bài dài dòng hơn. Cái được là mọi thứ kiểm được lúc build:
 * ảnh có tồn tại không, template được nhúng có thật không, công thức có kèm
 * giải thích không, heading có trùng id không. Với một corpus mà phần lớn nội
 * dung sinh bằng AI thì đây là đánh đổi đúng — cùng lập luận đã ghi ở
 * prd-excel-template-hub.md mục 3.2.
 *
 * Dùng discriminatedUnion chứ không phải union thường: Zod sẽ báo "khối #4:
 * thiếu trường note" thay vì đổ ra 14 lỗi của 14 nhánh không khớp.
 */
export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    text: z.string().min(40, "đoạn văn dưới 40 ký tự thì nên gộp vào đoạn bên cạnh"),
  }),

  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(4).max(80),
  }),

  z.object({
    type: z.literal("list"),
    ordered: z.boolean().default(false),
    items: z.array(z.string().min(10)).min(2).max(10),
  }),

  z.object({
    type: z.literal("steps"),
    items: z
      .array(z.object({ step: z.string().min(1), detail: z.string().min(1) }))
      .min(2)
      .max(8),
  }),

  z.object({
    type: z.literal("table"),
    caption: z.string().min(1),
    headers: z.array(z.string().min(1)).min(2).max(6),
    rows: z.array(z.array(z.string())).min(1).max(12),
    /** Hiện nút chép TSV để dán thẳng vào Excel. */
    copyable: z.boolean().default(false),
  }),

  z.object({
    type: z.literal("formula"),
    formula: z.string().startsWith("=", "công thức phải bắt đầu bằng ="),
    /**
     * Bắt buộc, và đây là ràng buộc chống thin content quan trọng nhất của
     * khối này — sao chép nguyên tinh thần của luật "cột formula bắt buộc có
     * note" ở lib/schema.ts. Một công thức dán vào bài mà không nói nó làm gì
     * thì đúng là thứ đối thủ đang làm.
     */
    note: z.string().min(40),
    caption: z.string().optional(),
  }),

  z.object({
    type: z.literal("errorCase"),
    /** Mã lỗi (#VALUE!, #N/A...) hoặc triệu chứng ngắn khi Excel không đặt mã. */
    error: z
      .string()
      .min(3)
      .max(SYMPTOM_MAX)
      .refine((v) => ERROR_CODE.test(v) || !v.startsWith("#"), {
        message:
          "bắt đầu bằng # thì phải là mã lỗi hợp lệ (#VALUE!, #N/A, #DIV/0!...); " +
          "còn triệu chứng không có mã thì viết bằng chữ, đừng bịa ra một mã",
      }),
    cause: z.string().min(40),
    fix: z.string().min(40),
  }),

  z.object({
    type: z.literal("callout"),
    tone: z.enum(["canh-bao", "meo", "luu-y"]),
    title: z.string().min(1),
    text: z.string().min(40),
  }),

  z.object({
    type: z.literal("image"),
    src: z.string().regex(IMAGE_SRC, "ảnh phải nằm trong public/kien-thuc/"),
    alt: z.string().min(10, "alt phải mô tả được ảnh, không phải tên file"),
    /** Bắt buộc để CLS bằng 0 — đây là điểm nghi ngờ duy nhất của Lighthouse. */
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    caption: z.string().optional(),
  }),

  z.object({
    type: z.literal("sheet"),
    templateSlug: z.string().regex(SLUG),
    sheetIndex: z.number().int().min(0).default(0),
    note: z.string().min(30, "phải nói vì sao bảng này liên quan tới bài"),
    copyable: z.boolean().default(false),
  }),

  z.object({
    type: z.literal("video"),
    tiktokId: z.string().regex(/^\d{6,}$/),
  }),

  z.object({
    type: z.literal("functionRef"),
    slug: z.string().regex(SLUG),
    /**
     * Phần bài viết đóng góp: vì sao hàm này liên quan tới chuyện đang bàn.
     * Cú pháp và định nghĩa KHÔNG khai ở đây — component đọc từ FUNCTION_INFO.
     */
    why: z.string().min(30),
  }),

  z.object({
    type: z.literal("templateRef"),
    slug: z.string().regex(SLUG),
    why: z.string().min(30),
  }),

  z.object({
    type: z.literal("sandbox"),
    title: z.string().min(1),
    /**
     * Lưới dữ liệu, gốc ở A1. Chỉ nhận số, chuỗi, boolean và null (ô trống) —
     * không nhận công thức: lưới là dữ liệu đầu vào, công thức là thứ người
     * đọc gõ.
     */
    grid: z
      .array(z.array(z.union([z.number(), z.string(), z.boolean(), z.null()])))
      .min(1)
      .max(12),
    prompt: z.string().min(20),
    /** Công thức đáp án. Phải chạy được bằng lib/formula-eval.ts. */
    answer: z.string().startsWith("="),
    /**
     * Kết quả mong đợi, viết dạng chuỗi hiển thị. Loader so nó với kết quả
     * thật của evaluator và gãy build nếu lệch — nghĩa là không thể publish
     * một sandbox mà đáp án của chính nó sai.
     */
    expected: z.string(),
    hint: z.string().optional(),
  }),
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

/** Khối được coi là BẰNG CHỨNG — thứ đối thủ không có. Mỗi bài phải có ≥1. */
export const EVIDENCE_BLOCKS: BlockType[] = [
  "sheet",
  "formula",
  "errorCase",
  "sandbox",
];

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export const quizItemSchema = z
  .object({
    q: z.string().min(10),
    options: z.array(z.string().min(1)).min(3).max(4),
    /** Chỉ số 0-based của đáp án đúng trong `options`. */
    answer: z.number().int().min(0),
    /** Hiện SAU khi trả lời, đúng hay sai đều hiện. Đây mới là phần dạy học. */
    explain: z.string().min(30),
  })
  .refine((q) => q.answer < q.options.length, {
    message: "answer trỏ ra ngoài mảng options",
    path: ["answer"],
  });

export type QuizItem = z.infer<typeof quizItemSchema>;

// ---------------------------------------------------------------------------
// Hàm thuần
// ---------------------------------------------------------------------------

/**
 * Sinh id neo từ chữ tiêu đề.
 *
 * Dùng CHUNG cho lúc render heading và lúc kiểm trùng id. Hai cài đặt riêng sẽ
 * có ngày lệch nhau, và khi lệch thì mục lục trỏ vào hư không — một lỗi im
 * lặng, không ai thấy cho tới khi có người bấm.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Chữ hiển thị của một khối, dùng để đếm từ. Khối không có chữ trả "". */
function blockText(b: Block): string {
  switch (b.type) {
    case "paragraph":
    case "heading":
      return b.text;
    case "list":
      return b.items.join(" ");
    case "steps":
      return b.items.map((i) => `${i.step} ${i.detail}`).join(" ");
    case "table":
      return [b.caption, ...b.headers, ...b.rows.flat()].join(" ");
    case "formula":
      return `${b.note} ${b.caption ?? ""}`;
    case "errorCase":
      return `${b.cause} ${b.fix}`;
    case "callout":
      return `${b.title} ${b.text}`;
    case "image":
      return b.caption ?? "";
    case "sheet":
      return b.note;
    case "functionRef":
    case "templateRef":
      return b.why;
    case "sandbox":
      return `${b.title} ${b.prompt} ${b.hint ?? ""}`;
    case "video":
      return "";
  }
}

/**
 * Đếm từ của thân bài.
 *
 * Cố ý KHÔNG đếm chữ trong công thức, tên cột hay mã lỗi: chúng là bằng chứng,
 * không phải văn xuôi, và tính chúng vào ngưỡng 1.000 từ sẽ cho phép một bài
 * gồm mười cái bảng vượt cổng mà không giải thích gì.
 */
export function wordCount(body: Block[]): number {
  return body
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Mục lục dựng từ heading cấp 2. Cấp 3 không lên mục lục — 15 dòng là quá dài. */
export function tocFromBody(body: Block[]): { id: string; text: string }[] {
  return body
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading")
    .filter((b) => b.level === 2)
    .map((b) => ({ id: slugifyHeading(b.text), text: b.text }));
}

/**
 * Chuẩn hóa từ khóa để so trùng: bỏ dấu, hạ chữ thường, gộp khoảng trắng.
 *
 * "Lỗi #VALUE! trong Excel" và "loi value trong excel" phải va nhau, nếu không
 * thì tường lửa từ khóa chỉ chặn được người gõ y hệt.
 */
export function normalizeKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Bài viết
// ---------------------------------------------------------------------------

export const postSchema = z
  .object({
    slug: z.string().regex(SLUG, "slug phải viết thường, không dấu, nối bằng -"),
    pillar: z.enum(PILLAR_SLUGS as [string, ...string[]]),
    postType: z.enum(["sua-loi", "quy-trinh", "khai-niem"]),

    /**
     * Vị trí trong chuỗi bài của cụm, dùng cho điều hướng Bài trước / Bài sau.
     * Loader ép phải duy nhất VÀ liên tục 1..N: một khoảng trống nghĩa là có
     * bài đã bị xóa mà chuỗi chưa đánh số lại, và Prev/Next sẽ nhảy cóc.
     */
    order: z.number().int().positive(),

    h1: z.string().min(1),
    metaTitle: z.string().min(1).max(60, "meta title nên <= 60 ký tự"),
    metaDesc: z
      .string()
      .min(120, "meta description nên >= 120 ký tự")
      .max(165, "meta description nên <= 165 ký tự"),
    intro: z.string().min(120),
    primaryKeyword: z.string().min(1),
    difficulty: z.enum(["co-ban", "trung-cap", "nang-cao"]),

    body: z.array(blockSchema).min(6),
    faq: z
      .array(z.object({ q: z.string().min(1), a: z.string().min(1) }))
      .min(2)
      .max(6),
    quiz: z.array(quizItemSchema).min(3).max(5),

    /**
     * Link ra khu file, BẮT BUỘC ít nhất một. Cùng với ràng buộc #7 bên dưới,
     * đây là thứ bảo đảm không bài nào đứng một mình — và bảo đảm bằng code
     * chứ không bằng việc người viết nhớ.
     */
    templateRefs: z.array(z.string().regex(SLUG)).min(1).max(3),
    /** Không bắt buộc: lỗi font, lỗi in ấn không dính hàm nào cả. */
    functionRefs: z.array(z.string().regex(SLUG)).max(5).default([]),

    relatedSlugs: z.array(z.string().regex(SLUG)).max(MAX_RELATED_POSTS).default([]),
    ctaTarget: z.enum(["consult", "hrCourse"]).optional(),
    ctaText: z.string().min(1),
    updatedAt: z.iso.date(),
  })
  .superRefine((post, ctx) => {
    const fail = (message: string, path: (string | number)[] = []) =>
      ctx.addIssue({ code: "custom", message, path });

    // 1. Primary keyword phải có mặt trong intro.
    if (!normalizeKeyword(post.intro).includes(normalizeKeyword(post.primaryKeyword))) {
      fail(
        `intro không chứa primary keyword "${post.primaryKeyword}"`,
        ["intro"],
      );
    }

    // 2. Ngưỡng độ dài. Đối thủ viết 1.300–1.800 từ nhưng không có công thức
    //    thật nào; 1.000 từ kèm bằng chứng chạy được là bài dày hơn.
    const words = wordCount(post.body);
    if (words < MIN_WORDS) {
      fail(`thân bài mới ${words} từ, cần >= ${MIN_WORDS}`, ["body"]);
    }

    // 3. Đủ heading để mục lục có nghĩa.
    const h2 = post.body.filter((b) => b.type === "heading" && b.level === 2);
    if (h2.length < MIN_H2) {
      fail(`mới có ${h2.length} heading cấp 2, cần >= ${MIN_H2}`, ["body"]);
    }

    // 4. Id neo không được trùng — trùng thì mục lục có hai dòng nhảy cùng chỗ.
    const ids = new Set<string>();
    for (const b of post.body) {
      if (b.type !== "heading") continue;
      const id = slugifyHeading(b.text);
      if (ids.has(id)) fail(`hai heading cùng sinh ra id "${id}"`, ["body"]);
      ids.add(id);
    }

    // 5. Bài mở bằng heading là thừa: `intro` đã là phần mở rồi.
    if (post.body[0]?.type === "heading") {
      fail("khối đầu tiên không nên là heading — intro đã mở bài", ["body", 0]);
    }

    // 6. Phải có bằng chứng. Đây là điều kiện tồn tại của cả khu: một bài toàn
    //    văn xuôi thì không hơn gì bài của đối thủ, và không đáng để publish.
    if (!post.body.some((b) => EVIDENCE_BLOCKS.includes(b.type))) {
      fail(
        `thân bài không có khối bằng chứng nào (${EVIDENCE_BLOCKS.join(", ")}) — ` +
          `bài không chứng minh được điều nó nói thì không khác gì đối thủ`,
        ["body"],
      );
    }

    // 7. templateRefs phải được RENDER trong thân bài, không chỉ khai ở metadata.
    //    Link nằm trong bài mới là link Google tính trọng số; link ở chân trang
    //    là chuyện khác.
    const rendered = new Set(
      post.body
        .filter((b) => b.type === "templateRef" || b.type === "sheet")
        .map((b) => (b.type === "templateRef" ? b.slug : b.templateSlug)),
    );
    for (const slug of post.templateRefs) {
      if (!rendered.has(slug)) {
        fail(
          `templateRefs khai "${slug}" nhưng thân bài không có khối templateRef ` +
            `hay sheet nào trỏ tới nó — khai mà không render là link ma`,
          ["templateRefs"],
        );
      }
    }

    // 8. Bài sửa lỗi phải nêu đúng mã lỗi nó đang nói tới.
    if (post.postType === "sua-loi" && !post.body.some((b) => b.type === "errorCase")) {
      fail('postType "sua-loi" nhưng thân bài không có khối errorCase', ["body"]);
    }
  });

export type PostSpec = z.infer<typeof postSchema>;

export type PostNavRef = { slug: string; href: string; h1: string; order: number };

export type Post = PostSpec & {
  pillar: PillarSlug;
  href: string;
  pillarName: string;
  ctaTarget: CtaTarget;
  wordCount: number;
  toc: { id: string; text: string }[];
  prev: PostNavRef | null;
  next: PostNavRef | null;
  /** "Bài 4/15" — index là 1-based để hiển thị thẳng. */
  position: { index: number; total: number };
};

/**
 * Dữ liệu đủ cho một thẻ bài, không hơn.
 *
 * Tồn tại vì đúng lý do toCardData tồn tại (lib/templates.ts:185-197): trang
 * cụm dựng 15 thẻ, và truyền cả `body` vào đó là nhét 15 mảng khối nhiều KB
 * vào HTML để rồi không dùng tới.
 */
export type PostCardData = {
  slug: string;
  href: string;
  h1: string;
  metaDesc: string;
  pillarName: string;
  difficulty: PostSpec["difficulty"];
  updatedAt: string;
  order: number;
  /** Mã lỗi rút từ các khối errorCase, hiện trên thẻ bằng phương ngữ bảng tính. */
  errorTags: string[];
};

export function toPostCardData(post: Post): PostCardData {
  return {
    slug: post.slug,
    href: post.href,
    h1: post.h1,
    metaDesc: post.metaDesc,
    pillarName: post.pillarName,
    difficulty: post.difficulty,
    updatedAt: post.updatedAt,
    order: post.order,
    // Chỉ mã lỗi thật lên thẻ. Triệu chứng viết bằng chữ vẫn hiện trong bài,
    // nhưng làm nhãn thì nó dài và không giúp người đọc quét nhanh.
    errorTags: [
      ...new Set(
        post.body
          .filter((b): b is Extract<Block, { type: "errorCase" }> => b.type === "errorCase")
          .map((b) => b.error)
          .filter(isErrorCode),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// Bài tập
// ---------------------------------------------------------------------------

/**
 * Trang bài tập — một trang cho mỗi bài lý thuyết đã có.
 *
 * RỦI RO CỦA LỚP NÀY, và cách chặn: nó rất dễ trở thành bản sao thứ hai của
 * bài lý thuyết, hai trang cùng site cùng nhắm một truy vấn. Ba thứ giữ nó
 * tách bạch:
 *
 *   1. `primaryKeyword` BẮT BUỘC bắt đầu bằng "bài tập" — nhóm từ khóa riêng,
 *      mà đối thủ có tới 22 slug nên nhu cầu là thật.
 *   2. Nó đi qua ĐÚNG tường lửa từ khóa của bài viết (lib/knowledge.ts), nên
 *      trùng keyword là gãy build chứ không phải chuyện tự giác.
 *   3. Nội dung khác hẳn về bản chất: đề bài, dữ liệu khởi đầu, và lời giải
 *      từng bước. Không có thân bài giải thích — phần đó là việc của bài lý
 *      thuyết, và trang này link sang.
 *
 * Cổng chống mỏng: tối thiểu 2 yêu cầu và 2 bước lời giải. Bài lý thuyết chưa
 * có bài tập thì KHÔNG có trang — hub liệt kê đúng số trang đang có, không có
 * ô "sắp ra mắt".
 */
export const exerciseSchema = z.object({
  slug: z.string().regex(SLUG),
  order: z.number().int().positive(),

  h1: z.string().min(1),
  metaTitle: z.string().min(1).max(60),
  metaDesc: z.string().min(120).max(165),
  primaryKeyword: z.string().min(1),

  /** Bài lý thuyết tương ứng. Loader kiểm nó tồn tại — link hai chiều. */
  postSlug: z.string().regex(SLUG),

  /** Đề bài. */
  brief: z.string().min(120),

  /** Dữ liệu khởi đầu, luôn cho chép được — bài tập không có dữ liệu thì không làm được. */
  dataset: z.object({
    caption: z.string().min(1),
    headers: z.array(z.string().min(1)).min(2).max(6),
    rows: z.array(z.array(z.string())).min(2).max(12),
  }),

  tasks: z
    .array(z.object({ ask: z.string().min(20), hint: z.string().optional() }))
    .min(2)
    .max(5),

  /** Khung thử để làm ngay trên trang, cùng khối sandbox của bài viết. */
  sandbox: z.object({
    title: z.string().min(1),
    grid: z
      .array(z.array(z.union([z.number(), z.string(), z.boolean(), z.null()])))
      .min(1)
      .max(12),
    prompt: z.string().min(20),
    answer: z.string().startsWith("="),
    expected: z.string(),
    hint: z.string().optional(),
  }),

  solution: z
    .array(
      z.object({
        formula: z.string().startsWith("="),
        why: z.string().min(40),
      }),
    )
    .min(2),

  updatedAt: z.iso.date(),
});

export type ExerciseSpec = z.infer<typeof exerciseSchema>;

export type Exercise = ExerciseSpec & {
  href: string;
  /** Tiêu đề bài lý thuyết, để hiện link ngược mà không phải tra lại. */
  postH1: string;
  postHref: string;
};

// ---------------------------------------------------------------------------
// Bảng tra phím tắt
// ---------------------------------------------------------------------------

/**
 * Trang tra cứu, không phải bài viết — nên nó có schema riêng chứ không cố
 * nhét vào postSchema. Nó không có thân bài, không có quiz, không thuộc cụm
 * nào, và không đi qua tường lửa từ khóa vì nó chẳng nhắm từ khóa nào của hai
 * khu kia.
 *
 * Về mặt chủ đề, chỗ đúng của nó là cụm "Excel cơ bản" — cụm chưa mở. Nên tạm
 * thời nó đứng thẳng dưới /kien-thuc-excel, và khi cụm đó mở thì cân nhắc
 * chuyển vào kèm 301.
 */
export const shortcutsSchema = z.object({
  updatedAt: z.iso.date(),
  shortcuts: z
    .array(
      z.object({
        win: z.string().min(1),
        /** "—" khi macOS không có tổ hợp tương đương, chứ không bỏ trống. */
        mac: z.string().min(1),
        action: z.string().min(10),
        group: z.string().min(1),
      }),
    )
    .min(20),
});

export type ShortcutsSpec = z.infer<typeof shortcutsSchema>;
export type Shortcut = ShortcutsSpec["shortcuts"][number];

export const DIFFICULTY_LABEL: Record<PostSpec["difficulty"], string> = {
  "co-ban": "Cơ bản",
  "trung-cap": "Trung cấp",
  "nang-cao": "Nâng cao",
};

export const POST_TYPE_LABEL: Record<PostSpec["postType"], string> = {
  "sua-loi": "Sửa lỗi",
  "quy-trinh": "Quy trình",
  "khai-niem": "Khái niệm",
};
