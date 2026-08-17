/**
 * Danh sách câu hỏi thường gặp của MỘT trang.
 *
 * Đừng nhầm với components/Faq.tsx: file kia là FAQ toàn site với bốn câu hỏi
 * viết cứng ("file có miễn phí không", "dùng được trên Google Sheets không"),
 * dùng ở trang chủ. Nó không nhận tham số và không tái dùng được.
 *
 * Khối này trước đây được viết thẳng trong trang, và đã bị nhân đôi giữa trang
 * template với trang bộ file. Trang bài của khu kiến thức là chỗ thứ ba, nên
 * trích ra đây thay vì chép lần nữa — ba bản sao là lúc một khác biệt nhỏ giữa
 * chúng bắt đầu trôi đi mà không ai để ý.
 *
 * Dùng <dl> chứ không phải <details>: đây là nội dung cần Google đọc được và
 * cần khớp với JSON-LD FAQPage, nên nó phải hiện sẵn chứ không gập lại.
 */
export function FaqList({
  items,
  className = "",
}: {
  items: readonly { q: string; a: string }[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <dl className={`divide-y divide-rule border-y border-rule ${className}`}>
      {items.map((item) => (
        <div key={item.q} className="py-5">
          <dt className="font-medium">{item.q}</dt>
          <dd className="mt-2 max-w-prose text-ink-soft">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
