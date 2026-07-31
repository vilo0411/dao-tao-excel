import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, ogOptions } from "@/lib/og";
import { getAllFunctions } from "@/lib/functions";

/** Ảnh OG trang từ điển hàm. Không có sheet nào để khoe — mỗi hàm là một hàng
 *  mono, cùng vai trò với dải hàm dùng trên card file lẻ. */

/*
 * Bắt buộc với bản export tĩnh cho GitHub Pages: route ảnh mặc định được coi
 * là động, và `output: export` từ chối build khi gặp một route như vậy — cả
 * bản dựng gãy, không chỉ riêng ảnh. Bản trên Vercel vốn đã dựng sẵn ảnh này
 * lúc build nên dòng khai báo không đổi gì ở đó.
 */
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Từ điển hàm Excel — cú pháp và ví dụ thật từ file mẫu";

export default async function Image() {
  const functions = getAllFunctions();

  return new ImageResponse(
    (
      <OgFrame
        kicker="Hàm Excel"
        title={`${functions.length} hàm Excel dùng thật trong file mẫu`}
        subtitle="Cú pháp, giải thích, và ví dụ thật kèm link tới đúng file."
        functions={functions.map((fn) => fn.name)}
        note="tra cứu miễn phí"
      />
    ),
    await ogOptions(),
  );
}
