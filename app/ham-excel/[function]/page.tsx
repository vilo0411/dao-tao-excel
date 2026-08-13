import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AuthorByline } from "@/components/Author";
import { cardGridClass } from "@/components/TemplateCard";
import { VideoTipSection } from "@/components/VideoTipSection";
import {
  getAllFunctions,
  getFunction,
  type FunctionUsage,
} from "@/lib/functions";
import { absoluteUrl } from "@/lib/site";
import { getVideosForFunction } from "@/lib/videos";

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

/**
 * Gom usage phẳng thành hai tầng: nhóm việc → file.
 *
 * Đây là toàn bộ lý do trang này đọc được. Hàm IF có 169 usage trải trên 37
 * file; in phẳng ra thì mỗi mục lặp lại nguyên cái tên file dài (“Mẫu Excel
 * bảng chấm công nhân viên theo tháng...”) và người đọc phải tự nhận ra là bốn
 * mục liền nhau đang nói về cùng một file. Gom lại thì tên file xuất hiện đúng
 * một lần, còn phần chữ còn lại là thứ thật sự khác nhau: công thức và ghi chú.
 *
 * Xếp theo số công thức giảm dần ở cả hai tầng — file dùng hàm này dày nhất là
 * ví dụ tốt nhất, nên nó phải nằm trên cùng và là cái được mở sẵn.
 */
type TemplateBucket = {
  slug: string;
  href: string;
  h1: string;
  usages: FunctionUsage[];
};

type CategoryBucket = {
  name: string;
  templates: TemplateBucket[];
  usageCount: number;
};

function groupUsages(usages: FunctionUsage[]): CategoryBucket[] {
  const byCategory = new Map<string, Map<string, TemplateBucket>>();

  for (const usage of usages) {
    let templates = byCategory.get(usage.categoryName);
    if (!templates) {
      templates = new Map();
      byCategory.set(usage.categoryName, templates);
    }

    let bucket = templates.get(usage.templateSlug);
    if (!bucket) {
      bucket = {
        slug: usage.templateSlug,
        href: usage.templateHref,
        h1: usage.templateH1,
        usages: [],
      };
      templates.set(usage.templateSlug, bucket);
    }
    bucket.usages.push(usage);
  }

  return [...byCategory]
    .map(([name, templates]) => {
      const list = [...templates.values()].sort(
        (a, b) => b.usages.length - a.usages.length,
      );
      return {
        name,
        templates: list,
        usageCount: list.reduce((sum, t) => sum + t.usages.length, 0),
      };
    })
    .sort((a, b) => b.templates.length - a.templates.length);
}

/**
 * Tô đúng chỗ hàm đang được nói tới trong công thức thật.
 *
 * Công thức trong file là công thức nghiệp vụ đầy đủ — `=IF(C2="","",IFERROR(
 * J2/E2,0))` — nên trên trang hàm IF, phần lớn ký tự người đọc thấy KHÔNG phải
 * thứ họ vào đây để xem. Đẩy cả công thức về sắc chữ chìm rồi chỉ nhấn các lần
 * hàm này xuất hiện thì mắt bắt được nó ngay, mà công thức vẫn in nguyên vẹn.
 *
 * `\b` + bắt buộc có `(` ngay sau nên IF không ăn nhầm vào IFERROR.
 */
function markFunction(formula: string, name: string): ReactNode[] {
  const pattern = new RegExp(`\\b${name}\\s*\\(`, "g");
  const parts: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(formula)) !== null) {
    if (match.index > cursor) parts.push(formula.slice(cursor, match.index));
    parts.push(
      <span
        key={match.index}
        className="bg-computed/10 text-computed font-semibold"
      >
        {match[0]}
      </span>,
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < formula.length) parts.push(formula.slice(cursor));
  return parts;
}

function UsageRow({ usage, name }: { usage: FunctionUsage; name: string }) {
  return (
    <div>
      <p className="text-sm font-medium">
        {usage.columnHeader}
        <span className="font-normal text-ink-faint">
          {" · sheet "}
          {usage.sheetName}
        </span>
      </p>
      <code className="mt-2 block overflow-x-auto bg-panel px-3 py-2 font-mono text-xs whitespace-pre text-ink-soft">
        {markFunction(usage.formula, name)}
      </code>
      <p className="mt-2 text-sm text-ink-soft">{usage.note}</p>
    </div>
  );
}

