import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions } from "@/lib/og";
import { getPopulatedPillars, getPostsByPillar } from "@/lib/knowledge";
import { PILLARS, isPillarSlug } from "@/lib/site";

/** Ảnh OG cho trang cụm. Tự khai generateStaticParams, xem chú thích ở [slug]. */

export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Cụm chủ đề Excel";

export const dynamicParams = false;

export function generateStaticParams(): { pillar: string }[] {
  return getPopulatedPillars().map((pillar) => ({ pillar }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;

  if (!isPillarSlug(pillar)) {
    return new ImageResponse(
      <OgFrame kicker="Kiến thức Excel" title="Kiến thức Excel" />,
      await ogOptions(),
    );
  }

  const info = PILLARS[pillar];
  const count = getPostsByPillar(pillar).length;

  return new ImageResponse(
    (
      <OgFrame
        kicker="Kiến thức Excel"
        title={info.name}
        subtitle={info.description}
        note={`${count} bài · kèm file thật để đối chiếu`}
      />
    ),
    await ogOptions(),
  );
}
