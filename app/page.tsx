import Link from "next/link";
import type { Metadata } from "next";
import { AuthorCard } from "@/components/Author";
import { HeroSheet } from "@/components/HeroSheet";
import { SystemCard } from "@/components/SystemCard";
import { cardGridClass, TemplateCard } from "@/components/TemplateCard";
import { getAllTemplates, toCardData } from "@/lib/templates";
import { getAllSystems, toSystemCardData } from "@/lib/systems";
import { absoluteUrl } from "@/lib/site";
import { AUTHOR } from "@/lib/author";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  const templates = getAllTemplates().slice(0, 6);
  const templateCount = getAllTemplates().length;
  const systems = getAllSystems();

  // Bảng demo dựng theo file bảng lương. Link tới file thật nếu nó còn tồn
  // tại — đổi slug hay bỏ file đi thì phần chú thích tự rút link, không gãy.
  const demoHref = getAllTemplates().find(
    (t) => t.slug === "bang-tinh-luong-nhan-vien",
  )?.href;

  return (
    <div className="mx-auto max-w-5xl px-5 py-24">
      {/*
        Hero không có nền, không viền, không hình minh họa — nhưng cũng không
        để trống. Thứ đặt dưới câu mở đầu là chính sản phẩm: một bảng tính sửa
        được. Site đi bán ý "bạn sẽ hiểu file chạy bằng gì", mà ý đó chứng minh
        bằng một cú kéo số thì nhanh hơn mọi đoạn văn viết thêm.
      */}
      <section className="max-w-2xl">
        <h1 className="font-display text-5xl leading-[1.05] text-balance sm:text-6xl">
          File Excel tôi dựng cho việc của mình
        </h1>
        <p className="mt-8 max-w-prose text-lg text-ink-soft">
          Tải một file mẫu về là chuyện dễ. Sửa được nó khi sếp đổi yêu cầu mới
          là chuyện khó, và đó là lúc phần lớn file tải trên mạng bó tay vì
          không ai nói cho bạn biết bên trong nó chạy bằng gì.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/mau-excel"
            className="rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:bg-ink/85"
          >
            Xem thư viện file
          </Link>
          <Link
            href="/khoa-hoc-excel"
            className="rounded-lg border border-rule px-6 py-4 font-medium hover:border-ink"
          >
            Khóa học tôi giới thiệu
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="sr-only">Thử một bảng tính lương</h2>
        <HeroSheet templateHref={demoHref} />
      </section>

      {templates.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl">File mới nhất</h2>
          <ul className={`mt-6 ${cardGridClass(templates.length)}`}>
            {templates.map((template) => (
              <TemplateCard key={template.slug} template={toCardData(template)} />
            ))}
          </ul>
        </section>
      )}

      {/*
        Band coral cắt ngang giữa hai lưới trắng. Đây là chỗ duy nhất trên
        trang chủ được phép to tiếng.

        Nó từng nói "mỗi file đều phơi công thức ra" — nhưng bảng ở hero vừa
        chứng minh xong điều đó, nên nhắc lại chỉ là nói dai. Chuyển sang rào
        cản thứ hai khiến người ta bỏ đi: sợ phải trả bằng email.
      */}
      <section className="on-dark mt-24 rounded-lg bg-coral p-10 text-paper sm:p-12">
        <h2 className="font-display max-w-2xl text-3xl text-balance sm:text-4xl">
          Tải thẳng, không cần để lại email
        </h2>
        <p className="mt-6 max-w-prose text-lg">
          Không đăng ký, không tường chắn, không chuỗi email nhắc mua hàng. Bấm
          tải là ra file .xlsx, mở bằng Excel hay Google Sheets đều chạy, và
          công thức bên trong đã được kiểm lại bằng máy trước khi đăng.
        </p>
        <Link
          href="/mau-excel"
          className="mt-8 inline-block rounded-lg bg-paper px-6 py-4 font-medium text-ink hover:bg-paper/90"
        >
          Xem thử một file
        </Link>
      </section>

      {/*
        Chỗ này trước đây là lưới ba nhóm việc — ba cái thùng phẳng, không nói
        được file nào liên quan file nào. Nhóm việc vẫn tới được qua trang thư
        viện; ở trang chủ, thứ đáng nói là các file đi theo bộ.
      */}
      {systems.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl">Đi theo bộ, không đi lẻ</h2>
          <p className="mt-4 max-w-prose text-ink-soft">
            Việc hành chính chạy theo chuỗi: chấm công xong mới tính được lương,
            tính lương xong mới báo cáo được. Mỗi bộ dưới đây là một chuỗi như
            vậy, có sơ đồ chỉ rõ file nào đưa số liệu sang file nào, và kết vào
            đúng một file tổng.
          </p>
          <ul className={`mt-6 ${cardGridClass(systems.length)}`}>
            {systems.map((system) => (
              <SystemCard key={system.slug} system={toSystemCardData(system)} />
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-soft">
            <Link
              href="/mau-excel"
              className="underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              Hoặc xem toàn bộ {templateCount} file lẻ, lọc theo nhóm việc →
            </Link>
          </p>
        </section>
      )}

      <div className="mt-24">
        <h2 className="sr-only">Về {AUTHOR.name}</h2>
        <AuthorCard />
      </div>
    </div>
  );
}
