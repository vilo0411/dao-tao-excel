import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCta } from "@/components/CourseCta";
import { SystemCard } from "@/components/SystemCard";
import { cardGridClass } from "@/components/TemplateCard";
import { TemplateList } from "@/components/TemplateList";
import { getTemplatesByCategory, toCardData } from "@/lib/templates";
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

  /*
   * Thông số của nghề. Mọi con số đều đếm từ dữ liệu thật, không khai tay: gõ
   * cứng "13 file" vào JSX thì lần thêm file thứ 14 nó thành lời nói dối, mà
   * không ai nhớ ra để sửa.
   *
   * Dòng "hàm" đếm số hàm Excel KHÁC NHAU xuất hiện trong nghề, không phải hàm
   * hay dùng nhất. Bản đầu khai "hàm hay dùng" và mọi nghề đều ra IF — đúng sự
   * thật nhưng chẳng phân biệt được gì, vì gần như file nào cũng có một câu IF.
   * Số hàm khác nhau thì nói được một điều thật: nghề này đi sâu tới đâu.
   */
  const functionSet = new Set(templates.flatMap((t) => t.functions));

  const lastUpdated = templates
    .map((t) => t.updatedAt)
    .sort()
    .at(-1);
  const [year, month] = lastUpdated?.split("-") ?? [];

  const specs = [
    { label: "file", value: String(templates.length) },
    ...(systems.length > 0
      ? [{ label: "bộ file", value: String(systems.length) }]
      : []),
    ...(functionSet.size > 0
      ? [{ label: "hàm Excel", value: String(functionSet.size) }]
      : []),
    ...(year ? [{ label: "cập nhật", value: `${month}/${year}` }] : []),
  ];

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

        {/*
          Trang nghề là trang tiếp đất chính từ Google, nhưng trước đây nó mở
          đầu bằng h1 rồi một đoạn văn rồi thẳng xuống lưới — không có gì cho
          mắt bám vào ở màn hình đầu tiên.

          Khối thông số bên phải là thứ trả lời đúng những câu người mới vào
          hỏi trước khi chịu đọc, và nó lấp cột phải vốn đang là khoảng trắng
          chết (h1 chỉ chiếm max-w-2xl trong khung max-w-5xl). Cùng hình dáng
          với khối thông số trên trang chủ: bo góc 0, viền hairline, số để mono
          canh phải — người đi từ trang chủ sang gặp lại đúng một ký hiệu.
        */}
        <section className="mt-6 grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
              File Excel {meta.name}
            </h1>
            <p className="mt-6 max-w-prose text-lg text-ink-soft">
              {meta.description}
            </p>
          </div>

          <dl className="max-w-2xl border border-rule bg-paper text-sm lg:max-w-none">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-4 border-b border-rule px-3 py-2 last:border-b-0"
              >
                <dt className="text-ink-soft">{spec.label}</dt>
                <dd className="font-mono tabular-nums text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>

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
          /* Cùng phương ngữ danh sách với trang thư viện: nhóm nhân sự đã có
             13 file, lưới card ở đây dài y hệt vấn đề bên kia. */
          <section className="mt-10">
            {/* "File lẻ" chỉ có nghĩa khi phía trên vừa có bộ file để đối lại;
                nhóm chưa có bộ nào thì đây là toàn bộ nội dung của nghề. */}
            <h2 className="font-display text-2xl">
              {systems.length > 0 ? "File lẻ" : `Tất cả ${templates.length} file`}
            </h2>
            <div className="mt-5">
              {/* toCardData chứ không phải Template đầy đủ: TemplateList chạy
                  phía client nên mọi thứ truyền vào đều đi xuống HTML, mà
                  `sheets` thì hàng chục KB và không dùng ở tầng danh sách. */}
              <TemplateList templates={templates.map(toCardData)} />
            </div>
          </section>
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
