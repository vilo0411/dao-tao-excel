"use client";

import Image from "next/image";
import { useState } from "react";
import type { Video } from "@/lib/videos";

/**
 * Mẹo video, dựng theo kiểu facade: mặc định chỉ là ảnh tĩnh + nút play, bấm
 * mới nạp iframe TikTok.
 *
 * Vì sao không nhúng thẳng: site này tĩnh và nhẹ, LCP là điểm mạnh của nó.
 * Nhúng iframe bên thứ ba trên mọi trang là đánh đổi vài trăm KB và một
 * loạt kết nối tới domain khác để lấy về một thứ mà đa số người đọc không bấm.
 *
 * Dùng thẳng iframe embed/v2 thay vì blockquote + embed.js của TikTok: script
 * đó chỉ làm đúng một việc là quét DOM rồi thay blockquote bằng chính iframe
 * này, nhưng nó lại nạp thêm JS và không tự chạy lại sau khi Next.js điều
 * hướng phía client — tức là vừa nặng hơn vừa dễ hỏng hơn.
 *
 * Không in `title` và `summary` ra trang: quyết định của chủ site, chỉ nhúng
 * link. Hệ quả cần biết trước khi ai đó tính chuyện SEO cho khối này — trang
 * không nhận được một chữ nào có thể index từ video, vì phần chữ duy nhất còn
 * lại nằm trong `sr-only` và thuộc tính `title` của iframe, cả hai chỉ để
 * người dùng screen reader biết nút này mở cái gì. `summary` vì thế cũng
 * không còn bắt buộc trong schema, xem lib/videos.ts.
 */

/**
 * Khung embed của TikTok là một layout dọc CỐ ĐỊNH: header tài khoản + video
 * dọc + dòng nhạc, đo được 738px và không co theo khung cha. Nó cũng không gửi
 * postMessage báo chiều cao, nên không có cách nào tự đo — phải đặt cứng.
 *
 * Bản đầu để khung player theo `aspect-video` cho hợp bố cục desktop. Iframe
 * vẫn nạp, vẫn có thẻ <video> bên trong, nên mọi kiểm tra "có render không"
 * đều pass — nhưng khung chỉ cao 197px và người xem chỉ thấy một lát header.
 * Trông y như hỏng. Đừng đổi hai hằng số này về đơn vị co giãn.
 */
const PLAYER_HEIGHT = 739;
/** Dưới 325px layout trong iframe vỡ; trên 605px TikTok để hai dải đen hai bên. */
const PLAYER_MAX_WIDTH = 605;

/**
 * Chỉ những trường component này thật sự dùng, KHÔNG phải cả `Video`.
 *
 * Props của client component bị serialize vào payload RSC của trang. Nhận
 * nguyên `Video` thì `summary`, `url` và `publishedAt` cũng đi theo xuống
 * trình duyệt dù không có gì render chúng — `summary` một mình đã hơn 200 ký
 * tự mỗi video. Cùng lý do khiến VideoTipSection phải là server component.
 */
export type VideoTipProps = Pick<
  Video,
  "id" | "title" | "poster" | "templates" | "functions"
>;

export function VideoTip({ video }: { video: VideoTipProps }) {
  const [playing, setPlaying] = useState(false);

  function play() {
    setPlaying(true);
    // Cú bấm này là điểm đo: nó nói trang template có thật sự đẩy người xem
    // sang nội dung của HVS hay không, trước khi ta rải video đi khắp site.
    window.gtag?.("event", "video_tip_play", {
      video_id: video.id,
      templates: video.templates.join(","),
      functions: video.functions.join(","),
    });
  }

  return (
    <figure
      className="overflow-hidden rounded-lg border border-rule bg-paper"
      style={playing ? { maxWidth: PLAYER_MAX_WIDTH } : undefined}
    >
      <div
        /*
         * Poster giữ đúng 9/16 ở mọi bề rộng, không đổi sang aspect-video ở
         * desktop nữa. Poster TikTok là ảnh dọc và gần như luôn có chữ tiêu đề
         * ở phần trên; khung 16/9 cắt đúng dải đó. Hồi còn caption bên dưới thì
         * không sao, nhưng giờ trang không in tiêu đề nữa nên poster là thứ duy
         * nhất nói cho người đọc biết video này về cái gì.
         */
        className={`relative w-full bg-surface-strong ${playing ? "" : "aspect-[9/16]"}`}
        style={playing ? { height: PLAYER_HEIGHT } : undefined}
      >
        {playing ? (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${video.id}`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={play}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={video.poster}
              alt=""
              fill
              sizes="(min-width: 640px) 420px, 100vw"
              className="object-cover"
            />
            {/* Lớp phủ để nút play luôn đọc được, bất kể poster sáng hay tối. */}
            <span className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/35" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="ml-1 h-6 w-6 fill-ink"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span className="sr-only">Xem video: {video.title}</span>
          </button>
        )}
      </div>
    </figure>
  );
}
