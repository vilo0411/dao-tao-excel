import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions, toSheetStrip } from "@/lib/og";
import { pickShowcase } from "@/lib/showcase";

/**
 * Ảnh OG trang chủ.
 *
 * Dùng đúng file mà HeroSheet đang demo trên trang, nên ảnh trên Zalo và màn
 * hình đầu tiên sau khi bấm vào là cùng một bảng — link không "hứa" một thứ
 * rồi mở ra một thứ khác.
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
export const alt = "Mẫu Excel — file Excel miễn phí, phơi rõ công thức bên trong";

export default async function Image() {
  const showcase = pickShowcase();

  return new ImageResponse(
    (
      <OgFrame
        kicker="Thư viện file Excel miễn phí"
        title="File Excel tôi dựng cho việc của mình"
        /* Tiêu đề trang chủ chỉ có một dòng và không có dãy hàm đi kèm như
           trang file lẻ, nên thiếu câu này thì giữa ảnh là một mảng trắng
           trống trơn — trắng ở đây thành chỗ hụt chứ không thành khoảng thở. */
        subtitle="Tải một file mẫu thì dễ. Sửa được nó khi sếp đổi yêu cầu mới là chuyện khó."
        strip={
          showcase
            ? toSheetStrip(showcase.sheets[0], showcase.computed?.[0])
            : undefined
        }
      />
    ),
    await ogOptions(),
  );
}
