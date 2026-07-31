import type { Metadata } from "next";
import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { TemplateBrowser } from "@/components/TemplateBrowser";
import { cardGridClass } from "@/components/TemplateCard";
import { getAllTemplates, toCardData } from "@/lib/templates";
import { getAllSystems, getPopulatedCategories } from "@/lib/systems";
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
   * Chỉ liệt kê nghề đã có nội dung: getPopulatedCategories() không dựng trang
   * cho nghề rỗng, nên link tới nó là link vào 404.
   */
  const categories = getPopulatedCategories().map((slug) => ({
    slug,
    name: CATEGORIES[slug].name,
    description: CATEGORIES[slug].description,
    templateCount: templates.filter((t) => t.category === slug).length,
    systemCount: systems.filter((s) => s.category === slug).length,
  }));

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
        Dải theo nghề đứng trên bộ lọc: người chưa biết mình cần file nào thì
        lọc kiểu gì cũng không ra — nhưng ai cũng biết mình làm nghề gì. Vào
        trang nghề rồi mới gặp bộ file của nghề đó, thay vì xổ hết bộ của mọi
        nghề ra ngay đây.
      */}
      {categories.length > 0 && (
        <section className="mt-14 border-y border-rule py-8">
          <h2 className="font-display text-2xl">
            Chưa biết bắt đầu từ đâu? Chọn theo nghề của bạn.
          </h2>
          <p className="mt-3 max-w-prose text-ink-soft">
            Mỗi nghề có trang riêng, mở đầu bằng những bộ file chạy trọn một quy
            trình rồi mới tới các file lẻ.
          </p>
          <ul className={`mt-6 ${cardGridClass(categories.length)}`}>
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
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
          mọi đầu việc. Nếu bạn cần hiểu hàm để tự sửa file, tra cứu ở đây.
        </p>
        <Link
          href="/ham-excel"
          className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:bg-ink/85"
        >
          Tra cứu hàm Excel
        </Link>
      </section>
    </div>
  );
}
