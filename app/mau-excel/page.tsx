import type { Metadata } from "next";
import Link from "next/link";
import { TemplateCard } from "@/components/TemplateCard";
import { getAllTemplates, getTemplatesByCategory } from "@/lib/templates";
import { absoluteUrl, CATEGORIES, CATEGORY_SLUGS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thư viện mẫu Excel miễn phí có sẵn công thức",
  description:
    "Tổng hợp mẫu Excel tiếng Việt miễn phí cho nhân sự, kế toán và quản lý công việc. Mỗi mẫu có công thức chạy đúng kèm giải thích từng bước.",
  alternates: { canonical: absoluteUrl("/mau-excel") },
};

export default function TemplateIndexPage() {
  const templates = getAllTemplates();

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Thư viện file Excel
      </h1>
      <p className="mt-5 max-w-prose text-lg text-ink-soft">
        {templates.length} file tôi dựng cho công việc của mình, dọn lại rồi để
        đây dùng chung. Tải không cần đăng ký, và mỗi file đều kèm công thức
        được giải thích ra.
      </p>

      {CATEGORY_SLUGS.map((slug) => {
        const items = getTemplatesByCategory(slug);
        if (items.length === 0) return null;

        return (
          <section key={slug} className="mt-16">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
              <h2 className="font-display text-2xl font-bold">
                <Link href={`/mau-excel/${slug}`} className="hover:text-input">
                  {CATEGORIES[slug].name}
                </Link>
              </h2>
              <span className="cell-ref text-sm text-ink-faint">
                {items.length} file
              </span>
            </div>
            <p className="mt-4 max-w-prose text-ink-soft">
              {CATEGORIES[slug].description}
            </p>
            <ul className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
              {items.map((template) => (
                <TemplateCard key={template.slug} template={template} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
