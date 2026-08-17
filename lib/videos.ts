import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
// Import tương đối kèm .ts để script Node chạy trực tiếp được đúng loader này,
// giống lib/templates.ts và lib/functions.ts.
import { getAllTemplates } from "./templates.ts";
import { getAllFunctions } from "./functions.ts";

/**
 * Mẹo video từ kênh TikTok của HVS Tài Chính Số, gắn vào trang template.
 *
 * Video KHÔNG mở trang riêng. Nó là nội dung bổ sung cho những trang đã có lý
 * do tồn tại.
 *
 * Chỗ gắn chính là TEMPLATE, không phải hàm — đây là kết luận rút từ caption
 * thật của kênh chứ không phải phỏng đoán. Kênh dạy theo việc ("tạo bảng chấm
 * công động", "tính tuổi từ ngày sinh", "tính % tổng"), y hệt cách site này
 * tổ chức theo nhóm việc. Còn glossary /ham-excel chỉ có 10 hàm nền tảng rút
 * ra từ công thức trong template (AND, IF, IFERROR, MAX, MIN, N, OR, REPT,
 * ROUND, SUM), trong khi kênh nói về XLOOKUP, pivot, biểu đồ — hai tập hợp gần
 * như không giao nhau. Trong 7 caption đọc được lúc dựng file này, không caption
 * nào nhắc tới một hàm đang có trang.
 *
 * `functions` vì vậy là đường phụ: chỉ dùng khi một video thật sự nói về đúng
 * một hàm mà site đã có trang.
 *
 * Video về hàm site chưa có trang (XLOOKUP...) thì hiện KHÔNG có chỗ gắn, và
 * đừng phá luật "hàm chỉ mở trang khi có template dùng thật" để nhét vào. Muốn
 * XLOOKUP có trang thì dựng một template dùng XLOOKUP, trang hàm sẽ tự mọc.
 *
 * Khu chữ đã có rồi, và nó KHÔNG phải /meo-excel: từ 08/2026 site có
 * /kien-thuc-excel (PRD mục 2.9). Video muốn đứng cùng một bài thì dùng khối
 * `video` trong thân bài ở đó, đừng mở một hub thứ hai — hai cửa vào cho cùng
 * loại nội dung thì chia đôi cả internal link lẫn tín hiệu SEO.
 *
 * Thứ tự vẫn giữ nguyên và vẫn đúng: nội dung trước, hub sau. Cụm ở khu kiến
 * thức chỉ mở khi đủ 8 bài (MIN_POSTS_PER_PILLAR, lib/knowledge.ts) — cùng
 * nguyên tắc với MIN_TEMPLATES_PER_CATEGORY, và cùng lý do.
 */

const VIDEO_ID = /^\d{6,}$/;

/**
 * Trần cứng, cố ý đặt trong schema chứ không phải trong component.
 *
 * Một video gắn năm chỗ là một video không nói riêng về chỗ nào — nó chỉ đang
 * được rải đi để lấy link. Ép chọn tối đa hai cái chính thì người tag phải
 * quyết định, và trang nhận về video thật sự nói đúng chuyện của nó.
 */
const MAX_TARGETS_PER_VIDEO = 2;

/** Video thứ ba trên một trang là nhồi, không phải phong phú. */
export const MAX_VIDEOS_PER_PAGE = 2;

