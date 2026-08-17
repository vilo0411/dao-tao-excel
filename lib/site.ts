/**
 * Cấu hình toàn site + quy tắc phân luồng CTA sang HVS.
 *
 * Ta không có quyền gắn analytics trên taichinhso.hvsvn.com, nên mọi link ra
 * ngoài phải gắn UTM để bên HVS còn đối chiếu được nguồn traffic.
 */

/**
 * Domain thật. Bản trên GitHub Pages ghi đè bằng NEXT_PUBLIC_SITE_URL
 * để canonical và sitemap không trỏ về một domain chưa tồn tại.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://excel.nguyenvietloc.com";

/**
 * Tiền tố đường dẫn khi site nằm trong thư mục con (GitHub Pages dạng
 * user.github.io/ten-repo). Rỗng trên domain thật.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Hai cờ tách rời, đừng gộp lại làm một lần nữa.
 *
 * Chúng từng là cùng một cờ NEXT_PUBLIC_PREVIEW, và vì thế không có cách nào
 * bỏ banner "bản xem thử" mà không kéo theo `output: "export"` — tức là gãy
 * luôn bản GitHub Pages. Chúng trả lời hai câu hỏi khác nhau:
 *
 * - STATIC_EXPORT: trang được xuất tĩnh vào thư mục con hay không. Quyết định
 *   basePath và trailingSlash. Đây là chuyện kỹ thuật của đích deploy.
 * - NOINDEX: bản này có được Google thu thập hay không. Đây là chuyện biên tập.
 *
 * GitHub Pages hiện bật cả hai. Nhưng một bản tĩnh trên domain thật thì chỉ
 * bật cái đầu — và đó chính là trường hợp cờ gộp không diễn tả được.
 */
export const IS_STATIC_EXPORT =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

export const IS_NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";

export const SITE_NAME = "Mẫu Excel";

/**
 * Thêm tiền tố basePath cho đường dẫn tài nguyên tĩnh.
 *
 * next/link và next/image tự xử lý basePath, nhưng thẻ <a href> thô thì không —
 * link tải .xlsx sẽ 404 trên GitHub Pages nếu thiếu hàm này.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** Hai trang đích trên hệ thống HVS. */
export const HVS = {
  /** Landing tư vấn, không lộ giá — rào cản thấp, hợp với traffic lạnh. */
  consult: "https://taichinhso.hvsvn.com/thuc-tap-so/gioi-thieu-excel",
  /**
   * Khóa trả phí 1.500.000đ dành cho nhân sự.
   * Lưu ý: slug viết HOA là bản duy nhất trả 200 — bản chữ thường đang 404,
   * không được "chuẩn hóa" thành chữ thường khi sửa code.
   */
  hrCourse:
    "https://taichinhso.hvsvn.com/thuc-tap-so/EXCEL-UNG-DUNG-CHO-NHAN-SU",
} as const;

export type CtaTarget = keyof typeof HVS;

