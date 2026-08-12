import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
// Import tương đối kèm .ts để script Node chạy trực tiếp được đúng loader này,
// giống lib/templates.ts và lib/functions.ts.
import { getAllTemplates } from "./templates.ts";
import { getAllFunctions } from "./functions.ts";

/**
 * Mẹo video từ kênh TikTok của HVS Tài Chính Số, gắn vào trang hàm.
 *
 * Video KHÔNG mở trang riêng. Nó là nội dung bổ sung cho những trang đã có lý
 * do tồn tại — trang hàm hiện chỉ có cú pháp + định nghĩa trung lập, tức là
 * phần dễ trùng với mọi site khác nhất, nên đây là chỗ một đoạn viết tay tạo
 * ra khác biệt lớn nhất trên mỗi đơn vị công sức.
 *
 * Ngày nào một video có đủ chữ để đứng thành bài thì mới tính chuyện mở
 * /meo-excel. Đảo thứ tự lại — mở hub trước rồi lấp dần — là tự tạo ra đúng
 * loại trang mỏng mà MIN_TEMPLATES_PER_CATEGORY được viết ra để chặn, lần này
 * còn kéo theo cả cụm /ham-excel đang khỏe.
 */

const VIDEO_ID = /^\d{6,}$/;

/**
 * Trần cứng, cố ý đặt trong schema chứ không phải trong component.
 *
 * Một video gắn năm hàm là một video không nói riêng về hàm nào — nó chỉ đang
 * được rải đi để lấy link. Ép chọn tối đa hai cái chính thì người tag phải
 * quyết định, và trang nhận về video thật sự nói đúng chuyện của nó.
 */
const MAX_FUNCTIONS_PER_VIDEO = 2;

/** Video thứ ba trên một trang hàm là nhồi, không phải phong phú. */
export const MAX_VIDEOS_PER_FUNCTION = 2;

const videoSchema = z.object({
  /** Phần số cuối URL TikTok. Vừa là khóa, vừa là tên file thumbnail. */
  id: z.string().regex(VIDEO_ID, "id phải là dãy số cuối URL TikTok"),
  url: z.string().url().startsWith("https://www.tiktok.com/"),
  /** Tiêu đề tự viết, hiện dưới poster. Caption gốc thường là copy câu view. */
  title: z.string().min(10).max(120),
  /**
   * 2-3 câu viết tay. Đây mới là phần Google đọc được — embed TikTok không cho
   * trang một chữ nào. Thiếu nó thì video chỉ là iframe trần, nên build fail
   * thay vì lặng lẽ cho lên trang.
   */
  summary: z.string().min(80),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Tên hàm VIẾT HOA, phải là hàm đã có trang (tức có template dùng thật). */
  functions: z
    .array(z.string().regex(/^[A-Z][A-Z0-9.]*$/))
    .min(1)
    .max(
      MAX_FUNCTIONS_PER_VIDEO,
      `mỗi video gắn tối đa ${MAX_FUNCTIONS_PER_VIDEO} hàm — chọn hàm chính`,
    ),
  /** Slug template liên quan, không bắt buộc. Dùng ở bước sau, chưa hiển thị. */
  templates: z.array(z.string()).default([]),
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

/** Video của một hàm, đã cắt theo trần hiển thị. */
export function getVideosForFunction(name: string): Video[] {
  return getAllVideos()
    .filter((v) => v.functions.includes(name))
    .slice(0, MAX_VIDEOS_PER_FUNCTION);
}
