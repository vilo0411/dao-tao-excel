import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { CourseCta } from "@/components/CourseCta";
import { FormulaTable, SheetPreview } from "@/components/SheetPreview";
import {
  getAllTemplates,
  getRelatedTemplates,
  getTemplate,
} from "@/lib/templates";
import {
  absoluteUrl,
  CATEGORIES,
  withBasePath,
  type CategorySlug,
} from "@/lib/site";

type Params = { category: string; slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllTemplates().map((t) => ({
    category: t.category,
    slug: t.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const template = getTemplate(category, slug);
  if (!template) return {};

  const url = absoluteUrl(template.href);
  return {
    // `absolute` để không bị nối thêm "| Mẫu Excel" từ template ở layout gốc:
    // metaTitle đã được schema giới hạn 60 ký tự, nối thêm sẽ vượt ngưỡng
    // hiển thị của Google và lặp lại tên site hai lần.
    title: { absolute: template.metaTitle },
    description: template.metaDesc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: template.metaTitle,
      description: template.metaDesc,
      modifiedTime: template.updatedAt,
    },
  };
}

const DIFFICULTY_LABEL = {
  "co-ban": "Cơ bản",
  "trung-cap": "Trung cấp",
  "nang-cao": "Nâng cao",
} as const;

export default async function TemplatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, slug } = await params;
  const template = getTemplate(category, slug);
  if (!template) notFound();

  const related = getRelatedTemplates(template);
  const categoryName = CATEGORIES[category as CategorySlug].name;

  // JSON-LD: site HVS hiện không có structured data ở bất kỳ trang nào, nên
  // đây là một trong số ít chỗ ta hơn được họ mà không tốn gì.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: template.h1,
        description: template.metaDesc,
        url: absoluteUrl(template.href),
        inLanguage: "vi-VN",
        dateModified: template.updatedAt,
        encodingFormat:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        learningResourceType: "Excel template",
        isAccessibleForFree: true,
        associatedMedia: {
          "@type": "MediaObject",
          contentUrl: absoluteUrl(template.downloadUrl),
          encodingFormat:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Trang chủ", item: absoluteUrl("/") },
          { name: "Mẫu Excel", item: absoluteUrl("/mau-excel") },
          { name: categoryName, item: absoluteUrl(`/mau-excel/${category}`) },
          { name: template.h1, item: absoluteUrl(template.href) },
        ].map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: template.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
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

      <article className="mx-auto max-w-3xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-input">Trang chủ</Link>
            </li>
            <li aria-hidden className="text-ink-faint">/</li>
            <li>
              <Link href="/mau-excel" className="hover:text-input">Thư viện file</Link>
            </li>
            <li aria-hidden className="text-ink-faint">/</li>
            <li>
              <Link href={`/mau-excel/${category}`} className="hover:text-input">
                {categoryName}
              </Link>
            </li>
          </ol>
        </nav>

        <h1 className="font-display mt-5 text-3xl leading-[1.15] font-bold text-balance sm:text-4xl">
          {template.h1}
        </h1>

        <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
          <li>{DIFFICULTY_LABEL[template.difficulty]}</li>
          <li aria-hidden className="text-ink-faint">·</li>
          <li>{categoryName}</li>
          <li aria-hidden className="text-ink-faint">·</li>
          {template.functions.map((fn) => (
            <li key={fn} className="cell-ref text-xs text-computed">
              {fn}
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {template.intro}
        </p>

        <div className="mt-8">
          <a
            href={withBasePath(template.downloadUrl)}
            download
            className="inline-block bg-ink px-6 py-3 text-lg font-medium text-paper hover:bg-computed"
          >
            Tải file .xlsx
          </a>
          <p className="mt-3 text-sm text-ink-soft">
            Không cần đăng ký, không cần để lại email.
          </p>
        </div>

        <h2 className="font-display mt-14 text-2xl font-bold">
          Bên trong file có gì
        </h2>
        <div className="mt-5 space-y-10">
          {template.sheets.map((sheet, index) => (
            <SheetPreview
              key={sheet.name}
              sheet={sheet}
              computed={template.computed?.[index]}
            />
          ))}
        </div>

        <h2 className="font-display mt-14 text-2xl font-bold">
          File này làm được gì
        </h2>
        <ul className="mt-5 space-y-3">
          {template.features.map((feature) => (
            <li
              key={feature}
              className="border-l-2 border-rule pl-4 text-ink-soft"
            >
              {feature}
            </li>
          ))}
        </ul>

        <h2 className="font-display mt-14 text-2xl font-bold">
          Từng công thức, giải thích ra
        </h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          Đây là công thức thật trong file bạn vừa tải, kèm ô mà nó nằm. Hiểu
          được chúng thì bạn sửa được file theo việc của mình.
        </p>
        <div className="mt-6 space-y-10">
          {template.sheets.map((sheet) => (
            <FormulaTable key={sheet.name} sheet={sheet} />
          ))}
        </div>

        <h2 className="font-display mt-14 text-2xl font-bold">Cách dùng</h2>
        {/* Đánh số ở đây có nghĩa: các bước phải làm theo đúng thứ tự. */}
        <ol className="mt-5 space-y-5">
          {template.howToUse.map((step, index) => (
            <li key={step.step} className="grid gap-1 sm:grid-cols-[2.5rem_1fr]">
              <span className="cell-ref pt-1 text-sm text-ink-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-medium">{step.step}</p>
                <p className="mt-1 text-ink-soft">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <CourseCta
            target={template.ctaTarget}
            text={template.ctaText}
            content={template.slug}
          />
        </div>

        <h2 className="font-display mt-14 text-2xl font-bold">Hay bị hỏi</h2>
        <dl className="mt-5 divide-y divide-rule border-y border-rule">
          {template.faq.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-2 max-w-prose text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>

        {related.length > 0 && (
          <>
            <h2 className="font-display mt-14 text-2xl font-bold">
              File liên quan
            </h2>
            <ul className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.slug} className="bg-paper">
                  <Link href={item.href} className="block h-full p-5 hover:bg-panel">
                    <span className="font-medium">{item.h1}</span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {item.categoryName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-12 text-sm text-ink-faint">
          Cập nhật{" "}
          <time dateTime={template.updatedAt}>
            {new Date(template.updatedAt).toLocaleDateString("vi-VN")}
          </time>
        </p>

        <div className="mt-6">
          <AuthorByline />
        </div>
      </article>
    </>
  );
}
