import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCta } from "@/components/CourseCta";
import { TemplateCard } from "@/components/TemplateCard";
import { getTemplatesByCategory } from "@/lib/templates";
import {
  absoluteUrl,
  CATEGORIES,
  CATEGORY_SLUGS,
  isCategorySlug,
} from "@/lib/site";

type Params = { category: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return CATEGORY_SLUGS.map((category) => ({ category }));
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

      <div className="mx-auto max-w-5xl px-5 py-14">
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

        <h1 className="font-display mt-5 text-3xl font-bold sm:text-4xl">
          File Excel {meta.name}
        </h1>
        <p className="mt-5 max-w-prose text-lg text-ink-soft">
          {meta.description}
        </p>

        {templates.length > 0 ? (
          <ul className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.slug} template={template} />
            ))}
          </ul>
        ) : (
          <p className="mt-10 border border-rule bg-panel p-6 text-ink-soft">
            Nhóm này tôi đang dựng, chưa có file nào.
          </p>
        )}

        <div className="mt-14">
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
