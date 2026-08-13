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
 */
export function VideoTip({ video }: { video: Video }) {
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
    <figure className="overflow-hidden rounded-lg border border-rule bg-paper">
      <div className="relative aspect-[9/16] w-full bg-surface-strong sm:aspect-video">
        {playing ? (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${video.id}`}
            title={video.title}
            allow="encrypted-media; picture-in-picture; fullscreen"
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

      <figcaption className="border-t border-rule p-5">
        <p className="font-medium text-ink">{video.title}</p>
        <p className="mt-2 text-sm text-ink-soft">{video.summary}</p>
        <a
          href={video.url}
          target="_blank"
          rel="noopener"
          className="mt-3 inline-block text-sm text-ink-faint underline decoration-rule underline-offset-2 hover:text-ink"
        >
          Xem trên TikTok của HVS Tài Chính Số
        </a>
      </figcaption>
    </figure>
  );
}
