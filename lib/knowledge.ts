import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
// Import tương đối kèm .ts để scripts/*.mts chạy trực tiếp được đúng loader
// này dưới --experimental-strip-types, giống lib/templates.ts và lib/videos.ts.
import {
  PILLARS,
  PILLAR_SLUGS,
  type PillarSlug,
} from "./site.ts";
import {
  exerciseSchema,
  normalizeKeyword,
  postSchema,
  shortcutsSchema,
  tocFromBody,
  wordCount,
  type Block,
  type Exercise,
  type Post,
  type PostCardData,
  type PostNavRef,
  type ShortcutsSpec,
} from "./knowledge-schema.ts";
import { toPostCardData } from "./knowledge-schema.ts";
import { getAllTemplates } from "./templates.ts";
import { getAllFunctions } from "./functions.ts";
import { getAllVideos } from "./videos.ts";
import {
  ERROR_CODES,
  SUPPORTED_FUNCTION_NAMES,
  evaluateFormula,
  formatValue,
} from "./formula-eval.ts";

/**
 * Khu kiến thức: đọc data/knowledge/, kiểm, và dựng chỉ mục hai chiều.
 *
 * Đây là corpus đầu tiên của repo PHỤ THUỘC cả ba corpus còn lại (template,
 * hàm, video). Chiều phụ thuộc chỉ đi một hướng — templates.ts, functions.ts
 * và videos.ts không bao giờ import ngược lại file này — nên không có vòng.
 * Trang template và trang hàm lấy bài liên quan qua getPostsForTemplate() /
 * getPostsForFunction() ở dưới, tức là chúng import file này chứ không phải
 * file này import chúng.
 *
 * Mọi vi phạm ở đây đều THROW. Cùng lý do đã ghi ở lib/templates.ts:89-95:
 * nội dung phần lớn sinh bằng AI nên sai sót là chuyện bình thường, phải chặn
 * ở build chứ không để lọt lên production.
 */

const DIR = join(process.cwd(), "data", "knowledge");

/**
 * Số bài tối thiểu để một cụm được mở trang hub.
 *
 * Tám vì cùng lý do MIN_TEMPLATES_PER_CATEGORY là năm (lib/systems.ts:256-263):
 * một trang cụm có ba bài là ba dòng chữ dưới một cái h1 — đúng loại trang mỏng
 * mà cả site này viết ra để tránh. Ngưỡng cao hơn nhóm template vì bài viết rẻ
 * hơn file Excel: viết bài thứ tám dễ hơn dựng template thứ năm.
 */
export const MIN_POSTS_PER_PILLAR = 8;

/** Bài thứ tư trên một trang là nhồi, không phải phong phú. Gương videos.ts:48. */
export const MAX_POSTS_PER_PAGE = 3;

// ---------------------------------------------------------------------------
// Tường lửa từ khóa
// ---------------------------------------------------------------------------

/**
 * Chặn bài viết lấn sân hai khu kia.
 *
 * Tầng A (hình dạng schema, xem lib/knowledge-schema.ts) đã làm cho việc CHÉP
 * nội dung của /ham-excel hay /mau-excel trở nên bất khả biểu diễn. Nhưng nó
 * không chặn được một bài hợp lệ về hình dạng lại đi nhắm đúng từ khóa mà một
 * trang khác đã nhắm — hai trang của cùng một site cạnh tranh nhau trên cùng
 * một truy vấn thì Google chọn hộ, và thường chọn sai.
 *
 * Đây là tầng B. Nó chạy trong loader chứ không trong schema vì nó cần nhìn
 * thấy cả ba corpus cùng lúc, mà schema thì phải giữ được tính thuần để client
 * import.
 */
