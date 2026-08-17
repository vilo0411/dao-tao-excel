import { AUTHOR } from "./author.ts";
import { absoluteUrl } from "./site.ts";

/**
 * Các node JSON-LD dùng lại được.
 *
 * Trước file này, khối BreadcrumbList giống hệt nhau được chép ở bốn chỗ:
 * app/ham-excel/page.tsx, app/ham-excel/[function]/page.tsx, và hai lần trong
 * app/mau-excel/[category]/[slug]/page.tsx. Khu kiến thức là loại trang thứ
 * năm, và chép lần thứ năm là lúc một bản trong số đó bắt đầu trôi khác các
 * bản còn lại mà không ai phát hiện.
 *
 * Các route cũ chưa di trú sang đây — đó là một commit riêng, rủi ro riêng.
 */

/** Một mắt breadcrumb: tên hiển thị và đường dẫn tương đối. */
export type Crumb = { name: string; path: string };

export function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function faqPage(faq: readonly { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** `@id` cố định của tác giả, neo ở gốc site để mọi trang trỏ về cùng một thực thể. */
export const AUTHOR_ID = `${absoluteUrl("/")}#tacgia`;

/**
 * Node Person cho tác giả.
 *
 * Có Person, KHÔNG có Organization — và đây là lựa chọn chứ không phải thiếu
 * sót. Site đứng tên một người thật (lib/author.ts nói thẳng điều đó),
 * SITE_NAME là tên sản phẩm chứ không phải pháp nhân, và không có asset logo
 * nào để khai `publisher.logo`. Khai một Organization rỗng chỉ vì schema cho
 * phép là khai bịa, và structured data bịa thì rủi ro lớn hơn lợi ích.
 */
export function personNode() {
  return {
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: AUTHOR.name,
    url: AUTHOR.site,
    description: AUTHOR.role,
  };
}

/** Bọc các node thành một tài liệu JSON-LD hoàn chỉnh. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
