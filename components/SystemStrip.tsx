import Link from "next/link";
import { ROLE_SENTENCE, type System, type SystemNode } from "@/lib/systems-schema";

/**
 * Dải "file này nằm ở đâu" trên trang một file lẻ.
 *
 * Người đọc vào đây từ Google với một từ khóa hẹp ("mẫu excel tính lương") và
 * không biết rằng file này chỉ là một mắt trong chuỗi. Dải này nói ra điều đó
 * trước khi họ tải file về rồi phát hiện thiếu số liệu đầu vào.
 *
 * Câu mô tả sinh từ `edges` chứ không viết tay: mô tả lệch với sơ đồ ở trang
 * bộ thì còn tệ hơn là không có mô tả.
 */
export function SystemStrip({
  system,
  node,
}: {
  system: System;
  node: SystemNode;
}) {
  const name = (slug: string) =>
    system.nodes.find((n) => n.slug === slug)?.shortName ?? slug;

  const receives = system.edges.filter((e) => e.to === node.slug);
  const sends = system.edges.filter((e) => e.from === node.slug);

  return (
    <aside className="mt-8 border border-rule bg-panel">
      <p className="border-b border-rule px-4 py-2 font-mono text-xs text-ink-faint">
        FILE NÀY NẰM Ở ĐÂU
      </p>

      <div className="px-4 py-4">
        {/* Chuỗi ô theo đúng thứ tự quy trình, ô đang xem đảo nền. */}
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {system.nodes.map((item, index) => {
            const current = item.slug === node.slug;
            const label = (
              <span className="block px-3 py-1.5 text-sm">{item.shortName}</span>
            );

            return (
              <li key={item.slug} className="flex items-center gap-1">
                {index > 0 && (
                  <span aria-hidden className="px-1 text-ink-faint">
                    →
                  </span>
                )}
                {current ? (
                  <span
                    aria-current="true"
                    className="border border-ink bg-ink text-paper"
                  >
                    {label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="block border border-rule bg-paper hover:border-ink"
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="block border border-dashed border-rule text-ink-faint">
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-4 max-w-prose text-sm text-ink-soft">
          Đây là {ROLE_SENTENCE[node.role]} trong{" "}
          <Link
            href={system.href}
            className="font-medium underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            {system.name}
          </Link>
          .
          {receives.length > 0 && (
            <>
              {" "}
              Nó lấy{" "}
              {receives.map((e, i) => (
                <span key={e.from}>
                  {i > 0 && (i === receives.length - 1 ? " và " : ", ")}
                  {e.label} từ {name(e.from)}
                </span>
              ))}
              .
            </>
          )}
          {sends.length > 0 && (
            <>
              {" "}
              Chạy xong, nó đưa{" "}
              {sends.map((e, i) => (
                <span key={e.to}>
                  {i > 0 && (i === sends.length - 1 ? " và " : ", ")}
                  {e.label} sang {name(e.to)}
                </span>
              ))}
              .
            </>
          )}
        </p>

        {/* Người vào từ một từ khóa hẹp không thể biết là có bản gộp sẵn. Nói ở
            đây, ngay chỗ họ vừa đọc rằng file này còn nối với file khác. */}
        {system.bundleUrl && (
          <p className="mt-3 max-w-prose text-sm text-ink-soft">
            Muốn cả chuỗi tự chạy thì tải{" "}
            <Link
              href={system.href}
              className="font-medium underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              bản gộp một file
            </Link>
            : mọi sheet nối sẵn bằng công thức, sửa một ô là các sheet sau đổi
            theo. File lẻ này vẫn chạy độc lập đầy đủ nếu bạn chỉ cần một bảng.
          </p>
        )}
      </div>
    </aside>
  );
}
