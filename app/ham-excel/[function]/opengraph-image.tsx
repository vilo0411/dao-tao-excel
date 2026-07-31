import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions } from "@/lib/og";
import { getAllFunctions, getFunction } from "@/lib/functions";

/**
 * Ảnh OG cho một trang hàm. Route này tự khai generateStaticParams — không
 * thừa hưởng từ page.tsx cùng segment (xem chú thích ở opengraph-image.tsx
 * của /mau-excel/[category]/[slug]).
 */

/*
 * Bắt buộc với bản export tĩnh cho GitHub Pages: route ảnh mặc định được coi
 * là động, và `output: export` từ chối build khi gặp một route như vậy — cả
 * bản dựng gãy, không chỉ riêng ảnh. Bản trên Vercel vốn đã dựng sẵn ảnh này
 * lúc build nên dòng khai báo không đổi gì ở đó.
 */
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Hàm Excel — cú pháp và ví dụ thật từ file mẫu";

export const dynamicParams = false;

export function generateStaticParams(): { function: string }[] {
  return getAllFunctions().map((fn) => ({ function: fn.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ function: string }>;
}) {
  const { function: slug } = await params;
  const fn = getFunction(slug);

  if (!fn) {
    return new ImageResponse(
      <OgFrame kicker="Hàm Excel" title="Hàm Excel" />,
      await ogOptions(),
    );
  }

  return new ImageResponse(
    (
      <OgFrame
        kicker={fn.group}
        title={`Hàm ${fn.name} trong Excel`}
        subtitle={fn.definition}
        functions={[fn.name]}
        note="tra cứu miễn phí"
      />
    ),
    await ogOptions(),
  );
}
