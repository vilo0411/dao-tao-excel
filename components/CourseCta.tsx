"use client";

import { hvsUrl, type CtaTarget } from "@/lib/site";

type Props = {
  target: CtaTarget;
  text: string;
  /** Slug template, đi vào utm_content để biết trang nào đẩy được lead. */
  content?: string;
  campaign?: string;
  variant?: "banner" | "inline";
};

/**
 * Lời giới thiệu khóa học, viết ở ngôi thứ nhất.
 *
 * Site đứng tên một người thật nên CTA phải là lời khuyên của người đó, không
 * phải banner quảng cáo — người đọc vừa nhận file miễn phí xong, cái họ tin là
 * người đưa file chứ không phải nhãn hiệu.
 *
 * Ta không gắn được analytics trên taichinhso.hvsvn.com, nên cú click ra ngoài
 * là điểm đo cuối cùng kiểm soát được: bắn GA4 event tại đây và gắn UTM để phía
 * HVS đối chiếu ngược lại.
 */
export function CourseCta({
  target,
  text,
  content,
  campaign = "template-hub",
  variant = "banner",
}: Props) {
  const href = hvsUrl(target, { campaign, content });

  function handleClick() {
    window.gtag?.("event", "outbound_cta_click", {
      destination: target,
      template_slug: content ?? "(none)",
      campaign,
    });
  }

  if (variant === "inline") {
    return (
      <a
        href={href}
        onClick={handleClick}
        target="_blank"
        rel="noopener"
        className="text-input font-medium underline decoration-input/40 underline-offset-2 hover:decoration-input"
      >
        {text}
      </a>
    );
  }

  return (
    <aside className="border-l-2 border-input bg-input-bg/50 p-6 sm:p-7">
      <p className="font-display text-lg font-bold text-balance">{text}</p>
      <p className="mt-3 max-w-prose text-ink-soft">
        Chỗ tôi thấy đáng học là khóa Excel của HVS Tài Chính Số. Họ dạy đúng
        phần mà file mẫu không dạy được: cách tự dựng lại bảng biểu khi yêu cầu
        thay đổi, thay vì đi tìm file khác.
      </p>
      <a
        href={href}
        onClick={handleClick}
        target="_blank"
        rel="noopener"
        className="mt-5 inline-block bg-input px-5 py-3 font-medium text-paper hover:bg-ink"
      >
        Xem khóa học bên HVS
      </a>
    </aside>
  );
}
