type Question = {
  q: string;
  a: string;
};

const QUESTIONS: Question[] = [
  {
    q: "File có thật miễn phí không, có cần để lại email không?",
    a: "Có, và không. Bấm tải là ra file .xlsx ngay, không đăng ký, không email, không tường chắn.",
  },
  {
    q: "Công thức trong file có sửa được không?",
    a: "Được. Không có sheet ẩn hay mật khẩu bảo vệ — mọi ô công thức đều mở để xem và sửa.",
  },
  {
    q: "Dùng được trên Google Sheets không?",
    a: "Được. File không dùng add-in hay macro riêng của Excel, nên mở bằng Google Sheets vẫn tính đúng.",
  },
  {
    q: "File có được cập nhật khi Excel đổi phiên bản không?",
    a: "Có. File nào còn dùng được vẫn được kiểm lại định kỳ; file nào lỗi thời sẽ được ghi rõ trên trang của nó.",
  },
];

/**
 * Dùng <details>/<summary> gốc HTML: có sẵn hành vi accordion, không cần
 * JS, và accessible mặc định — khớp nguyên tắc "hover chỉ là affordance".
 */
export function Faq() {
  return (
    <div className="divide-y divide-rule border-t border-rule">
      {QUESTIONS.map(({ q, a }) => (
        <details key={q} className="py-5">
          <summary className="cursor-pointer list-none font-display text-lg font-medium">
            {q}
          </summary>
          <p className="mt-3 max-w-prose text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  );
}
