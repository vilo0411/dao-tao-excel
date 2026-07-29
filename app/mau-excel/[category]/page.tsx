import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCta } from "@/components/CourseCta";
import { SystemCard } from "@/components/SystemCard";
import { cardGridClass, TemplateCard } from "@/components/TemplateCard";
import { getTemplatesByCategory } from "@/lib/templates";
import {
  getPopulatedCategories,
  getSystemsByCategory,
  toSystemCardData,
} from "@/lib/systems";
import { absoluteUrl, CATEGORIES, isCategorySlug } from "@/lib/site";

type Params = { category: string };

export const dynamicParams = false;

/**
 * Chỉ dựng nhóm việc đã có nội dung. Nhóm rỗng thành 404 chứ không thành một
 * trang chỉ có h1 và một câu mô tả — xem getPopulatedCategories() để biết vì
 * sao loại khỏi sitemap thôi là chưa đủ.
 */
export function generateStaticParams(): Params[] {
  return getPopulatedCategories().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategorySlug(category)) return {};

  const meta = CATEGORIES[category];
  return {
    title: `Mẫu Excel ${meta.name} miễn phí`,
    description: meta.description,
    alternates: { canonical: absoluteUrl(`/mau-excel/${category}`) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();

  const meta = CATEGORIES[category];
  const templates = getTemplatesByCategory(category);
  const systems = getSystemsByCategory(category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Trang chủ", item: absoluteUrl("/") },
      { name: "Mẫu Excel", item: absoluteUrl("/mau-excel") },
      { name: meta.name, item: absoluteUrl(`/mau-excel/${category}`) },
    ].map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-5 py-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-input">Trang chủ</Link>
            </li>
            <li aria-hidden className="text-ink-faint">/</li>
            <li>
              <Link href="/mau-excel" className="hover:text-input">Thư viện file</Link>
            </li>
          </ol>
        </nav>

        <h1 className="font-display mt-6 text-4xl leading-[1.05] sm:text-5xl">
          File Excel {meta.name}
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {meta.description}
        </p>

        {/* Bộ file đứng trên lưới file lẻ: người vào nhóm việc thường đang tìm
            cách làm cả quy trình, không phải một file đơn. */}
        {systems.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl">Bộ file của nhóm này</h2>
            {/* Trang thư viện giờ chỉ dẫn tới nghề, không giải thích bộ file là
                gì nữa — nên câu giải thích đó phải đứng ở đây. */}
            <p className="mt-3 max-w-prose text-ink-soft">
              Mỗi bộ gom các file chạy chung một quy trình, kèm sơ đồ chỉ rõ file
              nào nối vào file nào.
            </p>
            <ul className={`mt-5 ${cardGridClass(systems.length)}`}>
              {systems.map((system) => (
                <SystemCard key={system.slug} system={toSystemCardData(system)} />
              ))}
            </ul>
          </section>
        )}

        {templates.length > 0 ? (
          <ul className={`mt-10 ${cardGridClass(templates.length)}`}>
            {templates.map((template) => (
              <TemplateCard key={template.slug} template={template} />
            ))}
          </ul>
        ) : (
          <p className="mt-10 rounded-md border border-rule bg-panel p-6 text-ink-soft">
            Nhóm này tôi đang dựng, chưa có file nào.
          </p>
        )}

        <div className="mt-24">
          <CourseCta
            target={meta.defaultCta}
            text={`Muốn tự dựng bộ file ${meta.name.toLowerCase()} của riêng mình?`}
            content={`category:${category}`}
            campaign="category-hub"
          />
        </div>
      </div>
    </>
  );
}
