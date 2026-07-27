/**
 * Cấu hình toàn site + quy tắc phân luồng CTA sang HVS.
 *
 * Ta không có quyền gắn analytics trên taichinhso.hvsvn.com, nên mọi link ra
 * ngoài phải gắn UTM để bên HVS còn đối chiếu được nguồn traffic.
 */

/**
 * Domain thật. Bản xem thử trên GitHub Pages ghi đè bằng NEXT_PUBLIC_SITE_URL
 * để canonical và sitemap không trỏ về một domain chưa tồn tại.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://excel.nguyenvietloc.com";

/**
 * Tiền tố đường dẫn khi site nằm trong thư mục con (GitHub Pages dạng
 * user.github.io/ten-repo). Rỗng trên domain thật.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Bản xem thử tĩnh: ẩn form và chặn index. */
export const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";

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

export function absoluteUrl(path: string): string {
  return new URL(withBasePath(path), SITE_URL).toString();
}
