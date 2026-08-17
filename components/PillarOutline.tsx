import Link from "next/link";
import type { PostCardData } from "@/lib/knowledge-schema";

/**
 * Mục lục toàn cụm, hiện trên mọi trang bài của cụm đó.
 *
 * Đây là thứ biến 15 trang rời thành một cụm mà Google đọc được cả thứ tự lẫn
 * độ đầy đủ: mỗi bài nhận thêm 14 link ngữ cảnh trỏ sang anh em của nó, và
 * toàn bộ đều là link thật trong HTML chứ không phải menu dựng bằng JS.
 *
 * Ở desktop là cột trái dính theo cuộn. Dưới 1024px nó sập thành một
 * <details> gập lại ở đầu bài — không phải để tiết kiệm chỗ cho đẹp, mà vì
 * 15 dòng mục lục nằm trên đầu trang di động sẽ đẩy phần mở bài xuống dưới
 * màn hình đầu tiên.
 *
 * Không JS: <details> là thẻ gốc HTML, có sẵn hành vi gập và có sẵn
 * accessibility — cùng lựa chọn đã ghi ở components/Faq.tsx.
 */
export function PillarOutline({
  posts,
  currentSlug,
  pillarName,
  pillarHref,
}: {
  posts: PostCardData[];
  currentSlug: string;
  pillarName: string;
  pillarHref: string;
}) {
  const list = (
    <ol className="mt-3 space-y-1 text-sm">
      {posts.map((post) => {
        const current = post.slug === currentSlug;
        return (
          <li key={post.slug}>
            {current ? (
              /*
                Bài đang đọc KHÔNG phải link. Một link trỏ về chính trang đang
                mở là link không đi đâu cả, và với người dùng bàn phím thì nó
                là một điểm dừng tab vô nghĩa.
              */
              <span
                aria-current="page"
                className="flex gap-2 bg-ink px-2 py-1 text-paper"
              >
                <span className="cell-ref shrink-0 opacity-60">{post.order}</span>
                <span>{post.h1}</span>
              </span>
            ) : (
              <Link
                href={post.href}
                className="flex gap-2 px-2 py-1 text-ink-soft hover:bg-panel hover:text-input"
              >
                <span className="cell-ref shrink-0 text-ink-faint">
                  {post.order}
                </span>
                <span>{post.h1}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );

  const heading = (
    <Link href={pillarHref} className="font-display hover:text-input">
      {pillarName}
    </Link>
  );

  return (
    <>
      {/* Bản di động: gập lại, mở sẵn ở trạng thái đóng. */}
      <details className="border-y border-rule py-3 lg:hidden">
        <summary className="cursor-pointer text-sm text-ink-soft">
          Cả cụm {pillarName} — {posts.length} bài
        </summary>
        {list}
      </details>

      {/* Bản desktop: cột trái dính theo cuộn. */}
      <nav
        aria-label={`Mục lục cụm ${pillarName}`}
        className="hidden lg:block lg:sticky lg:top-8 lg:self-start"
      >
        <p className="text-sm text-ink-faint">Cả cụm</p>
        <p className="mt-1">{heading}</p>
        {list}
      </nav>
    </>
  );
}
