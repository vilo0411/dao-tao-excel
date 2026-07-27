import Link from "next/link";
import type { Metadata } from "next";
import { AuthorCard } from "@/components/Author";
import { TemplateCard } from "@/components/TemplateCard";
import { getAllTemplates } from "@/lib/templates";
import { absoluteUrl, CATEGORIES, CATEGORY_SLUGS } from "@/lib/site";
import { AUTHOR } from "@/lib/author";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  const templates = getAllTemplates();

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <section className="max-w-2xl">
        <h1 className="font-display text-4xl leading-[1.1] font-bold text-balance sm:text-5xl">
          File Excel tôi dựng cho việc của mình
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          Tải một file mẫu về là chuyện dễ. Sửa được nó khi sếp đổi yêu cầu mới
          là chuyện khó, và đó là lúc phần lớn file tải trên mạng bó tay vì
          không ai nói cho bạn biết bên trong nó chạy bằng gì.
        </p>
        <p className="mt-4 max-w-prose text-lg text-ink-soft">
          Nên ở đây tôi làm ngược lại: mỗi file đều phơi thẳng công thức ra, kèm
          giải thích từng dòng.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/mau-excel"
            className="bg-ink px-6 py-3 font-medium text-paper hover:bg-input"
          >
            Xem thư viện file
          </Link>
          <Link
            href="/khoa-hoc-excel"
            className="border border-rule px-6 py-3 font-medium hover:border-ink"
          >
            Khóa học tôi giới thiệu
          </Link>
        </div>
      </section>

      {templates.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold">File mới nhất</h2>
          <ul className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {templates.slice(0, 6).map((template) => (
              <TemplateCard key={template.slug} template={template} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-20">
        <h2 className="font-display text-2xl font-bold">Xếp theo công việc</h2>
        <ul className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-3">
          {CATEGORY_SLUGS.map((slug) => (
            <li key={slug} className="bg-paper">
              <Link
                href={`/mau-excel/${slug}`}
                className="block h-full p-6 hover:bg-panel"
              >
                <h3 className="font-display font-bold">
                  {CATEGORIES[slug].name}
                </h3>
                <p className="mt-2 text-sm text-ink-soft">
                  {CATEGORIES[slug].description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-20">
        <h2 className="sr-only">Về {AUTHOR.name}</h2>
        <AuthorCard />
      </div>
    </div>
  );
}
