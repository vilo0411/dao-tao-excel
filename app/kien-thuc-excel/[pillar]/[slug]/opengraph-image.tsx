import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions } from "@/lib/og";
import { getAllPosts, getPopulatedPillars, getPost } from "@/lib/knowledge";
import { getAllTemplates } from "@/lib/templates";
import { getFunction } from "@/lib/functions";
import { toSheetStrip } from "@/lib/schema";
import { PILLARS, isPillarSlug } from "@/lib/site";

/**
 * Ảnh OG cho một trang bài.
 *
 * Route này TỰ khai generateStaticParams — nó không thừa hưởng từ page.tsx
 * cùng segment. Thiếu dòng đó thì bản export tĩnh không sinh ra file .png nào,
 * và lỗi chỉ lộ khi kiểm thư mục out/ chứ không lộ lúc build.
 */

export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Kiến thức Excel — sửa lỗi kèm file thật";

export const dynamicParams = false;

export function generateStaticParams(): { pillar: string; slug: string }[] {
  const open = new Set<string>(getPopulatedPillars());
  return getAllPosts()
    .filter((p) => open.has(p.pillar))
    .map((p) => ({ pillar: p.pillar, slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ pillar: string; slug: string }>;
}) {
  const { pillar, slug } = await params;
  const post = getPost(pillar, slug);

  if (!post) {
    return new ImageResponse(
      <OgFrame kicker="Kiến thức Excel" title="Kiến thức Excel" />,
      await ogOptions(),
    );
  }

  /*
   * Ảnh OG của một bài lỗi vẫn khoe một mảnh bảng tính THẬT — lấy từ template
   * đầu tiên mà bài trỏ tới. Đây là luận điểm của cả site (lib/og.tsx:16-19):
   * ta có file thật đằng sau mỗi trang, và ảnh chia sẻ phải nói ra điều đó
   * thay vì chỉ là một tấm chữ.
   */
  const template = getAllTemplates().find((t) => t.slug === post.templateRefs[0]);
  const strip = template
    ? toSheetStrip(template.sheets[0], template.computed?.[0])
    : undefined;

  return new ImageResponse(
    (
      <OgFrame
        kicker={isPillarSlug(pillar) ? PILLARS[pillar].name : "Kiến thức Excel"}
        title={post.h1}
        subtitle={post.metaDesc}
        functions={post.functionRefs.flatMap((s) => {
          const fn = getFunction(s);
          return fn ? [fn.name] : [];
        })}
        note="sửa lỗi · có file thật để đối chiếu"
        strip={strip}
      />
    ),
    await ogOptions(),
  );
}
