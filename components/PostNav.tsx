import Link from "next/link";
import type { PostNavRef } from "@/lib/knowledge-schema";

/**
 * Điều hướng Bài trước / Bài sau trong chuỗi bài của một cụm.
 *
 * Đặt ở CẢ đầu và cuối bài. Ở cuối là chỗ hiển nhiên — đọc xong thì đi tiếp.
 * Ở đầu thì kém hiển nhiên hơn nhưng quan trọng không kém: phần lớn người đọc
 * vào thẳng một bài từ Google chứ không đi từ trang cụm, và nhiều người trong
 * số đó vào nhầm bài. Một dải điều hướng ngay trên đầu cho họ biết mình đang ở
 * đâu trong mạch, và cho họ lối sang bài đúng mà không phải quay ra.
 *
 * Không có JS: chỉ là hai thẻ Link. Toàn bộ khu này xuất tĩnh.
 */
export function PostNav({
  prev,
  next,
  position,
  variant = "day-du",
}: {
  prev: PostNavRef | null;
  next: PostNavRef | null;
  position: { index: number; total: number };
  /** "gon" cho dải trên đầu bài, "day-du" cho dải cuối bài. */
  variant?: "gon" | "day-du";
}) {
  if (!prev && !next) return null;

  const compact = variant === "gon";

  return (
    <nav
      aria-label="Điều hướng trong chuỗi bài"
      className={
        compact
          ? "flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-rule py-3 text-sm"
          : "mt-24 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2"
      }
    >
      {compact ? (
        <>
          {prev && (
            <Link href={prev.href} className="text-ink-soft hover:text-input">
              ← Bài {prev.order}
            </Link>
          )}
          <span className="cell-ref text-xs text-ink-faint">
            Bài {position.index}/{position.total}
          </span>
          {next && (
            <Link
              href={next.href}
              className="ml-auto text-ink-soft hover:text-input"
            >
              Bài {next.order} →
            </Link>
          )}
        </>
      ) : (
        <>
          {/*
            Ô rỗng khi không có bài trước: lưới hairline để nền `rule` lộ qua
            khe, nên bỏ trống một nửa sẽ phơi ra mảng xám. Đây là cùng lý do
            cardGridClass() phải cắt số cột theo số phần tử thật
            (components/TemplateCard.tsx:5-13).
          */}
          {prev ? (
            <Link href={prev.href} className="block bg-paper p-6 hover:bg-panel">
              <span className="text-sm text-ink-faint">← Bài {prev.order}</span>
              <span className="mt-1 block font-medium text-balance">
                {prev.h1}
              </span>
            </Link>
          ) : (
            <div className="bg-paper p-6">
              <span className="text-sm text-ink-faint">
                Đây là bài mở đầu của cụm
              </span>
            </div>
          )}

          {next ? (
            <Link
              href={next.href}
              className="block bg-paper p-6 text-right hover:bg-panel"
            >
              <span className="text-sm text-ink-faint">Bài {next.order} →</span>
              <span className="mt-1 block font-medium text-balance">
                {next.h1}
              </span>
            </Link>
          ) : (
            <div className="bg-paper p-6 text-right">
              <span className="text-sm text-ink-faint">
                Đây là bài cuối của cụm
              </span>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
