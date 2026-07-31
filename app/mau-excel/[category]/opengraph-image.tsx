import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions, toSheetStrip } from "@/lib/og";
import { getTemplatesByCategory } from "@/lib/templates";
import { getPopulatedCategories, getSystemsByCategory } from "@/lib/systems";
import { CATEGORIES, isCategorySlug } from "@/lib/site";

/**
 * Ảnh OG trang nghề. Bảng đem khoe lấy từ chính nghề đó — vào link nhân sự thì
 * thấy bảng lương, vào link kế toán thì thấy sổ sách.
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
export const alt = "Mẫu Excel theo nghề";

/* Xem chú thích ở opengraph-image.tsx của segment [slug]: route ảnh phải tự
   khai params, không thừa hưởng từ page.tsx. Chỉ dựng nghề đã có nội dung, y
   như page.tsx — nghề rỗng không có trang thì cũng không cần ảnh. */
export const dynamicParams = false;

export function generateStaticParams(): { category: string }[] {
  return getPopulatedCategories().map((category) => ({ category }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategorySlug(category)) {
    return new ImageResponse(
      <OgFrame kicker="Thư viện file Excel" title="Mẫu Excel" />,
      await ogOptions(),
    );
  }

  const meta = CATEGORIES[category];
  const templates = getTemplatesByCategory(category);
  const systems = getSystemsByCategory(category);

  // Không nhắc "tải không cần email" ở đây: dòng chân phải đã nói câu đó rồi,
  // và hai lần cùng một lời hứa trên một ảnh đọc ra là quảng cáo.
  const parts = [`${templates.length} file`];
  if (systems.length > 0) parts.push(`${systems.length} bộ file`);

  const first = templates[0];

  return new ImageResponse(
    (
      <OgFrame
        kicker={meta.name}
        title={`File Excel ${meta.name}`}
        subtitle={meta.description}
        footer={parts.join(" · ")}
        strip={first ? toSheetStrip(first.sheets[0], first.computed?.[0], { maxRows: 1 }) : undefined}
      />
    ),
    await ogOptions(),
  );
}
