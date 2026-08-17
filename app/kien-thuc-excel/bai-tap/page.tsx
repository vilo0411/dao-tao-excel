import type { Metadata } from "next";
import Link from "next/link";
import { AuthorByline } from "@/components/Author";
import { getAllExercises } from "@/lib/knowledge";
import { breadcrumbList, graph } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";

/**
 * Hub bài tập.
 *
 * Liệt kê đúng số trang đang có. Không có ô "sắp ra mắt" cho những bài lý
 * thuyết chưa kèm bài tập — một danh sách nửa thật nửa hứa hẹn thì người đọc
 * không tin được phần nào, và với Google nó là trang mỏng độn thêm chữ.
 */

export const metadata: Metadata = {
  title: "Bài tập Excel có lời giải — làm ngay trên trình duyệt",
  description:
    "Bài tập Excel kèm dữ liệu chép được, khung thử công thức ngay trên trang, và lời giải giải thích từng bước vì sao viết như vậy.",
  alternates: { canonical: absoluteUrl("/kien-thuc-excel/bai-tap") },
};

export default function ExerciseHubPage() {
  const exercises = getAllExercises();

  const jsonLd = graph(
    {
      "@type": "ItemList",
      name: "Bài tập Excel có lời giải",
      numberOfItems: exercises.length,
      itemListElement: exercises.map((e) => ({
        "@type": "ListItem",
        position: e.order,
        name: e.h1,
        url: absoluteUrl(e.href),
      })),
    },
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
      { name: "Bài tập", path: "/kien-thuc-excel/bai-tap" },
    ]),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-5 py-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <Link href="/" className="hover:text-input">
            Trang chủ
          </Link>
          <span aria-hidden> / </span>
          <Link href="/kien-thuc-excel" className="hover:text-input">
            Kiến thức Excel
          </Link>
        </nav>

        <h1 className="font-display mt-5 text-4xl leading-[1.05] text-balance sm:text-5xl">
          Bài tập Excel có lời giải
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          Mỗi bài tập gồm một bộ dữ liệu chép được vào Excel, vài yêu cầu cụ
          thể, một khung thử công thức ngay trên trang, và lời giải nói rõ vì
          sao viết như vậy chứ không chỉ đưa công thức.
        </p>

        {exercises.length === 0 ? (
          <p className="mt-12 text-ink-soft">Chưa có bài tập nào.</p>
        ) : (
          <ol className="mt-12 divide-y divide-rule border-y border-rule">
            {exercises.map((e) => (
              <li key={e.slug}>
                <Link href={e.href} className="group block py-6 hover:bg-panel">
                  <span className="font-mono text-xs text-ink-faint">
                    Bài tập {e.order}
                  </span>
                  <span className="font-display mt-1 block text-lg font-medium group-hover:text-input">
                    {e.h1}
                  </span>
                  <span className="mt-2 block max-w-prose text-sm text-ink-soft">
                    {e.metaDesc}
                  </span>
                  <span className="mt-2 block font-mono text-xs text-ink-faint">
                    {e.tasks.length} yêu cầu · {e.solution.length} bước lời giải
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-12 max-w-prose text-sm text-ink-faint">
          Danh sách này liệt kê đúng số bài tập đang có. Bài lý thuyết chưa kèm
          bài tập thì không xuất hiện ở đây dưới dạng lời hứa — chúng sẽ được
          thêm vào khi viết xong.
        </p>

        <section className="mt-24 rounded-lg bg-surface-strong p-12">
          <h2 className="font-display text-3xl text-balance">
            Cần hiểu lý thuyết trước khi làm bài?
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Mỗi bài tập đều gắn với một bài giải thích đầy đủ nguyên nhân và
            cách sửa. Bấm vào liên kết trong từng trang bài tập, hoặc mở thẳng
            cụm bài.
          </p>
          <Link
            href="/kien-thuc-excel/loi-excel"
            className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:opacity-85"
          >
            Mở cụm Lỗi Excel
          </Link>
        </section>

        <div className="mt-24">
          <AuthorByline />
        </div>
      </div>
    </>
  );
}
