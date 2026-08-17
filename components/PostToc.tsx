/**
 * Mục lục trong bài, dựng từ các heading cấp 2.
 *
 * Đối thủ mạnh nhất về organic (hoanghamobile) có khối này dưới tên "XEM
 * NHANH", nên người đọc Việt đã quen khuôn. Thứ họ không có mà ta có là FAQ
 * kèm structured data ở cuối bài — mục lục là để bắt kịp, không phải để hơn.
 *
 * Chỉ lấy cấp 2. Trộn cả cấp 3 vào thì một bài mười lăm heading sẽ có mục lục
 * dài hơn phần mở bài, và mục lục dài thì không ai đọc.
 *
 * Thuần HTML, không JS: không có trạng thái cuộn, không tô sáng mục đang xem.
 * Toàn bộ site xuất tĩnh, và một mục lục có neo hoạt động đã làm xong việc của
 * nó rồi.
 */
export function PostToc({
  items,
}: {
  items: readonly { id: string; text: string }[];
}) {
  // Mục lục hai dòng thì không giúp gì mà vẫn chiếm chỗ. Sàn ba mục trùng đúng
  // MIN_H2 trong lib/knowledge-schema.ts, nên trên thực tế nhánh này không bao
  // giờ chạy — giữ lại để component không phụ thuộc vào việc schema giữ nguyên.
  if (items.length < 3) return null;

  return (
    <nav aria-label="Mục lục bài viết" className="mt-8 border-l border-rule pl-5">
      <p className="text-sm text-ink-faint">Trong bài này</p>
      <ol className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-ink-soft underline decoration-rule underline-offset-2 hover:text-input hover:decoration-input"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