export const CATEGORIES = {
  "nhan-su": {
    name: "Nhân sự - HR",
    description:
      "Mẫu Excel chấm công, tính lương, theo dõi phép và đánh giá KPI cho bộ phận nhân sự.",
    /** Category duy nhất có khóa trả phí tương ứng → CTA sát nhu cầu nhất. */
    defaultCta: "hrCourse" as CtaTarget,
  },
  "ke-toan": {
    name: "Kế toán - Tài chính",
    description:
      "Mẫu Excel sổ sách, công nợ, dòng tiền và báo cáo tài chính cho kế toán viên.",
    defaultCta: "consult" as CtaTarget,
  },
  "quan-ly-cong-viec": {
    name: "Quản lý công việc",
    description:
      "Mẫu Excel theo dõi tiến độ, kế hoạch và phân công công việc cho dân văn phòng.",
    defaultCta: "consult" as CtaTarget,
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as CategorySlug[];

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORIES;
}

/**
 * Cụm chủ đề của khu /kien-thuc-excel.
 *
 * Đặt cạnh CATEGORIES vì cùng vai trò và cùng lý do phải nằm ở file này:
 * đây là module thuần duy nhất mà cả nửa client (lib/knowledge-schema.ts) lẫn
 * nửa node:fs (lib/knowledge.ts) đều import được, và Zod cần PILLAR_SLUGS để
 * dựng z.enum.
 *
 * Ba khu nội dung của site trả lời ba câu hỏi không giao nhau:
 *   /mau-excel        "cho tôi cái file"
 *   /ham-excel        "hàm này cú pháp gì"
 *   /kien-thuc-excel  "cái này hỏng, sửa sao" · "học theo thứ tự nào"
 * Một bài chỉ được tồn tại nếu nội dung của nó không thuộc hai khu kia. Luật
 * này được ép bằng tường lửa từ khóa trong lib/knowledge.ts, không phải bằng
 * tự giác của người viết.
 *
 * CHỈ khai cụm đã có bài. Khai trước ba cụm rồi lấp dần chính là lỗi mà
 * lib/videos.ts:30-33 đã viết ra để cảnh báo — mở hub trước là tự tạo ra đúng
 * loại trang mỏng mà MIN_POSTS_PER_PILLAR sinh ra để chặn.
 */
export const PILLARS = {
  "loi-excel": {
    name: "Lỗi Excel",
    description:
      "Excel báo lỗi, hiện sai, hoặc không chịu tính — nguyên nhân và cách sửa, kèm file thật để đối chiếu.",
    /** Câu hỏi mọi bài trong cụm phải trả lời. Dùng cho meta và kicker của ảnh OG. */
    question: "Vì sao Excel báo lỗi này và sửa thế nào",
    defaultCta: "consult" as CtaTarget,
  },
  // Giai đoạn 2: "nghiep-vu-theo-vai-tro". Giai đoạn 3: "excel-co-ban".
} as const;

export type PillarSlug = keyof typeof PILLARS;

export const PILLAR_SLUGS = Object.keys(PILLARS) as PillarSlug[];

export function isPillarSlug(value: string): value is PillarSlug {
  return value in PILLARS;
}

/**
 * Ngày khởi chạy site, dùng làm sàn cho `latestUpdate()` khi một nhóm nội
 * dung rỗng (nhánh phòng thủ — thực tế danh sách template không bao giờ rỗng
 * lúc build đã qua, vì loadAll() ném lỗi trước đó nếu rỗng).
 */
export const SITE_LAUNCHED = "2026-07-27";

/**
 * Ngày sửa gần nhất trong một nhóm nội dung.
 *
 * Dùng cho lastmod của các trang tổng hợp (trang chủ, hub, trang nhóm việc):
 * chúng không có `updatedAt` riêng, nội dung của chúng chính là những gì nằm
 * bên dưới. Khai sai chỗ này đắt hơn là khai thiếu — Google chỉ tin lastmod
 * khi nó nhất quán, thấy một site khai ngày mới cho mọi URL sau mỗi lần deploy
 * thì họ bỏ luôn tín hiệu này cho cả site, kéo theo cả những URL đang đúng.
 *
 * `updatedAt` là "YYYY-MM-DD" nên so sánh chuỗi cũng chính là so sánh ngày.
 * `fallback` chỉ dùng khi nhóm rỗng, không phải làm sàn — nó không được đẩy
 * ngày lên cao hơn dữ liệu thật.
 */
export function latestUpdate(
  items: readonly { updatedAt: string }[],
  fallback: string,
): string {
  if (items.length === 0) return fallback;
  return items.reduce(
    (max, item) => (item.updatedAt > max ? item.updatedAt : max),
    items[0].updatedAt,
  );
}

/**
 * Gắn UTM vào link ra HVS. `content` dùng slug template để biết chính xác
 * trang nào đẩy được lead, không chỉ biết chung chung là "từ site template".
 */
export function hvsUrl(
  target: CtaTarget,
  { campaign, content }: { campaign: string; content?: string },
): string {
  const url = new URL(HVS[target]);
  url.searchParams.set("utm_source", "excel.nguyenvietloc.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}

/**
 * Chuẩn hóa dấu gạch chéo cuối URL cho khớp `trailingSlash` trong
 * next.config.ts — bản export tĩnh bật, bản chạy server thì không.
 *
 * Sai chỗ này không gãy trang nhưng hỏng SEO: sitemap khai `/mau-excel` trong
 * khi trang thật nằm ở `/mau-excel/` thì mỗi URL Google lấy về đều ăn một cú
 * redirect, và canonical lại tự trỏ sang một URL khác chính nó.
 *
 * Đường dẫn tới file (`/sitemap.xml`, `.xlsx`) phải đứng yên: thêm dấu `/` vào
 * là 404.
 */
function withTrailingSlash(path: string): string {
  if (!IS_STATIC_EXPORT) return path;
  if (path.endsWith("/")) return path;

  const lastSegment = path.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return path;

  return `${path}/`;
}

export function absoluteUrl(path: string): string {
  return new URL(withTrailingSlash(withBasePath(path)), SITE_URL).toString();
}
