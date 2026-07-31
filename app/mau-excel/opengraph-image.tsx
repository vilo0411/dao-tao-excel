import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions, toSheetStrip } from "@/lib/og";
import { pickShowcase } from "@/lib/showcase";
import { getAllTemplates } from "@/lib/templates";

/** Ảnh OG trang thư viện. Số file lấy từ dữ liệu thật, không gõ tay. */

/*
 * Bắt buộc với bản export tĩnh cho GitHub Pages: route ảnh mặc định được coi
 * là động, và `output: export` từ chối build khi gặp một route như vậy — cả
 * bản dựng gãy, không chỉ riêng ảnh. Bản trên Vercel vốn đã dựng sẵn ảnh này
 * lúc build nên dòng khai báo không đổi gì ở đó.
 */
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Thư viện mẫu Excel miễn phí có sẵn công thức";

export default async function Image() {
  const count = getAllTemplates().length;
  const showcase = pickShowcase();

  return new ImageResponse(
    (
      <OgFrame
        kicker="Thư viện file Excel"
        title={`${count} file Excel, tải không cần đăng ký`}
        subtitle="Nhân sự, kế toán, quản lý công việc — mỗi file kèm công thức được giải thích ra."
        strip={
          showcase
            ? toSheetStrip(showcase.sheets[0], showcase.computed?.[0], { maxRows: 1 })
            : undefined
        }
      />
    ),
    await ogOptions(),
  );
}
