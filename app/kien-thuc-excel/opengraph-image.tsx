import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions } from "@/lib/og";
import { getAllPosts } from "@/lib/knowledge";

/** Ảnh OG cho trang hub. Không có param nên chỉ cần force-static. */

export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Kiến thức Excel — hướng dẫn kèm file thật";

export default async function Image() {
  const count = getAllPosts().length;

  return new ImageResponse(
    (
      <OgFrame
        kicker="Kiến thức Excel"
        title="Hướng dẫn Excel kèm file thật để đối chiếu"
        subtitle="Mọi công thức trên trang là công thức đang chạy trong một file mẫu tải được, và số liệu là số Excel tính ra."
        note={`${count} bài · thử công thức ngay trên trình duyệt`}
      />
    ),
    await ogOptions(),
  );
}
