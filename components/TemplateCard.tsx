import Link from "next/link";
import { SheetThumb } from "@/components/SheetThumb";
import { DIFFICULTY_LABEL, type TemplateCardData } from "@/lib/schema";

/**
 * Lưới kiểu bảng tính: nền `rule` lộ qua khe 1px giữa các ô để thành đường kẻ,
 * thay vì mỗi card một viền riêng.
 *
 * Hệ quả là một ô trống không im lặng — nó phơi nguyên mảng nền xám. Nên số
 * cột phải cắt theo số phần tử thật, không khai báo cứng 3 cột rồi hy vọng đủ
 * file. Thư viện hiện mới có 2 file, và lúc nào cũng sẽ có nhóm lẻ số.
 *
 * Trả về chuỗi class đầy đủ chứ không ghép động, vì Tailwind quét mã nguồn
 * theo văn bản nguyên vẹn — tên class ghép lúc chạy sẽ không được sinh ra.
 */
export function cardGridClass(count: number): string {
  const base =
    "grid gap-px overflow-hidden rounded-md border border-rule bg-rule";
  if (count <= 1) return base;
  if (count === 2) return `${base} sm:grid-cols-2`;
  return `${base} sm:grid-cols-2 lg:grid-cols-3`;
}

/**
 * Nhận `TemplateCardData` chứ không phải `Template` đầy đủ: bộ lọc ở trang thư
 * viện là component client, nên mọi thứ truyền vào card đều đi xuống HTML.
 */
export function TemplateCard({ template }: { template: TemplateCardData }) {
  return (
    <li className="group bg-paper">
      <Link
        href={template.href}
        className="flex h-full flex-col p-6 hover:bg-panel"
      >
        <h3 className="font-display font-medium text-balance">{template.h1}</h3>
        <p className="mt-3 flex-1 text-sm text-ink-soft">{template.metaDesc}</p>

        {/*
          Dải cột đứng SAU đoạn mô tả chứ không đứng đầu card. Đặt lên đầu thì
          nó thành hình minh họa cho một cái tiêu đề chưa ai đọc, và cả lưới sáu
          card biến thành sáu mảng ô màu na ná nhau — mắt không còn bám vào tên
          file nữa. Đặt ở đây thì thứ tự đọc là: file này làm gì → gồm những cột
          nào → mở ra.
        */}
        {template.thumb && <SheetThumb map={template.thumb} />}

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Hàm được trích tự động từ công thức thật trong file. */}
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {template.functions.map((fn) => (
              <li key={fn} className="cell-ref text-xs text-computed">
                {fn}
              </li>
            ))}
          </ul>
          <span className="ml-auto rounded-sm border border-rule px-2 py-0.5 text-xs text-ink-faint">
            {DIFFICULTY_LABEL[template.difficulty]}
          </span>
        </div>

        {/*
          Mũi tên chỉ đổi màu khi rê chuột, không trượt sang ngang: card nằm
          trong lưới khít 1px, một chi tiết dịch chuyển sẽ đội cả hàng lên.
        */}
        <span
          aria-hidden
          className="mt-4 text-sm text-ink-faint transition-colors group-hover:text-ink"
        >
          Mở file →
        </span>
      </Link>
    </li>
  );
}
