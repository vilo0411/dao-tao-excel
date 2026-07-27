/**
 * Danh tính tác giả.
 *
 * Site đứng tên một người thật chứ không phải một thương hiệu vô danh: lời
 * giới thiệu khóa học chỉ có sức nặng khi có người chịu trách nhiệm đứng sau.
 */
export const AUTHOR = {
  name: "Lộc Nguyễn",
  role: "Làm SEO, dựng bảng tính cho công việc hằng ngày",
  /**
   * Thay bằng ảnh thật tại public/loc.jpg. Chưa có file thì component tự
   * chuyển sang monogram, không vỡ layout.
   */
  photo: "/loc.jpg",
  initials: "LN",
  site: "https://nguyenvietloc.com",
  bio: "Tôi làm SEO, và phần lớn thời gian còn lại là ngồi với bảng tính. Những file Excel ở đây là bản tôi dựng cho việc của mình, dọn lại cho gọn rồi để lại đây dùng chung.",
  /**
   * Câu công khai quan hệ với HVS. Hiện để trung tính vì chưa chốt hình thức
   * hợp tác — khi chốt thì sửa đúng một chỗ này, toàn site cập nhật theo.
   */
  disclosure:
    "Khóa học tôi giới thiệu ở đây do HVS Tài Chính Số tổ chức. Tôi không đứng lớp, chỉ giới thiệu chỗ tôi thấy đáng học.",
} as const;
