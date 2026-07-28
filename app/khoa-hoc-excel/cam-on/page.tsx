import type { Metadata } from "next";
import Link from "next/link";
import { CourseCta } from "@/components/CourseCta";

export const metadata: Metadata = {
  title: "Đã nhận thông tin của bạn",
  // Trang cảm ơn không có giá trị tìm kiếm và dễ bị index nhầm thành trang mỏng.
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24">
      <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
        Đã nhận thông tin của bạn
      </h1>
      <p className="mt-6 max-w-prose text-lg text-ink-soft">
        Đội ngũ HVS sẽ liên hệ để tư vấn lộ trình. Trong lúc chờ, bạn cứ tải
        thêm file về dùng — không cần đợi học xong mới làm được việc.
      </p>

      <div className="mt-24">
        <CourseCta
          target="consult"
          text="Xem trước chương trình Excel bên HVS"
          content="thank-you"
          campaign="thank-you"
        />
      </div>

      <p className="mt-10">
        <Link
          href="/mau-excel"
          className="text-input font-medium underline decoration-input/40 underline-offset-2 hover:decoration-input"
        >
          Quay lại thư viện file
        </Link>
      </p>
    </div>
  );
}
