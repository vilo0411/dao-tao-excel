import type { Video } from "@/lib/videos";
import { VideoTip } from "./VideoTip";

/**
 * Khối video. Không có video thì không render gì.
 *
 * Cố ý KHÔNG phải client component, dù nó bọc một client component.
 *
 * Lần đầu dựng, phần này nằm chung file "use client" với VideoTip. Hậu quả:
 * React serialize props vào payload của MỌI trang template — kể cả 40 trang
 * không gắn video nào cũng mang theo chuỗi "Mẹo 30 giây cho file này" và một
 * mảng rỗng, cộng thêm tham chiếu tới chunk JS của VideoTip. Component trả về
 * null nhưng cái giá vẫn phải trả.
 *
 * Để nó là server component thì trang không có video không tốn gì cả, và chunk
 * client chỉ tải trên đúng những trang thật sự có video.
 */
export function VideoTipSection({
  videos,
  heading,
}: {
  videos: Video[];
  heading: string;
}) {
  if (videos.length === 0) return null;

  return (
    <section>
      <h2 className="font-display mt-24 text-3xl">{heading}</h2>
      <p className="mt-5 max-w-prose text-ink-soft">
        Mẹo ngắn từ kênh TikTok của HVS Tài Chính Số — chỗ tôi hay xem khi cần
        một cách làm nhanh hơn cách mình đang dùng.
      </p>
      <div
        // items-start: khi một video được bấm, khung player cao 739px. Không có
        // nó thì thẻ còn lại bị grid kéo giãn theo và hở một mảng trống dài.
        className={`mt-8 grid items-start gap-6 ${videos.length > 1 ? "sm:grid-cols-2" : "max-w-md"}`}
      >
        {videos.map((v) => (
          // Bóc từng trường thay vì truyền cả `v`: xem VideoTipProps.
          <VideoTip
            key={v.id}
            video={{
              id: v.id,
              title: v.title,
              poster: v.poster,
              templates: v.templates,
              functions: v.functions,
            }}
          />
        ))}
      </div>
    </section>
  );
}
