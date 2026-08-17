import Link from "next/link";
import type { PostCardData } from "@/lib/knowledge-schema";

/**
 * Dải bài viết liên quan, gắn trên trang TEMPLATE và trang HÀM.
 *
 * Đây là chiều link ngược của khu kiến thức. Quan hệ chỉ được khai một chiều
 * trong spec bài (`templateRefs`, `functionRefs`); chiều này do
 * lib/knowledge.ts dựng chỉ mục lúc build. Nhờ vậy thêm một bài là tự có link
 * từ trang template về nó, không ai phải nhớ đi sửa 37 file spec.
 *
 * Trả `null` khi rỗng, và đó là điều kiện để chèn được vào 37 trang template
 * mà 29 trang chưa có bài trỏ về không đổi gì cả — cùng quy ước với
 * VideoTipSection (components/VideoTipSection.tsx:23-25).
 *
 * Là server component, và cố ý không có phần nào cần client: một dải link thì
 * không có lý do gì để tốn JavaScript.
 */
export function RelatedPosts({
  posts,
  heading,
  intro,
}: {
  posts: PostCardData[];
  heading: string;
  intro?: string;
}) {
  if (posts.length === 0) return null;

  return (
    <section>
      <h2 className="font-display mt-24 text-3xl">{heading}</h2>
      {intro && <p className="mt-5 max-w-prose text-ink-soft">{intro}</p>}

      <ul className="mt-5 divide-y divide-rule border-y border-rule">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={post.href} className="group block py-5 hover:bg-panel">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium group-hover:text-input">
                  {post.h1}
                </span>
                {/* Mã lỗi giữ nguyên phương ngữ bảng tính, xem PostCard. */}
                {post.errorTags.map((tag) => (
                  <span key={tag} className="cell-ref text-xs text-flag">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-1 max-w-prose text-sm text-ink-soft">
                {post.metaDesc}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