function FunctionArticle({ slug }: { slug: string }) {
  const fn = getFunction(slug)!;
  const related = getAllFunctions()
    .filter((f) => f.group === fn.group && f.slug !== fn.slug)
    .slice(0, 4);
  const templateCount = new Set(fn.usages.map((u) => u.templateSlug)).size;
  const categories = groupUsages(fn.usages);
  const videos = getVideosForFunction(fn.name);

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

        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {fn.definition}
        </p>

        {/*
          Cú pháp dựng đúng thanh công thức của SheetPreview: hộp tên ô, ô fx,
          rồi tới công thức. Người đọc đã học quy ước này ở bảng preview đầu
          tiên của site, nên ở đây nó tự nói "đây là thứ bạn gõ vào ô" mà không
          cần thêm một dòng chữ nào.
        */}
        <div className="mt-8 flex items-stretch border border-rule bg-panel text-sm">
          <span className="cell-ref flex w-16 shrink-0 items-center justify-center border-r border-rule px-2 py-2 text-xs text-ink-soft">
            {fn.name}
          </span>
          <span className="flex shrink-0 items-center border-r border-rule px-3 py-2 font-mono text-xs text-ink-faint italic">
            fx
          </span>
          <span className="flex min-w-0 flex-1 items-center overflow-x-auto px-3 py-2 font-mono text-xs text-computed">
            {fn.syntax}
          </span>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {[
            { label: "File dùng hàm này", value: templateCount },
            { label: "Công thức thật", value: fn.usages.length },
            { label: "Nhóm việc", value: categories.length },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-ink-faint">{stat.label}</dt>
              <dd className="cell-ref mt-0.5 text-2xl tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <h2 className="font-display mt-24 text-3xl">
          {fn.name} được dùng thế nào trong {templateCount} file thật
        </h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          Đây là công thức thật, đúng ô nó nằm, và lời giải thích lấy nguyên từ
          file bạn có thể tải về ngay. Mỗi file đứng thành một khối — bấm vào
          tên file để mở phần công thức của nó.
        </p>

        {/* Nhảy thẳng tới nhóm việc của mình, thay vì cuộn qua hai nhóm không
            liên quan. Chỉ có nghĩa khi hàm trải trên nhiều nhóm. */}
        {categories.length > 1 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <li key={category.name}>
                <a
                  href={`#nhom-${index + 1}`}
                  className="inline-block rounded-sm border border-rule px-3 py-1.5 text-sm text-ink-soft hover:bg-panel"
                >
                  {category.name}
                  <span className="cell-ref ml-2 text-xs text-ink-faint tabular-nums">
                    {category.templates.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {categories.map((category, categoryIndex) => (
          <section
            key={category.name}
            id={`nhom-${categoryIndex + 1}`}
            className="mt-14 scroll-mt-8"
          >
            <h3 className="font-display flex flex-wrap items-baseline gap-x-3 text-2xl">
              {category.name}
              <span className="cell-ref text-sm text-ink-faint tabular-nums">
                {category.templates.length} file · {category.usageCount} công
                thức
              </span>
            </h3>

            <ul className="mt-5 divide-y divide-rule overflow-hidden rounded-md border border-rule bg-paper">
              {category.templates.map((template, templateIndex) => (
                <li key={template.slug}>
                  {/*
                    <details> chứ không phải component client: site xuất tĩnh,
                    và nội dung bên trong vẫn nằm nguyên trong HTML nên Google
                    đọc được hết dù đang đóng.

                    File dày công thức nhất của mỗi nhóm mở sẵn — một trang mà
                    mọi khối đều đóng thì đọc ra là trang rỗng.
                  */}
                  <details className="group" open={templateIndex === 0}>
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 hover:bg-panel [&::-webkit-details-marker]:hidden">
                      <span
                        aria-hidden
                        className="mt-1 text-xs text-ink-faint transition-transform group-open:rotate-90"
                      >
                        ▶
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-balance">
                          {template.h1}
                        </span>
                        <span className="mt-1 block text-sm text-ink-faint">
                          {template.usages.length} công thức dùng {fn.name}
                        </span>
                      </span>
                    </summary>

                    <div className="space-y-6 border-t border-rule px-5 py-5">
                      {template.usages.map((usage, index) => (
                        <UsageRow
                          key={`${usage.sheetName}-${usage.columnHeader}-${index}`}
                          usage={usage}
                          name={fn.name}
                        />
                      ))}

                      <p className="pt-1">
                        <Link
                          href={template.href}
                          className="text-sm font-medium text-ink hover:text-input"
                        >
                          Mở file, xem cả bảng →
                        </Link>
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <VideoTipSection
          videos={videos}
          heading={`Xem hàm ${fn.name} chạy trong 30 giây`}
        />

        {related.length > 0 && (
          <>
            <h2 className="font-display mt-24 text-3xl">Hàm liên quan</h2>
            <ul className={`mt-5 ${cardGridClass(related.length)}`}>
              {related.map((item) => (
                <li key={item.slug} className="bg-paper">
                  <Link
                    href={`/ham-excel/${item.slug}`}
                    className="flex h-full flex-col p-5 hover:bg-panel"
                  >
                    <span className="cell-ref text-sm text-computed">
                      {item.name}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-ink-faint">
                      {item.syntax}
                    </span>
                    <span className="mt-3 block text-sm text-ink-soft">
                      {item.definition}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <section className="mt-24 rounded-lg bg-surface-strong p-10 sm:p-12">
          <h2 className="font-display max-w-2xl text-3xl text-balance">
            Muốn xem cả file chứ không chỉ một ô?
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Mọi công thức ở trên trích từ một file mẫu tải được ngay, không cần
            để lại email.
          </p>
          <Link
            href="/mau-excel"
            className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:bg-ink/85"
          >
            Xem thư viện file Excel
          </Link>
        </section>

        <div className="mt-12">
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
