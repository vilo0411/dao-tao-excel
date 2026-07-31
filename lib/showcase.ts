import { getAllTemplates, type Template } from "./templates.ts";

/**
 * File được chọn làm mặt tiền cho các trang không nói về một file cụ thể
 * (trang chủ, trang thư viện, trang khóa học).
 *
 * Ưu tiên bảng lương vì đó cũng là file HeroSheet demo trên trang chủ — ảnh OG
 * và màn hình đầu tiên sau khi bấm vào phải là cùng một bảng.
 *
 * Không gõ cứng slug ở bốn chỗ rồi hy vọng file đó còn sống: xoá hay đổi tên
 * file bảng lương thì hàm tự rơi về file đầu thư viện, ảnh vẫn dựng được thay
 * vì cả bản build gãy vì một `undefined.sheets[0]`.
 */
const PREFERRED = "bang-tinh-luong-nhan-vien";

export function pickShowcase(): Template | undefined {
  const all = getAllTemplates();
  return all.find((t) => t.slug === PREFERRED) ?? all[0];
}
