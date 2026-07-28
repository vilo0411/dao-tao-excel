import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { CourseCta } from "@/components/CourseCta";
import { SystemMap } from "@/components/SystemMap";
import { cardGridClass } from "@/components/TemplateCard";
import { absoluteUrl, withBasePath } from "@/lib/site";
import {
  getAllSystems,
  getFlowSteps,
  getSystem,
  ROLE_LABEL,
  toMapData,
} from "@/lib/systems";
import { getAllTemplates } from "@/lib/templates";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllSystems().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const system = getSystem(slug);
  if (!system) return {};

  const url = absoluteUrl(system.href);
  return {
    title: { absolute: system.metaTitle },
    description: system.metaDesc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: system.metaTitle,
      description: system.metaDesc,
      modifiedTime: system.updatedAt,
    },
  };
}

export default async function SystemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const system = getSystem(slug);
  if (!system) notFound();

  const steps = getFlowSteps(system);
  const liveNodes = system.nodes.filter((n) => n.status === "live");
  // Tra theo slug chứ không theo category: một bộ hoàn toàn có thể mượn file
  // từ nhóm việc khác (bảng công nợ nằm trong cả quy trình kế toán lẫn bán hàng).
  const templateBySlug = new Map(getAllTemplates().map((t) => [t.slug, t]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Collection",
        name: system.h1,
        description: system.metaDesc,
        url: absoluteUrl(system.href),
        inLanguage: "vi-VN",
        dateModified: system.updatedAt,
        isAccessibleForFree: true,
        // Chỉ khai file đã có. Khai cả node "đang dựng" là hứa với Google một
        // thứ chưa tồn tại, và mọi URL trong đó đều 404.
        numberOfItems: liveNodes.length,
        hasPart: liveNodes.map((node) => ({
          "@type": "CreativeWork",
          name: node.shortName,
          url: absoluteUrl(node.href!),
        })),
      },
      {
        "@type": "ItemList",
        name: system.h1,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: liveNodes.map((node, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: node.shortName,
          item: absoluteUrl(node.href!),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Trang chủ", item: absoluteUrl("/") },
          { name: "Mẫu Excel", item: absoluteUrl("/mau-excel") },
          { name: "Bộ file", item: absoluteUrl("/mau-excel/bo-file") },
          { name: system.h1, item: absoluteUrl(system.href) },
        ].map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: system.faq.map((item) => ({
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

      <article className="mx-auto max-w-5xl px-5 py-24">
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
              <Link href="/mau-excel/bo-file" className="hover:text-input">Bộ file</Link>
            </li>
          </ol>
        </nav>

        <h1 className="font-display mt-6 max-w-3xl text-4xl leading-[1.05] text-balance sm:text-5xl">
          {system.h1}
        </h1>

        <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
          <li>
            <Link
              href={`/mau-excel/${system.category}`}
              className="hover:text-input"
            >
              {system.categoryName}
            </Link>
          </li>
          <li aria-hidden className="text-ink-faint">·</li>
          <li>{system.cadence}</li>
          <li aria-hidden className="text-ink-faint">·</li>
          <li className="cell-ref text-xs tabular-nums">
            {system.liveCount}/{system.totalCount} file đã có
          </li>
        </ul>

        <p className="mt-6 max-w-prose text-lg text-ink-soft">{system.intro}</p>

        {/* Sơ đồ đặt cao: đây là thứ duy nhất trang này có mà trang file lẻ
            không có, và là lý do người đọc dừng lại. */}
        <div className="mt-12">
          <h2 className="sr-only">Sơ đồ liên kết giữa các file</h2>
          <SystemMap map={toMapData(system)} />
        </div>

        <h2 className="font-display mt-24 text-3xl">Chạy bộ file này thế nào</h2>
        <p className="mt-3 max-w-prose text-ink-soft">
          Theo đúng thứ tự trên sơ đồ, từ trái sang phải. File tổng luôn là file
          mở sau cùng vì nó chỉ đọc lại kết quả của những file đứng trước.
        </p>
        <ol className="mt-6 max-w-3xl space-y-6">
          {steps.map((step, index) => (
            <li
              key={step.node.slug}
              className="grid gap-1 sm:grid-cols-[2.5rem_1fr]"
            >
              <span className="cell-ref pt-1 text-sm text-ink-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-medium">
                  {step.node.href ? (
                    <Link
                      href={step.node.href}
                      className="underline decoration-rule underline-offset-4 hover:decoration-ink"
                    >
                      {step.node.shortName}
                    </Link>
                  ) : (
                    step.node.shortName
                  )}{" "}
                  <span className="font-mono text-xs text-ink-faint">
                    {ROLE_LABEL[step.node.role].toLowerCase()}
                  </span>
                </p>
                <p className="mt-1 text-ink-soft">{step.node.owner}.</p>
                {step.receives.length > 0 && (
                  <p className="mt-1 text-ink-soft">
                    Trước khi chạy, lấy về:{" "}
                    {step.receives
                      .map((r) => `${r.label} (từ ${r.from.shortName})`)
                      .join("; ")}
                    .
                  </p>
                )}
                {step.sends.length > 0 && (
                  <p className="mt-1 text-ink-soft">
                    Chạy xong, chuyển tiếp:{" "}
                    {step.sends
                      .map((s) => `${s.label} (sang ${s.to.shortName})`)
                      .join("; ")}
                    .
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <h2 className="font-display mt-24 text-3xl">Từng file trong bộ</h2>
        <ul className={`mt-5 ${cardGridClass(system.nodes.length)}`}>
          {system.nodes.map((node) => {
            const template = templateBySlug.get(node.slug);

            if (!template) {
              // Ô "đang dựng": không link, không vào sitemap. Nói thẳng còn hơn
              // để người đọc bấm vào một trang 404.
              return (
                <li key={node.slug} className="bg-panel">
                  <div className="h-full p-5 text-ink-faint">
                    <span className="font-mono text-[11px] uppercase">
                      {ROLE_LABEL[node.role]} · đang dựng
                    </span>
                    <span className="mt-2 block font-medium">
                      {node.shortName}
                    </span>
                    <span className="mt-1 block text-sm">{node.owner}</span>
                  </div>
                </li>
              );
            }

            return (
              <li key={node.slug} className="bg-paper">
                <Link href={template.href} className="block h-full p-5 hover:bg-panel">
                  <span className="font-mono text-[11px] text-ink-faint uppercase">
                    {ROLE_LABEL[node.role]}
                  </span>
                  <span className="mt-2 block font-medium">{template.h1}</span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {node.owner}
                  </span>
                  <span className="mt-3 block text-sm text-ink-faint">
                    Mở file →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/*
          Band signature của lớp bộ file dùng forest + cream, tách hẳn khỏi
          coral của trang chủ và ink của CTA khóa học — vào trang là biết ngay
          mình đang ở tầng nào.
        */}
        {liveNodes.length > 0 && (
          <aside className="on-dark mt-24 rounded-lg bg-forest p-8 text-cream sm:p-12">
            <h2 className="font-display text-3xl text-balance">
              Tải cả bộ, không cần để lại email
            </h2>

            {system.bundleUrl ? (
              <>
                <p className="mt-4 max-w-prose text-cream/80">
                  {system.bundle!.summary}. Sửa một ô ở sheet đầu vào thì các
                  sheet sau tính lại ngay — không phải copy vùng dữ liệu sang,
                  cũng không có liên kết nào để gãy.
                </p>
                <a
                  href={withBasePath(system.bundleUrl)}
                  download
                  className="mt-6 inline-block rounded-lg bg-cream px-6 py-4 text-lg font-medium text-forest hover:bg-cream/85"
                >
                  Tải file gộp .xlsx
                </a>

                {/* Bản rời để thấp hơn hẳn: nó vẫn phải có mặt cho người chỉ cần
                    một bảng, nhưng ai không đọc kỹ mà tải nhầm thì mất đúng thứ
                    cả trang này đang nói tới. */}
                <p className="mt-8 text-sm text-cream/70">
                  Chỉ cần đúng một bảng? Tải riêng từng file — mỗi file chạy độc
                  lập đầy đủ, nhưng các cột nối phải tự nhập.
                </p>
              </>
            ) : (
              <p className="mt-4 max-w-prose text-cream/80">
                {system.liveCount} file đã xong nằm bên dưới. Tải hết về một thư
                mục rồi mở theo thứ tự trên sơ đồ.
              </p>
            )}

            <ul
              className={`flex flex-wrap gap-3 ${system.bundleUrl ? "mt-3" : "mt-6"}`}
            >
              {liveNodes.map((node) => (
                <li key={node.slug}>
                  <a
                    href={withBasePath(node.downloadUrl!)}
                    download
                    className={
                      system.bundleUrl
                        ? "inline-block rounded-lg border border-cream/30 px-4 py-2 text-sm text-cream hover:border-cream"
                        : "inline-block rounded-lg bg-cream px-5 py-3 font-medium text-forest hover:bg-cream/85"
                    }
                  >
                    {node.shortName} .xlsx
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {system.bundleLinks.length > 0 && (
          <>
            <h2 className="font-display mt-24 text-3xl">
              Công thức nối giữa các sheet
            </h2>
            <p className="mt-3 max-w-prose text-ink-soft">
              Đây là phần bản tải từng file riêng không có. Mỗi dòng dưới đây là
              một cột vốn phải gõ tay, nay là công thức tra sang sheet khác theo{" "}
              {system.bundle!.keyName}. Công thức in ra là công thức thật nằm ở
              dòng 2 của file bạn tải về.
            </p>
            <ul className="mt-6 max-w-3xl divide-y divide-rule border-y border-rule">
              {system.bundleLinks.map((link) => (
                <li key={`${link.sheet}.${link.column}`} className="py-5">
                  <p className="font-medium">
                    <span className="text-ink-faint">{link.sheet}</span>
                    <span aria-hidden className="px-2 text-ink-faint">
                      ·
                    </span>
                    {link.header}
                  </p>
                  <pre className="mt-2 overflow-x-auto bg-panel px-3 py-2 font-mono text-xs">
                    {link.resolved}
                  </pre>
                  <p className="mt-2 max-w-prose text-ink-soft">{link.note}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-24">
          <CourseCta
            target={system.ctaTarget}
            text={system.ctaText}
            campaign="bo-file"
            content={system.slug}
          />
        </div>

        <h2 className="font-display mt-24 text-3xl">Hay bị hỏi</h2>
        <dl className="mt-5 max-w-3xl divide-y divide-rule border-y border-rule">
          {system.faq.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-2 max-w-prose text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-24 text-sm text-ink-faint">
          Cập nhật{" "}
          <time dateTime={system.updatedAt}>
            {new Date(system.updatedAt).toLocaleDateString("vi-VN")}
          </time>
        </p>

        <div className="mt-6">
          <AuthorByline />
        </div>
      </article>
    </>
  );
}
