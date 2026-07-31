import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions } from "@/lib/og";
import { AUTHOR } from "@/lib/author";

/**
 * Ảnh OG trang khóa học.
 *
 * Trang duy nhất KHÔNG mang mảnh bảng tính: nó không bán một file nào, nó nêu
 * một câu hỏi. Đáy ảnh đóng bằng dải coral — cùng vai trò với band coral trên
 * trang chủ, và cũng là chỗ duy nhất trong bộ ảnh này được to tiếng.
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
export const alt = "Khóa học Excel tôi giới thiệu cho người đi làm";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame
        kicker={`${AUTHOR.name} giới thiệu`}
        title="Đến lúc nào thì nên đi học Excel"
        /* Câu này phải trọn nghĩa trong một dòng rưỡi. Dán nguyên đoạn mở đầu
           của trang vào đây thì OgFrame cắt ở 120 ký tự, và chỗ nó cắt rơi
           đúng giữa mệnh đề — ảnh đọc ra như bị hỏng. */
        subtitle="Nếu tháng nào cũng phải đi tìm một file khác, thứ bạn thiếu không phải là thêm một file nữa."
        note="Tôi không đứng lớp, chỉ giới thiệu"
        band="Thư viện file vẫn miễn phí, không liên quan tới khóa học"
      />
    ),
    await ogOptions(),
  );
}
