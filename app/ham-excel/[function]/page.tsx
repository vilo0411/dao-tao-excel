import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { cardGridClass } from "@/components/TemplateCard";
import { getAllFunctions, getFunction } from "@/lib/functions";
import { absoluteUrl } from "@/lib/site";

type Params = { function: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllFunctions().map((fn) => ({ function: fn.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { function: slug } = await params;
  const fn = getFunction(slug);
  if (!fn) return {};

  const url = absoluteUrl(`/ham-excel/${fn.slug}`);
  const title = `Hàm ${fn.name} trong Excel — cú pháp và ví dụ thật`;
  const description = `${fn.definition} Xem công thức thật dùng hàm ${fn.name} trong các file Excel mẫu, kèm giải thích từng ô.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title, description },
  };
}

function FunctionArticle({ slug }: { slug: string }) {
  const fn = getFunction(slug)!;
  const related = getAllFunctions()
    .filter((f) => f.group === fn.group && f.slug !== fn.slug)
    .slice(0, 4);
  const templateCount = new Set(fn.usages.map((u) => u.templateSlug)).size;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: `Hàm ${fn.name}`,
        description: fn.definition,
        url: absoluteUrl(`/ham-excel/${fn.slug}`),
        inDefinedTermSet: absoluteUrl("/ham-excel"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Trang chủ", item: absoluteUrl("/") },
          { name: "Hàm Excel", item: absoluteUrl("/ham-excel") },
          { name: fn.name, item: absoluteUrl(`/ham-excel/${fn.slug}`) },
        ].map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-5 py-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-input">
                Trang chủ
              </Link>
            </li>
            <li aria-hidden className="text-ink-faint">
              /
            </li>
            <li>
              <Link href="/ham-excel" className="hover:text-input">
                Hàm Excel
              </Link>
            </li>
          </ol>
        </nav>

        <p className="cell-ref mt-6 text-xs text-ink-faint uppercase">
          {fn.group}
        </p>
        <h1 className="font-display mt-2 text-4xl leading-[1.05] text-balance sm:text-5xl">
          Hàm {fn.name} trong Excel là gì
        </h1>

        <div className="mt-6 border border-rule bg-panel px-4 py-3 font-mono text-sm text-computed">
          {fn.syntax}
        </div>

        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {fn.definition}
        </p>

        <h2 className="font-display mt-24 text-3xl">
          {fn.name} được dùng thế nào trong {templateCount} file thật
        </h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          Đây là công thức thật, đúng ô nó nằm, và lời giải thích lấy nguyên
          từ file bạn có thể tải về ngay bên dưới.
        </p>
        <ul className="mt-6 space-y-6">
          {fn.usages.map((usage, index) => (
            <li
              key={`${usage.templateSlug}-${usage.columnHeader}-${index}`}
              className="border-l-2 border-rule pl-5"
            >
              <p className="text-sm text-ink-faint">
                <Link
                  href={usage.templateHref}
                  className="font-medium text-ink hover:text-input"
                >
                  {usage.templateH1}
                </Link>
                {" · "}
                {usage.categoryName}
                {" · "}
                {usage.sheetName}
                {" · cột "}
                {usage.columnHeader}
              </p>
              <pre className="mt-2 overflow-x-auto bg-panel px-3 py-2 font-mono text-xs text-computed">
                {usage.formula}
              </pre>
              <p className="mt-2 max-w-prose text-ink-soft">{usage.note}</p>
            </li>
          ))}
        </ul>

        {related.length > 0 && (
          <>
            <h2 className="font-display mt-24 text-3xl">Hàm liên quan</h2>
            <ul className={`mt-5 ${cardGridClass(related.length)}`}>
              {related.map((item) => (
                <li key={item.slug} className="bg-paper">
                  <Link
                    href={`/ham-excel/${item.slug}`}
                    className="block h-full p-5 hover:bg-panel"
                  >
                    <span className="cell-ref text-sm text-computed">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {item.definition}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-24 max-w-prose text-ink-soft">
          Muốn xem cả file chứ không chỉ một ô?{" "}
          <Link
            href="/mau-excel"
            className="text-input font-medium underline decoration-input/40 underline-offset-2 hover:decoration-input"
          >
            Xem thư viện file Excel
          </Link>
          .
        </p>

        <div className="mt-6">
          <AuthorByline />
        </div>
      </article>
    </>
  );
}

export default async function FunctionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { function: slug } = await params;
  if (!getFunction(slug)) notFound();

  return <FunctionArticle slug={slug} />;
}