function assertKeywordFirewall(
  posts: { slug: string; primaryKeyword: string; h1: string; metaTitle: string }[],
): void {
  const templates = getAllTemplates();
  const functions = getAllFunctions();

  const templateSlugs = new Set(templates.map((t) => t.slug));
  const functionSlugs = new Set(functions.map((f) => f.slug));

  // Tên hàm dùng để dò token: "hàm SUM trong excel" phải bị chặn, nhưng
  // "không tính tổng được" thì không — nên phải so theo TOKEN đứng riêng chứ
  // không phải so bằng includes().
  const functionTokens = new Set(functions.map((f) => f.name.toLowerCase()));

  /**
   * Bỏ tiền tố chỉ intent tải để so trùng ở tầng sâu hơn.
   *
   * "mẫu excel tính lương nhân viên" và "file excel tính lương nhân viên" là
   * cùng một truy vấn với cùng một ý định, chỉ khác chữ đầu. Nếu chỉ so chuỗi
   * đã chuẩn hoá thì một bài nhắm bản "file …" sẽ lọt qua trong khi nó cạnh
   * tranh trực tiếp với một trang template.
   *
   * Đây là cách thay cho luật cũ "chặn mọi từ khóa bắt đầu bằng file" — luật
   * đó bắt nhầm ngay bài đầu tiên dùng tới nó ("file excel nặng và chậm"), vì
   * chữ "file" đứng đầu KHÔNG đủ để kết luận intent. Cái quyết định là phần
   * còn lại: sau khi bỏ tiền tố, "excel tinh luong nhan vien" trùng một
   * template có thật, còn "excel nang va cham" thì không trùng gì cả.
   */
  const dropIntentPrefix = (kw: string) =>
    normalizeKeyword(kw).replace(/^(mau|file|tai|download) /, "");

  /** Mọi từ khóa đã bị chiếm, ánh xạ về nơi chiếm nó để báo lỗi cho rõ. */
  const taken = new Map<string, string>();
  /** Cùng như trên nhưng đã bỏ tiền tố intent, để bắt biến thể "file …". */
  const takenCore = new Map<string, string>();
  for (const t of templates) {
    const where = `template /mau-excel/${t.category}/${t.slug}`;
    taken.set(normalizeKeyword(t.primaryKeyword), where);
    takenCore.set(dropIntentPrefix(t.primaryKeyword), where);
  }
  for (const f of functions) {
    taken.set(normalizeKeyword(`hàm ${f.name}`), `trang hàm /ham-excel/${f.slug}`);
    taken.set(
      normalizeKeyword(`hàm ${f.name} trong excel`),
      `trang hàm /ham-excel/${f.slug}`,
    );
  }

  for (const post of posts) {
    const where = `data/knowledge/**/${post.slug}.json`;
    const kw = normalizeKeyword(post.primaryKeyword);

    // 1. Từ khóa dạng "mẫu excel ...", "tải ...", "download ...": intent tải
    //    file, thuộc /mau-excel. KHÔNG chặn tiền tố "file" ở đây — xem
    //    dropIntentPrefix bên trên; "file excel nặng và chậm" là intent sửa
    //    lỗi chứ không phải intent tải, và luật cũ bắt nhầm nó.
    if (/^(mau|tai|download) /.test(kw)) {
      throw new Error(
        `${where}: primaryKeyword "${post.primaryKeyword}" là intent tải file — chỗ của nó là /mau-excel, không phải khu kiến thức.`,
      );
    }

    // 2. Từ khóa dạng "hàm X ...": intent tra hàm, thuộc /ham-excel.
    if (/\bham [a-z0-9.]+/.test(kw)) {
      throw new Error(
        `${where}: primaryKeyword "${post.primaryKeyword}" là intent tra hàm — chỗ của nó là /ham-excel, không phải khu kiến thức.`,
      );
    }

    /*
     * 3. Chứa tên một hàm đã có trang, đứng thành token riêng.
     *
     * Phải bóc mã lỗi ra TRƯỚC khi tách token. normalizeKeyword() xoá mọi ký
     * tự không phải chữ số, nên "#N/A" biến thành "n a" — và "n" trùng đúng
     * tên hàm N đang có trang. Không bóc thì bài về lỗi #N/A bị chặn oan, dù
     * nó chẳng liên quan gì tới hàm N.
     *
     * Bóc theo danh sách mã lỗi đóng của lib/formula-eval.ts chứ không nới
     * luật thành "bỏ qua token ngắn": nới như vậy sẽ để lọt cả IF và OR, hai
     * tên hàm ngắn mà một từ khóa hoàn toàn có thể nhắm thật.
     */
    let kwForTokens = post.primaryKeyword;
    for (const code of ERROR_CODES) {
      kwForTokens = kwForTokens.split(code).join(" ");
    }
    for (const token of normalizeKeyword(kwForTokens).split(" ")) {
      if (functionTokens.has(token)) {
        throw new Error(
          `${where}: primaryKeyword "${post.primaryKeyword}" chứa tên hàm "${token.toUpperCase()}" vốn đã có trang riêng tại /ham-excel/${token}. ` +
            `Bài viết trỏ SANG trang hàm bằng khối functionRef, không nhắm lại từ khóa của nó.`,
        );
      }
    }

    // 4. Không trùng với bất kỳ từ khóa nào đã bị chiếm — kiểm cả bản nguyên
    //    văn lẫn bản đã bỏ tiền tố intent, để "file excel tính lương nhân
    //    viên" không lọt qua dù "mẫu excel tính lương nhân viên" mới là bản
    //    template đang khai.
    const core = dropIntentPrefix(post.primaryKeyword);
    const owner = taken.get(kw) ?? takenCore.get(core);
    if (owner) {
      throw new Error(
        `${where}: primaryKeyword "${post.primaryKeyword}" đã được ${owner} nhắm. ` +
          `Hai trang cùng site cạnh tranh một truy vấn thì Google chọn hộ, và thường chọn sai.`,
      );
    }
    taken.set(kw, `bài ${post.slug}`);
    takenCore.set(core, `bài ${post.slug}`);

    // 5. Slug không được đụng vào không gian tên của hai khu kia.
    if (templateSlugs.has(post.slug)) {
      throw new Error(`${where}: slug trùng slug của một template.`);
    }
    if (functionSlugs.has(post.slug)) {
      throw new Error(`${where}: slug trùng slug của một trang hàm.`);
    }
    if (/^(mau|ham|tai)-/.test(post.slug)) {
      throw new Error(
        `${where}: slug bắt đầu bằng "mau-"/"ham-"/"tai-" — tiền tố đó thuộc hai khu kia.`,
      );
    }

    // 6. Tiêu đề cũng không được giả dạng trang tải file hay trang hàm.
    for (const [field, value] of [
      ["h1", post.h1],
      ["metaTitle", post.metaTitle],
    ] as const) {
      if (/^(Mẫu|Tải|Hàm)\b/.test(value)) {
        throw new Error(
          `${where}: ${field} mở đầu bằng "Mẫu"/"Tải"/"Hàm" — nghe như trang của hai khu kia.`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Kiểm khối thân bài
// ---------------------------------------------------------------------------

/**
 * Rút tên hàm khỏi một công thức.
 *
 * Dùng ĐÚNG regex của lib/functions.ts:123 chứ không viết lại một biến thể:
 * hai nơi rút tên hàm bằng hai luật khác nhau sẽ có ngày cho ra hai danh sách
 * khác nhau, và luật "công thức phải trỏ ra /ham-excel" sẽ thủng đúng chỗ đó.
 */
function functionNamesIn(formula: string): Set<string> {
  const names = new Set<string>();
  for (const [, name] of formula.matchAll(/\b([A-Z][A-Z0-9.]*)\s*\(/g)) {
    names.add(name);
  }
  return names;
}

function assertBlocksResolve(
  slug: string,
  body: Block[],
  functionRefs: string[],
): void {
  const where = `data/knowledge/**/${slug}.json`;
  const templates = getAllTemplates();
  const templateBySlug = new Map(templates.map((t) => [t.slug, t]));
  const functionSlugs = new Set(getAllFunctions().map((f) => f.slug));
  const videoIds = new Set(getAllVideos().map((v) => v.id));
  const declaredFns = new Set(functionRefs);

  body.forEach((block, i) => {
    const at = `${where} khối #${i + 1} (${block.type})`;

    switch (block.type) {
      case "sheet": {
        const t = templateBySlug.get(block.templateSlug);
        if (!t) {
          throw new Error(`${at}: templateSlug "${block.templateSlug}" không có template nào dùng.`);
        }
        if (block.sheetIndex >= t.sheets.length) {
          throw new Error(
            `${at}: sheetIndex ${block.sheetIndex} vượt quá số sheet của "${t.slug}" (${t.sheets.length}).`,
          );
        }
        break;
      }

      case "templateRef": {
        if (!templateBySlug.has(block.slug)) {
          throw new Error(`${at}: trỏ tới template "${block.slug}" không tồn tại.`);
        }
        break;
      }

      case "functionRef": {
        if (!functionSlugs.has(block.slug)) {
          throw new Error(
            `${at}: trỏ tới hàm "${block.slug}" chưa có trang. Một hàm chỉ mở trang khi có template dùng thật (lib/functions.ts) — ` +
              `muốn nói về hàm này thì phải dựng một template dùng nó trước.`,
          );
        }
        if (!declaredFns.has(block.slug)) {
          throw new Error(`${at}: khối functionRef "${block.slug}" chưa được khai trong functionRefs.`);
        }
        break;
      }

      case "video": {
        if (!videoIds.has(block.tiktokId)) {
          throw new Error(`${at}: không có video nào mang id "${block.tiktokId}".`);
        }
        break;
      }

      case "image": {
        const path = join(process.cwd(), "public", block.src);
        if (!existsSync(path)) {
          throw new Error(`${at}: ảnh "${block.src}" không có trong public/.`);
        }
        break;
      }

      case "table": {
        block.rows.forEach((row, r) => {
          if (row.length !== block.headers.length) {
            throw new Error(
              `${at}: dòng ${r + 1} có ${row.length} ô nhưng bảng khai ${block.headers.length} cột.`,
            );
          }
        });
        break;
      }

      case "formula": {
        // TẦNG C của luật chống ăn thịt: mọi hàm ĐÃ CÓ TRANG mà bài trích dẫn
        // đều phải được khai, để câu văn quanh nó trỏ sang /ham-excel thay vì
        // giải thích lại cú pháp ở đây.
        for (const name of functionNamesIn(block.formula)) {
          const fnSlug = name.toLowerCase();
          if (functionSlugs.has(fnSlug) && !declaredFns.has(fnSlug)) {
            throw new Error(
              `${at}: công thức dùng ${name} — hàm này đã có trang tại /ham-excel/${fnSlug} nhưng bài không khai trong functionRefs. ` +
                `Thêm "${fnSlug}" để câu này trỏ sang đó thay vì giải thích lại.`,
            );
          }
        }
        break;
      }

      case "sandbox": {
        // Đáp án của sandbox phải chạy được bằng đúng bộ tính mà người đọc sẽ
        // dùng. Không kiểm ở đây thì một bài có thể publish với đáp án sai, và
        // người đọc gõ đúng vẫn bị báo sai.
        const got = formatValue(evaluateFormula(block.answer, block.grid));
        if (got !== block.expected) {
          throw new Error(
            `${at}: đáp án ${block.answer} cho ra "${got}" nhưng expected khai "${block.expected}".`,
          );
        }
        for (const name of functionNamesIn(block.answer)) {
          if (!SUPPORTED_FUNCTION_NAMES.includes(name)) {
            throw new Error(
              `${at}: đáp án dùng ${name}, hàm mà lib/formula-eval.ts chưa chạy được.`,
            );
          }
        }
        break;
      }
    }
  });
}

/**
 * Bộ tính của sandbox phải phủ hết tập hàm đang có trang.
 *
 * Chiều kiểm này cố ý đảo ngược so với trực giác. lib/formula-eval.ts không
 * import được FUNCTION_INFO (nó phải chạy được ở client, mà functions.ts kéo
 * theo node:fs), nên nó tự khai danh sách hàm nó chạy được. Hệ quả: mở một
 * trang hàm mới mà quên cài hàm đó vào evaluator thì GÃY BUILD ngay tại đây,
 * thay vì để sandbox lặng lẽ trả #NAME? cho một hàm site vừa dạy xong.
 */
function assertEvaluatorCoversFunctionPages(): void {
  const missing = getAllFunctions()
    .map((f) => f.name)
    .filter((name) => !SUPPORTED_FUNCTION_NAMES.includes(name));

  if (missing.length > 0) {
    throw new Error(
      `lib/formula-eval.ts chưa chạy được ${missing.join(", ")} — nhưng các hàm này đã có trang tại /ham-excel.\n` +
        `  Sandbox sẽ trả #NAME? cho đúng hàm mà site vừa dạy. Cài chúng vào SUPPORTED_FUNCTIONS trước khi build.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Nạp
// ---------------------------------------------------------------------------

function loadAll(): Post[] {
  assertEvaluatorCoversFunctionPages();

  const specs: (z.infer<typeof postSchema> & { pillar: PillarSlug })[] = [];

  for (const pillar of PILLAR_SLUGS) {
    const dir = join(DIR, pillar);
    if (!existsSync(dir)) continue;

    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const path = join(dir, file);

      const parsed = postSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
      if (!parsed.success) {
        throw new Error(`Bài không hợp lệ: ${path}\n${z.prettifyError(parsed.error)}`);
      }

      const spec = parsed.data;
      if (spec.pillar !== pillar) {
        throw new Error(
          `Bài không hợp lệ: ${path}\n  pillar "${spec.pillar}" không khớp thư mục "${pillar}"`,
        );
      }
      if (`${spec.slug}.json` !== file) {
        throw new Error(`Bài không hợp lệ: ${path}\n  tên file phải là "${spec.slug}.json"`);
      }

      specs.push({ ...spec, pillar });
    }
  }

  // Slug duy nhất trên toàn khu, không chỉ trong một cụm — URL có cụm ở giữa
  // nhưng người ta vẫn hay nhắc bài bằng slug trần.
  const bySlug = new Map<string, (typeof specs)[number]>();
  for (const s of specs) {
    if (bySlug.has(s.slug)) {
      throw new Error(`Slug "${s.slug}" xuất hiện ở hai cụm khác nhau.`);
    }
    bySlug.set(s.slug, s);
  }

  assertKeywordFirewall(specs);
  for (const s of specs) assertBlocksResolve(s.slug, s.body, s.functionRefs);

  // relatedSlugs phải trỏ tới bài có thật; link gãy lan ra toàn site.
  for (const s of specs) {
    for (const related of s.relatedSlugs) {
      if (related === s.slug) {
        throw new Error(`${s.slug}: relatedSlugs không được trỏ về chính nó`);
      }
      if (!bySlug.has(related)) {
        throw new Error(
          `${s.slug}: relatedSlugs trỏ tới "${related}" nhưng không có bài nào dùng slug đó`,
        );
      }
    }
  }

  // `order` phải liên tục 1..N trong từng cụm. Một khoảng trống nghĩa là có
  // bài đã bị xóa mà chuỗi chưa đánh số lại, và Bài trước / Bài sau sẽ nhảy cóc.
  const posts: Post[] = [];
  for (const pillar of PILLAR_SLUGS) {
    const inPillar = specs
      .filter((s) => s.pillar === pillar)
      .sort((a, b) => a.order - b.order);
    if (inPillar.length === 0) continue;

    inPillar.forEach((s, i) => {
      if (s.order !== i + 1) {
        const seen = inPillar.map((p) => p.order).join(", ");
        throw new Error(
          `Cụm "${pillar}": order phải liên tục 1..${inPillar.length} nhưng đang là [${seen}].\n` +
            `  Chuỗi bài đứt quãng thì điều hướng Bài trước / Bài sau sẽ nhảy cóc.`,
        );
      }
    });

    const navRef = (s: (typeof inPillar)[number]): PostNavRef => ({
      slug: s.slug,
      href: `/kien-thuc-excel/${pillar}/${s.slug}`,
      h1: s.h1,
      order: s.order,
    });

    inPillar.forEach((s, i) => {
      posts.push({
        ...s,
        pillar,
        href: `/kien-thuc-excel/${pillar}/${s.slug}`,
        pillarName: PILLARS[pillar].name,
        ctaTarget: s.ctaTarget ?? PILLARS[pillar].defaultCta,
        wordCount: wordCount(s.body),
        toc: tocFromBody(s.body),
        prev: i > 0 ? navRef(inPillar[i - 1]) : null,
        next: i < inPillar.length - 1 ? navRef(inPillar[i + 1]) : null,
        position: { index: i + 1, total: inPillar.length },
      });
    });
  }

  return posts;
}

let cache: Post[] | undefined;

export function getAllPosts(): Post[] {
  cache ??= loadAll();
  return cache;
}

export function getPostsByPillar(pillar: string): Post[] {
  return getAllPosts()
    .filter((p) => p.pillar === pillar)
    .sort((a, b) => a.order - b.order);
}

export function getPost(pillar: string, slug: string): Post | undefined {
  return getAllPosts().find((p) => p.pillar === pillar && p.slug === slug);
}

/**
 * Cụm đã đủ ngưỡng mở trang hub.
 *
 * Cụm dở dang (có bài nhưng chưa đủ ngưỡng) thì FAIL BUILD chứ không lặng lẽ
 * bị lọc ra. Lý do đã viết đầy đủ ở lib/systems.ts:264-279 và nguyên vẹn ở
 * đây: lọc im lặng vẫn dựng các trang bài, chúng vẫn nằm trong sitemap, mà
 * breadcrumb của chúng trỏ về một hub 404 — trang mồ côi thật sự, đúng thứ cả
 * site đang cố tránh. Hai lối ra đều nằm trong tay người viết: viết cho đủ
 * ngưỡng, hoặc bỏ thư mục cụm đi.
 */
export function getPopulatedPillars(): PillarSlug[] {
  const posts = getAllPosts();

  return PILLAR_SLUGS.filter((pillar) => {
    const count = posts.filter((p) => p.pillar === pillar).length;
    if (count === 0) return false;
    if (count < MIN_POSTS_PER_PILLAR) {
      throw new Error(
        `Cụm "${pillar}" mới có ${count} bài, cần ít nhất ${MIN_POSTS_PER_PILLAR} mới mở được trang cụm.\n` +
          `  Viết thêm ${MIN_POSTS_PER_PILLAR - count} bài, hoặc bỏ thư mục data/knowledge/${pillar}/ đi.\n` +
          `  Đừng lọc cụm này ra: trang bài vẫn dựng, còn breadcrumb của chúng sẽ trỏ về một hub 404.`,
      );
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Chỉ mục ngược — chiều link từ hai khu kia trở về đây
// ---------------------------------------------------------------------------

/**
 * Bài nhắc tới một template.
 *
 * Quan hệ chỉ được khai MỘT CHIỀU trong spec bài (templateRefs), chiều ngược
 * lại tự sinh ở đây. Nhờ vậy thêm một bài là tự có link từ trang template về
 * nó, không ai phải nhớ đi sửa 37 file template.
 */
export function getPostsForTemplate(slug: string): PostCardData[] {
  return getAllPosts()
    .filter((p) => p.templateRefs.includes(slug))
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_POSTS_PER_PAGE)
    .map(toPostCardData);
}

export function getPostsForFunction(fnSlug: string): PostCardData[] {
  return getAllPosts()
    .filter((p) => p.functionRefs.includes(fnSlug))
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_POSTS_PER_PAGE)
    .map(toPostCardData);
}

/**
 * Bài liên quan, tự bù bằng bài cùng cụm khi spec khai thiếu.
 *
 * Sao chép cách getRelatedTemplates() làm (lib/templates.ts:206-222) và vì
 * cùng một lý do: điều kiện "không có trang mồ côi" phải được bảo đảm ở tầng
 * code, không phụ thuộc người viết nội dung có nhớ khai hay không.
 */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const all = getAllPosts();
  const picked = post.relatedSlugs
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is Post => Boolean(p));

  if (picked.length >= limit) return picked.slice(0, limit);

  const taken = new Set([post.slug, ...picked.map((p) => p.slug)]);
  const filler = all
    .filter((p) => p.pillar === post.pillar && !taken.has(p.slug))
    // Bài đứng gần trong chuỗi thì liên quan hơn bài đứng xa.
    .sort(
      (a, b) =>
        Math.abs(a.order - post.order) - Math.abs(b.order - post.order),
    );

  return [...picked, ...filler].slice(0, limit);
}

export { toPostCardData };
export type { Post, PostCardData };

// ---------------------------------------------------------------------------
// Bài tập
// ---------------------------------------------------------------------------

const EXERCISE_DIR = join(DIR, "bai-tap");

function loadExercises(): Exercise[] {
  if (!existsSync(EXERCISE_DIR)) return [];

  const posts = getAllPosts();
  const postBySlug = new Map(posts.map((p) => [p.slug, p]));
  const out: Exercise[] = [];

  for (const file of readdirSync(EXERCISE_DIR)) {
    if (!file.endsWith(".json")) continue;
    const path = join(EXERCISE_DIR, file);

    const parsed = exerciseSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
    if (!parsed.success) {
      throw new Error(`Bài tập không hợp lệ: ${path}\n${z.prettifyError(parsed.error)}`);
    }

    const spec = parsed.data;
    if (`${spec.slug}.json` !== file) {
      throw new Error(`Bài tập không hợp lệ: ${path}\n  tên file phải là "${spec.slug}.json"`);
    }

    const post = postBySlug.get(spec.postSlug);
    if (!post) {
      throw new Error(
        `Bài tập không hợp lệ: ${path}\n  postSlug "${spec.postSlug}" không trỏ tới bài lý thuyết nào.`,
      );
    }

    // Cùng luật với khối sandbox của bài viết: đáp án phải chạy được bằng đúng
    // bộ tính mà người đọc sẽ dùng. Không kiểm thì một trang bài tập có thể
    // publish với đáp án sai, và người làm đúng vẫn bị báo sai.
    const got = formatValue(evaluateFormula(spec.sandbox.answer, spec.sandbox.grid));
    if (got !== spec.sandbox.expected) {
      throw new Error(
        `Bài tập không hợp lệ: ${path}\n  sandbox: đáp án ${spec.sandbox.answer} cho ra "${got}" nhưng expected khai "${spec.sandbox.expected}".`,
      );
    }

    out.push({
      ...spec,
      href: `/kien-thuc-excel/bai-tap/${spec.slug}`,
      postH1: post.h1,
      postHref: post.href,
    });
  }

  // Một bài lý thuyết chỉ có tối đa một trang bài tập. Hai trang bài tập cho
  // cùng một bài là hai trang cạnh tranh nhau trên cùng nhóm từ khóa.
  const seen = new Set<string>();
  for (const e of out) {
    if (seen.has(e.postSlug)) {
      throw new Error(`Có hai bài tập cùng trỏ tới bài "${e.postSlug}".`);
    }
    seen.add(e.postSlug);
  }

  // Từ khóa phải thuộc nhóm "bài tập …" — đây là thứ tách nó khỏi bài lý
  // thuyết về mặt intent, và nó phải được ép chứ không phải nhắc nhở.
  for (const e of out) {
    if (!normalizeKeyword(e.primaryKeyword).startsWith("bai tap")) {
      throw new Error(
        `Bài tập "${e.slug}": primaryKeyword "${e.primaryKeyword}" phải bắt đầu bằng "bài tập". ` +
          `Không có nó, trang này nhắm lại đúng truy vấn của bài lý thuyết và hai trang cạnh tranh nhau.`,
      );
    }
  }

  /*
   * Cho bài tập đi qua ĐÚNG tường lửa của bài viết, và cho nó đi CÙNG danh
   * sách bài lý thuyết chứ không đi riêng.
   *
   * Đi riêng thì `taken` được dựng lại từ đầu và va chạm giữa một bài tập với
   * một bài lý thuyết sẽ không ai thấy — mà đó chính là va chạm nguy hiểm
   * nhất của lớp này. Chi phí là tường lửa chạy hai lượt trên tập bài viết;
   * nó thuần kiểm tra nên chạy lại không đổi gì.
   */
  assertKeywordFirewall([
    ...posts.map((p) => ({
      slug: p.slug,
      primaryKeyword: p.primaryKeyword,
      h1: p.h1,
      metaTitle: p.metaTitle,
    })),
    ...out.map((e) => ({
      slug: e.slug,
      primaryKeyword: e.primaryKeyword,
      h1: e.h1,
      metaTitle: e.metaTitle,
    })),
  ]);

  return out.sort((a, b) => a.order - b.order);
}

let exerciseCache: Exercise[] | undefined;

export function getAllExercises(): Exercise[] {
  exerciseCache ??= loadExercises();
  return exerciseCache;
}

export function getExercise(slug: string): Exercise | undefined {
  return getAllExercises().find((e) => e.slug === slug);
}

/** Bài tập của một bài lý thuyết, nếu đã viết. Dùng cho dải link xuôi. */
export function getExerciseForPost(postSlug: string): Exercise | undefined {
  return getAllExercises().find((e) => e.postSlug === postSlug);
}

// ---------------------------------------------------------------------------
// Bảng tra phím tắt
// ---------------------------------------------------------------------------

let shortcutsCache: ShortcutsSpec | undefined;

/**
 * Bảng tra phím tắt. Một file, không thuộc cụm nào.
 *
 * Trả `undefined` khi chưa có file, để route tự 404 thay vì gãy build — khác
 * với bài viết, trang này không có ràng buộc "phải tồn tại" nào cả.
 */
export function getShortcuts(): ShortcutsSpec | undefined {
  if (shortcutsCache) return shortcutsCache;

  const path = join(DIR, "phim-tat.json");
  if (!existsSync(path)) return undefined;

  const parsed = shortcutsSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) {
    throw new Error(`Bảng phím tắt không hợp lệ: ${path}\n${z.prettifyError(parsed.error)}`);
  }

  shortcutsCache = parsed.data;
  return shortcutsCache;
}

/** Nhóm phím tắt theo thứ tự xuất hiện đầu tiên trong file, không sắp lại. */
export function getShortcutGroups(): string[] {
  const data = getShortcuts();
  if (!data) return [];
  return [...new Set(data.shortcuts.map((s) => s.group))];
}