const videoSchema = z.object({
  /** Phần số cuối URL TikTok. Vừa là khóa, vừa là tên file thumbnail. */
  id: z.string().regex(VIDEO_ID, "id phải là dãy số cuối URL TikTok"),
  url: z.string().url().startsWith("https://www.tiktok.com/"),
  /**
   * Tiêu đề tự viết. KHÔNG hiện trên trang — khối video giờ chỉ nhúng link.
   * Nó đi vào nhãn `sr-only` của nút play và thuộc tính `title` của iframe,
   * nên vẫn bắt buộc: người dùng screen reader cần biết nút này mở cái gì.
   */
  title: z.string().min(10).max(120),
  /**
   * Tùy chọn, và không hiện trên trang.
   *
   * Trước đây bắt buộc, với lý do đây là phần duy nhất Google đọc được vì embed
   * TikTok không cho trang một chữ nào. Lý do đó mất hiệu lực khi chủ site
   * quyết định bỏ phần chữ dưới video — bắt viết 80 ký tự cho một trường không
   * ai đọc thì chỉ là thuế đặt lên người thêm video sau. Giữ lại làm ghi chú
   * nội bộ trong data/, dùng được nếu sau này khối video có chỗ cho chữ.
   */
  summary: z.string().min(80).optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Slug template mà video này nói đúng vào việc của nó. Đường gắn chính. */
  templates: z
    .array(z.string())
    .max(
      MAX_TARGETS_PER_VIDEO,
      `mỗi video gắn tối đa ${MAX_TARGETS_PER_VIDEO} template — chọn file chính`,
    )
    .default([]),
  /**
   * Đường phụ: chỉ khi video thật sự nói về đúng một hàm site đã có trang.
   * Tên hàm VIẾT HOA. Phần lớn video sẽ để trống trường này.
   */
  functions: z
    .array(z.string().regex(/^[A-Z][A-Z0-9.]*$/))
    .max(
      MAX_TARGETS_PER_VIDEO,
      `mỗi video gắn tối đa ${MAX_TARGETS_PER_VIDEO} hàm — chọn hàm chính`,
    )
    .default([]),
})
  .refine((v) => v.templates.length > 0 || v.functions.length > 0, {
    // Video không gắn vào đâu thì không hiển thị ở đâu cả — nó chỉ nằm im
    // trong data/ và làm người sau tưởng là đã lên trang.
    message:
      "video phải gắn vào ít nhất một template hoặc một hàm, nếu không nó không xuất hiện ở đâu",
    path: ["templates"],
  });

export type VideoSpec = z.infer<typeof videoSchema>;

export type Video = VideoSpec & {
  /** Ảnh poster đã tải về lúc build. Xem scripts/fetch-video-thumbs.mts. */
  poster: string;
};

const DATA_DIR = join(process.cwd(), "data", "videos");

function loadAll(): Video[] {
  let files: string[];
  try {
    files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    // Chưa có thư mục videos thì site vẫn dựng bình thường, khối video chỉ
    // không xuất hiện. Đây là tính năng thêm vào, không phải xương sống.
    return [];
  }

  const knownFunctions = new Set(getAllFunctions().map((f) => f.name));
  const knownTemplates = new Set(getAllTemplates().map((t) => t.slug));

  const videos: Video[] = [];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    const parsed = videoSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `data/videos/${file} không hợp lệ:\n${z.prettifyError(parsed.error)}`,
      );
    }

    const spec = parsed.data;

    /*
     * Chỉ bắt được slug có thật, KHÔNG bắt được tag đúng-mà-lệch: một video
     * nói về pivot table nhưng nhắc SUMIF ở giây thứ 3 vẫn qua cửa này. Chuyện
     * đó chỉ người xem video mới thấy — đừng để đoạn validate dưới đây tạo cảm
     * giác an toàn giả.
     */
    for (const name of spec.functions) {
      if (!knownFunctions.has(name)) {
        throw new Error(
          `data/videos/${file}: hàm "${name}" chưa có trang trong /ham-excel — chỉ những hàm có template dùng thật mới mở trang, xem lib/functions.ts.`,
        );
      }
    }

    for (const slug of spec.templates) {
      if (!knownTemplates.has(slug)) {
        throw new Error(
          `data/videos/${file}: không có template nào tên "${slug}".`,
        );
      }
    }

    videos.push({ ...spec, poster: `/videos/${spec.id}.jpg` });
  }

  const ids = new Set<string>();
  for (const v of videos) {
    if (ids.has(v.id)) throw new Error(`Trùng id video: ${v.id}`);
    ids.add(v.id);
  }

  // Mới nhất lên trước: mẹo Excel không cũ đi, nhưng giao diện Excel thì có.
  return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

let cache: Video[] | undefined;

export function getAllVideos(): Video[] {
  cache ??= loadAll();
  return cache;
}

/** Video của một template, đã cắt theo trần hiển thị. Đường gắn chính. */
export function getVideosForTemplate(slug: string): Video[] {
  return getAllVideos()
    .filter((v) => v.templates.includes(slug))
    .slice(0, MAX_VIDEOS_PER_PAGE);
}

/** Video của một hàm. Đường phụ, phần lớn trang hàm sẽ không có video nào. */
export function getVideosForFunction(name: string): Video[] {
  return getAllVideos()
    .filter((v) => v.functions.includes(name))
    .slice(0, MAX_VIDEOS_PER_PAGE);
}
