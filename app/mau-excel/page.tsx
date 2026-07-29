import type { Metadata } from "next";
import Link from "next/link";
import { SystemCard } from "@/components/SystemCard";
import { TemplateBrowser } from "@/components/TemplateBrowser";
import { cardGridClass } from "@/components/TemplateCard";
import { getAllTemplates, toCardData } from "@/lib/templates";
import { getAllSystems, toSystemCardData } from "@/lib/systems";
import { absoluteUrl, CATEGORIES, CATEGORY_SLUGS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thư viện mẫu Excel miễn phí có sẵn công thức",
  description:
    "Tổng hợp mẫu Excel tiếng Việt miễn phí cho nhân sự, kế toán và quản lý công việc. Mỗi mẫu có công thức chạy đúng kèm giải thích từng bước.",
  alternates: { canonical: absoluteUrl("/mau-excel") },
};

export default function TemplateIndexPage() {
  const templates = getAllTemplates();
  const systems = getAllSystems();

  /*
   * Mô tả nhóm việc gửi kèm cả ba, không chỉ nhóm đang chọn: bộ lọc chạy phía
   * client nên không hỏi lại server được, và ba câu văn thì nhẹ hơn nhiều so
   * với một vòng request.
   */
  const categoryDescriptions = Object.fromEntries(
    CATEGORY_SLUGS.map((slug) => [slug, CATEGORIES[slug].description]),
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-24">
      <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
        Thư viện file Excel
      </h1>
      <p className="mt-6 max-w-prose text-lg text-ink-soft">
        {templates.length} file tôi dựng cho công việc của mình, dọn lại rồi để
        đây dùng chung. Tải không cần đăng ký, và mỗi file đều kèm công thức
        được giải thích ra.
      </p>

      {/*
        Dải bộ file đứng trên bộ lọc: người chưa biết mình cần file nào thì
        lọc kiểu gì cũng không ra: họ cần được chỉ cho cả một quy trình.
      */}
      {systems.length > 0 && (
        <section className="mt-14 border-y border-rule py-8">
          <h2 className="font-display text-2xl">
            Chưa biết bắt đầu từ đâu? Lấy nguyên một bộ.
          </h2>
          <p className="mt-3 max-w-prose text-ink-soft">
            Mỗi bộ gom các file chạy chung một quy trình, kèm sơ đồ chỉ rõ file
            nào nối vào file nào.
          </p>
          <ul className={`mt-6 ${cardGridClass(systems.length)}`}>
            {systems.map((system) => (
              <SystemCard key={system.slug} system={toSystemCardData(system)} />
            ))}
          </ul>
        </section>
      )}

      <div className="mt-14">
        <TemplateBrowser
          templates={templates.map(toCardData)}
          categoryDescriptions={categoryDescriptions}
        />
      </div>

      {/*
        Trang này trước đây kết thúc cụt ở lưới cuối cùng. Band xám đóng lại
        bằng lời mời tiếp theo, và vì nó là bề mặt đặc nên cũng làm nhịp nghỉ
        sau một chuỗi lưới trắng liên tiếp.
      */}
      <section className="mt-24 rounded-lg bg-surface-strong p-10 sm:p-12">
        <h2 className="font-display max-w-2xl text-3xl text-balance">
          Không có file nào khớp việc của bạn?
        </h2>
        <p className="mt-5 max-w-prose text-ink-soft">
          Thư viện này chỉ có những file tôi thật sự dùng, nên nó không phủ hết
          mọi đầu việc. Nếu bạn cần tự dựng lấy, đây là khóa tôi giới thiệu.
        </p>
        <Link
          href="/khoa-hoc-excel"
          className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:bg-ink/85"
        >
          Khóa học tôi giới thiệu
        </Link>
      </section>
    </div>
  );
}
