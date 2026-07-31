import type { Metadata } from "next";
import Link from "next/link";
import { cardGridClass } from "@/components/TemplateCard";
import { getAllFunctions, type FunctionGroup } from "@/lib/functions";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Từ điển hàm Excel — cú pháp và ví dụ thật từ file mẫu",
  description:
    "Tra cứu hàm Excel theo đúng công thức đang chạy trong các file mẫu miễn phí: cú pháp, giải thích, và ví dụ thật kèm link tới từng file dùng hàm đó.",
  alternates: { canonical: absoluteUrl("/ham-excel") },
};

/*
 * Chỉ hai nhóm đang có dữ liệu thật (xem lib/functions.ts). Thêm nhóm mới
 * (Tra cứu, Văn bản, Ngày tháng...) khi có template dùng hàm thuộc nhóm đó —
 * không khai trước một nhóm rỗng.
 */
const GROUP_ORDER: FunctionGroup[] = ["Logic", "Toán học"];

export default function FunctionIndexPage() {
  const functions = getAllFunctions();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "Hàm Excel",
        itemListElement: functions.map((fn, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: fn.name,
          url: absoluteUrl(`/ham-excel/${fn.slug}`),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Trang chủ", item: absoluteUrl("/") },
          { name: "Hàm Excel", item: absoluteUrl("/ham-excel") },
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

      <div className="mx-auto max-w-5xl px-5 py-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-input">
                Trang chủ
              </Link>
            </li>
          </ol>
        </nav>

        <h1 className="font-display mt-6 text-4xl leading-[1.05] text-balance sm:text-5xl">
          Từ điển hàm Excel
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {functions.length} hàm, mỗi hàm lấy đúng từ công thức thật đang chạy
          trong thư viện file mẫu — không phải danh sách hàm chép lại từ nơi
          khác. Mỗi trang có cú pháp, giải thích, và từng chỗ hàm đó được dùng
          thật kèm link tới đúng file.
        </p>

        {GROUP_ORDER.map((group) => {
          const inGroup = functions.filter((fn) => fn.group === group);
          if (inGroup.length === 0) return null;

          return (
            <section key={group} className="mt-14">
              <h2 className="font-display text-2xl">{group}</h2>
              <ul className={`mt-6 ${cardGridClass(inGroup.length)}`}>
                {inGroup.map((fn) => (
                  <li key={fn.slug} className="group bg-paper">
                    <Link
                      href={`/ham-excel/${fn.slug}`}
                      className="flex h-full flex-col p-6 hover:bg-panel"
                    >
                      <span className="cell-ref text-sm text-computed">
                        {fn.name}
                      </span>
                      <p className="mt-2 font-mono text-xs text-ink-faint">
                        {fn.syntax}
                      </p>
                      <p className="mt-3 flex-1 text-sm text-ink-soft">
                        {fn.definition}
                      </p>
                      <span className="mt-5 text-xs text-ink-faint">
                        Dùng trong{" "}
                        {new Set(fn.usages.map((u) => u.templateSlug)).size}{" "}
                        file
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="mt-24 rounded-lg bg-surface-strong p-10 sm:p-12">
          <h2 className="font-display max-w-2xl text-3xl text-balance">
            Muốn xem hàm nằm trong cả một file, không chỉ một ô?
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Mỗi ví dụ ở trên trích từ một file mẫu tải được ngay, không cần để
            lại email.
          </p>
          <Link
            href="/mau-excel"
            className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:bg-ink/85"
          >
            Xem thư viện file
          </Link>
        </section>
      </div>
    </>
  );
}
