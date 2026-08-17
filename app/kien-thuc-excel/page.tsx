import type { Metadata } from "next";
import Link from "next/link";
import { AuthorByline } from "@/components/Author";
import { cardGridClass } from "@/components/TemplateCard";
import { getAllPosts, getPopulatedPillars, getPostsByPillar } from "@/lib/knowledge";
import { breadcrumbList, graph } from "@/lib/jsonld";
import { absoluteUrl, PILLARS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kiến thức Excel — sửa lỗi và làm chủ bảng tính, kèm file thật",
  description:
    "Hướng dẫn Excel viết theo cụm chủ đề, mỗi bài gắn với một file mẫu thật và công thức đang chạy trong đó. Có khung thử công thức ngay trên trình duyệt.",
  alternates: { canonical: absoluteUrl("/kien-thuc-excel") },
};

export default function KnowledgeHubPage() {
  const pillars = getPopulatedPillars();
  const total = getAllPosts().length;

  const jsonLd = graph(
    {
      "@type": "Blog",
      name: "Kiến thức Excel",
      url: absoluteUrl("/kien-thuc-excel"),
      inLanguage: "vi-VN",
    },
    {
      "@type": "ItemList",
      name: "Cụm chủ đề",
      itemListElement: pillars.map((pillar, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: PILLARS[pillar].name,
        url: absoluteUrl(`/kien-thuc-excel/${pillar}`),
      })),
    },
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
    ]),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-5 py-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <Link href="/" className="hover:text-input">
            Trang chủ
          </Link>
        </nav>

        <h1 className="font-display mt-5 text-4xl leading-[1.05] text-balance sm:text-5xl">
          Kiến thức Excel
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {total} bài viết xếp theo cụm chủ đề, mỗi cụm là một chuỗi có thứ tự
          nên đọc. Khác biệt của những bài này nằm ở chỗ mọi công thức đưa ra
          đều là công thức đang chạy thật trong một file mẫu tải được, và số
          liệu trên trang là số Excel tính ra chứ không phải số gõ tay.
        </p>

        <ul className={`mt-12 ${cardGridClass(pillars.length)}`}>
          {pillars.map((pillar) => {
            const info = PILLARS[pillar];
            const count = getPostsByPillar(pillar).length;
            return (
              <li key={pillar} className="group bg-paper">
                <Link
                  href={`/kien-thuc-excel/${pillar}`}
                  className="flex h-full flex-col p-6 hover:bg-panel"
                >
                  <h2 className="font-display font-medium">{info.name}</h2>
                  <p className="mt-3 flex-1 text-sm text-ink-soft">
                    {info.description}
                  </p>
                  <span className="mt-5 font-mono text-xs text-ink-faint">
                    {count} bài
                  </span>
                  <span
                    aria-hidden
                    className="mt-4 text-sm text-ink-faint transition-colors group-hover:text-ink"
                  >
                    Mở cụm →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/*
          Nói thẳng phần chưa có. Trang hub liệt kê đúng những cụm đã mở, và
          câu này giải thích vì sao danh sách còn ngắn — thay vì để chỗ trống
          hoặc dựng thẻ "sắp ra mắt", thứ vừa là trang mỏng vừa là lời hứa.
        */}
        <p className="mt-12 max-w-prose text-sm text-ink-faint">
          Cụm mới chỉ được mở khi đã đủ bài để đứng thành một mạch hoàn chỉnh.
          Hai cụm đang viết là nghiệp vụ theo vai trò và Excel cơ bản cho người
          mới; chúng sẽ xuất hiện ở đây khi viết xong, không sớm hơn.
        </p>

        {/*
          Trang tra cứu đứng riêng khỏi lưới cụm. Chúng không phải một cụm và
          cũng không phải một bài — gộp vào cùng lưới sẽ nói sai với người đọc
          rằng đây là bốn thứ cùng loại.
        */}
        <h2 className="font-display mt-24 text-3xl">Trang tra cứu</h2>
        <ul className="mt-5 divide-y divide-rule border-y border-rule">
          {[
            {
              href: "/kien-thuc-excel/lo-trinh",
              name: "Lộ trình học Excel",
              note: "Toàn bộ nội dung miễn phí của site xếp thành một đường đi ba chặng: hàm nền tảng, cụm lỗi, rồi thư viện file.",
            },
            {
              href: "/kien-thuc-excel/bai-tap",
              name: "Bài tập Excel có lời giải",
              note: "Đề bài kèm dữ liệu chép được, khung thử công thức ngay trên trang, và lời giải nói rõ vì sao viết như vậy.",
            },
            {
              href: "/kien-thuc-excel/phim-tat",
              name: "Phím tắt Excel",
              note: "Bảng tra hơn 70 tổ hợp phím theo nhóm việc, có ô tìm kiếm và chuyển giữa Windows với macOS.",
            },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block py-5 hover:bg-panel">
                <span className="font-medium group-hover:text-input">
                  {item.name}
                </span>
                <span className="mt-1 block max-w-prose text-sm text-ink-soft">
                  {item.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-24 rounded-lg bg-surface-strong p-12">
          <h2 className="font-display text-3xl text-balance">
            Cần file làm sẵn thay vì bài đọc?
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Thư viện có 37 file Excel miễn phí cho nhân sự, kế toán và quản lý
            công việc. Tải là dùng được ngay, không đăng ký, và mọi ô công thức
            đều mở để xem.
          </p>
          <Link
            href="/mau-excel"
            className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:opacity-85"
          >
            Mở thư viện file
          </Link>
        </section>

        <div className="mt-24">
          <AuthorByline />
        </div>
      </div>
    </>
  );
}
