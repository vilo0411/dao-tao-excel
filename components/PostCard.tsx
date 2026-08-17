import Link from "next/link";
import { DIFFICULTY_LABEL, type PostCardData } from "@/lib/knowledge-schema";

/**
 * Thẻ bài viết trong lưới của trang cụm và trang hub.
 *
 * Không tái dùng TemplateCard được: thẻ đó gắn chặt với TemplateCardData —
 * dải tên cột, danh sách hàm, nút "Mở file". Một bài viết không có cột nào để
 * khoe, và thứ nó cần khoe là mã lỗi nó chữa.
 *
 * Nhận PostCardData chứ không phải Post đầy đủ, vì đúng lý do đã ghi ở
 * lib/templates.ts:185-197: trang cụm dựng 15 thẻ, và truyền cả `body` vào đó
 * là nhét 15 mảng khối nhiều KB vào HTML để rồi không dùng tới.
 */
export function PostCard({ post }: { post: PostCardData }) {
  return (
    <li className="group bg-paper">
      <Link href={post.href} className="flex h-full flex-col p-6 hover:bg-panel">
        {/*
          Số thứ tự bài đứng trước tiêu đề. Đây là khu duy nhất trên site có
          nội dung xếp theo chuỗi, và số thứ tự là thứ nói ra điều đó ngay từ
          lưới thẻ — người đọc thấy được mình đang ở đoạn nào của mạch bài chứ
          không phải một đống bài rời.
        */}
        <span className="cell-ref text-xs text-ink-faint">Bài {post.order}</span>

        <h3 className="font-display mt-2 font-medium text-balance">{post.h1}</h3>
        <p className="mt-3 flex-1 text-sm text-ink-soft">{post.metaDesc}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          {/*
            Mã lỗi dùng phương ngữ bảng tính và màu `flag` — đúng nghĩa gốc của
            token đó trong DESIGN.md (`sheet-error-cell`): chữ của một ô đang
            lỗi. Không phải màu trang trí mượn tạm.
          */}
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {post.errorTags.map((tag) => (
              <li key={tag} className="cell-ref text-xs text-flag">
                {tag}
              </li>
            ))}
          </ul>
          <span className="ml-auto rounded-sm border border-rule px-2 py-0.5 text-xs text-ink-faint">
            {DIFFICULTY_LABEL[post.difficulty]}
          </span>
        </div>

        {/* Không trượt ngang khi hover: thẻ nằm trong lưới khít 1px. */}
        <span
          aria-hidden
          className="mt-4 text-sm text-ink-faint transition-colors group-hover:text-ink"
        >
          Đọc bài →
        </span>
      </Link>
    </li>
  );
}
