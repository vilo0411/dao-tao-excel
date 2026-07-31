import { ImageResponse } from "next/og";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgFrame,
  ogOptions,
  toNodeStrip,
  toSheetStrip,
} from "@/lib/og";
import { getAllTemplates, getTemplate } from "@/lib/templates";
import { getAllSystems, getSystem } from "@/lib/systems";
import { CATEGORIES, isCategorySlug } from "@/lib/site";

/**
 * Ảnh OG cho trang file lẻ và trang bộ file.
 *
 * Route này dùng chung generateStaticParams của page.tsx cùng segment, nên mọi
 * file trong thư viện đều có ảnh riêng dựng sẵn lúc build — kể cả ở bản export
 * tĩnh trên GitHub Pages, nơi không có server để dựng ảnh lúc chạy.
 *
 * Ảnh khoe đúng mảnh bảng tính của chính file đó, lấy từ spec và từ giá trị đã
 * qua QA. Nghĩa là hai file khác nhau ra hai ảnh khác nhau mà không ai phải mở
 * Figma, và không ảnh nào nói sai về file nó đại diện.
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
export const alt = "Mẫu Excel — xem trước bảng tính và công thức bên trong";

/*
 * Route ảnh KHÔNG thừa hưởng generateStaticParams của page.tsx cùng segment —
 * thiếu hàm này thì `next build` xếp ảnh vào diện "server-rendered on demand",
 * và bản export tĩnh cho GitHub Pages sẽ gãy vì ở đó không có server nào.
 *
 * Danh sách phải khớp page.tsx: cả file lẻ lẫn bộ file đều dùng chung route.
 */
export const dynamicParams = false;

export function generateStaticParams(): { category: string; slug: string }[] {
  return [
    ...getAllTemplates().map((t) => ({ category: t.category, slug: t.slug })),
    ...getAllSystems().map((s) => ({ category: s.category, slug: s.slug })),
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const categoryName = isCategorySlug(category) ? CATEGORIES[category].name : "Mẫu Excel";

  const template = getTemplate(category, slug);
  if (template) {
    return new ImageResponse(
      (
        <OgFrame
          kicker={categoryName}
          title={template.h1}
          functions={template.functions}
          strip={toSheetStrip(template.sheets[0], template.computed?.[0])}
        />
      ),
      await ogOptions(),
    );
  }

  const system = getSystem(slug);
  if (system) {
    return new ImageResponse(
      (
        <OgFrame
          kicker={`${categoryName} · bộ file`}
          cell="A1:C1"
          title={system.h1}
          footer={`${system.liveCount}/${system.totalCount} file đã có · ${system.cadence}`}
          strip={toNodeStrip(system.nodes.filter((n) => n.status === "live"))}
        />
      ),
      await ogOptions(),
    );
  }

  // dynamicParams=false trên page.tsx nên nhánh này không xảy ra trong bản
  // dựng thật; giữ lại để route không ném lỗi nếu ai đó gọi thẳng URL ảnh.
  return new ImageResponse(
    <OgFrame kicker={categoryName} title="Mẫu Excel" />,
    await ogOptions(),
  );
}
