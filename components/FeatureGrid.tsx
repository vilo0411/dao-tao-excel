type Feature = {
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    title: "Công thức luôn phơi ra, không khóa",
    body: "Không có sheet ẩn, không có mật khẩu bảo vệ. Bấm vào ô nào cũng thấy công thức chạy bằng gì.",
  },
  {
    title: "Kiểm tra bằng máy trước khi đăng",
    body: "Mỗi file chạy qua một lượt kiểm công thức tự động trước khi lên trang, để số không lệch khi bạn đổi input.",
  },
  {
    title: "Tải thẳng, không email, không tường chắn",
    body: "Bấm tải là ra file .xlsx. Không đăng ký, không để lại email, không chuỗi thư nhắc mua hàng.",
  },
  {
    title: "Mở được cả Excel lẫn Google Sheets",
    body: "Không dùng add-in hay macro riêng của một nền tảng, nên file mở đâu cũng chạy đúng công thức.",
  },
];

/**
 * Gom các tuyên bố đang rải rác trong văn xuôi (hero, band coral) thành một
 * khối scannable, đặt ngay sau demo sống để củng cố luận điểm vừa chứng minh.
 */
export function FeatureGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {FEATURES.map((feature) => (
        <li
          key={feature.title}
          className="rounded-md border border-rule bg-panel p-6 sm:p-8"
        >
          <h3 className="font-display text-lg font-medium text-balance">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm text-ink-soft">{feature.body}</p>
        </li>
      ))}
    </ul>
  );
}
