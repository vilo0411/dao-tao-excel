import type { Metadata } from "next";
import Link from "next/link";
import { CourseCta } from "@/components/CourseCta";
import { SystemCard } from "@/components/SystemCard";
import { cardGridClass } from "@/components/TemplateCard";
import { absoluteUrl, CATEGORIES, CATEGORY_SLUGS } from "@/lib/site";
import { getAllSystems, toSystemCardData } from "@/lib/systems";

const TITLE = "Bộ file Excel theo quy trình công việc";
const DESCRIPTION =
  "Các bộ file Excel đi theo nhóm: file đầu vào nhập tay, file xử lý có công thức, và một file tổng gom tất cả lại. Xem rõ file nào đưa dữ liệu sang file nào.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/mau-excel/bo-file") },
};

export default function SystemsHubPage() {
  const systems = getAllSystems();

  return (
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

      <h1 className="font-display mt-6 max-w-3xl text-4xl leading-[1.05] text-balance sm:text-5xl">
        {TITLE}
      </h1>

      <p className="mt-6 max-w-prose text-lg text-ink-soft">
        Một file lẻ giải quyết một việc lẻ. Nhưng công việc hành chính thật thì
        chạy theo chuỗi: chấm công xong mới tính được lương, tính lương xong mới
        báo cáo được. Mỗi bộ dưới đây là một chuỗi như vậy — có sơ đồ chỉ rõ file
        nào đưa dữ liệu gì sang file nào, và luôn kết vào đúng một file tổng.
      </p>

      {systems.length > 0 ? (
        CATEGORY_SLUGS.map((category) => {
          const inCategory = systems.filter((s) => s.category === category);
          if (inCategory.length === 0) return null;

          return (
            <section key={category} className="mt-16">
              <h2 className="font-display text-3xl">
                {CATEGORIES[category].name}
              </h2>
              <ul className={`mt-6 ${cardGridClass(inCategory.length)}`}>
                {inCategory.map((system) => (
                  <SystemCard
                    key={system.slug}
                    system={toSystemCardData(system)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <p className="mt-10 text-ink-soft">
          Chưa có bộ nào. Trong lúc chờ, thư viện file lẻ đã có sẵn ở{" "}
          <Link
            href="/mau-excel"
            className="underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            trang thư viện
          </Link>
          .
        </p>
      )}

      <div className="mt-24">
        <CourseCta
          target="consult"
          text="Muốn tự dựng bộ file cho quy trình riêng của công ty mình?"
          campaign="bo-file-hub"
        />
      </div>
    </div>
  );
}
