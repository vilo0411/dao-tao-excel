import type { Metadata } from "next";
import Link from "next/link";
import { AuthorByline } from "@/components/Author";
import { getAllPosts, getPopulatedPillars, getPostsByPillar } from "@/lib/knowledge";
import { getAllFunctions } from "@/lib/functions";
import { getAllTemplates } from "@/lib/templates";
import { getPopulatedCategories } from "@/lib/systems";
import { breadcrumbList, graph } from "@/lib/jsonld";
import { absoluteUrl, CATEGORIES } from "@/lib/site";

/**
 * Lộ trình học — trang nối ba nhánh của site lại thành một đường đi.
 *
 * Không có dữ liệu riêng: mọi thứ trên trang này sinh từ các loader đã có.
 * Chi phí nội dung bằng 0, và nó vá đúng điểm yếu cấu trúc còn lại — ba nhánh
 * /mau-excel, /ham-excel và /kien-thuc-excel đang đứng cạnh nhau mà không có
 * trang nào nói chúng liên quan thế nào.
 *
 * Vì cùng lý do đó, trang này KHÔNG khai JSON-LD kiểu Course. Ta không tổ chức
 * lớp, không có giảng viên, không có lịch học; khai Course là khai một thứ
 * không tồn tại. ItemList lồng nói đúng thứ nó là: ba chặng, mỗi chặng một
 * danh sách trang.
 */

export const metadata: Metadata = {
  title: "Lộ trình học Excel — đi từ hàm cơ bản tới file dùng được",
  description:
    "Ba chặng đi qua toàn bộ nội dung miễn phí của site: hàm nền tảng, cụm lỗi thường gặp, rồi thư viện file mẫu theo nghề. Không cần đăng ký gì.",
  alternates: { canonical: absoluteUrl("/kien-thuc-excel/lo-trinh") },
};

type Stop = { name: string; href: string; note?: string };

function Stage({
  index,
  title,
  lead,
  stops,
}: {
  index: number;
  title: string;
  lead: string;
  stops: Stop[];
}) {
  return (
    <section className="mt-24">
      <p className="font-mono text-sm text-ink-faint">Chặng {index}</p>
      <h2 className="font-display mt-2 text-3xl text-balance">{title}</h2>
      <p className="mt-5 max-w-prose text-ink-soft">{lead}</p>

      <ol className="mt-8 divide-y divide-rule border-y border-rule">
        {stops.map((stop, i) => (
          <li key={stop.href}>
            <Link href={stop.href} className="group flex gap-4 py-4 hover:bg-panel">
              <span className="font-mono text-sm text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block font-medium group-hover:text-input">
                  {stop.name}
                </span>
                {stop.note && (
                  <span className="mt-1 block text-sm text-ink-soft">{stop.note}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function RoadmapPage() {
  const functions = getAllFunctions();
  const templates = getAllTemplates();
  const pillars = getPopulatedPillars();
  const totalPosts = getAllPosts().length;

  const stage1: Stop[] = functions.map((fn) => ({
    name: `Hàm ${fn.name}`,
    href: `/ham-excel/${fn.slug}`,
    note: fn.definition,
  }));

  const stage2: Stop[] = pillars.flatMap((pillar) =>
    getPostsByPillar(pillar).map((post) => ({
      name: post.h1,
      href: post.href,
      note: post.metaDesc,
    })),
  );

  const stage3: Stop[] = getPopulatedCategories().map((category) => ({
    name: CATEGORIES[category].name,
    href: `/mau-excel/${category}`,
    note: `${templates.filter((t) => t.category === category).length} file — ${CATEGORIES[category].description}`,
  }));

  const total = stage1.length + stage2.length + stage3.length;

  const jsonLd = graph(
    {
      "@type": "ItemList",
      name: "Lộ trình học Excel",
      numberOfItems: 3,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Làm quen với hàm nền tảng",
          item: absoluteUrl("/ham-excel"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Hết lỗi thường gặp",
          item: absoluteUrl("/kien-thuc-excel"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Vào việc với file mẫu",
          item: absoluteUrl("/mau-excel"),
        },
      ],
    },
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
      { name: "Lộ trình học", path: "/kien-thuc-excel/lo-trinh" },
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
          <span aria-hidden> / </span>
          <Link href="/kien-thuc-excel" className="hover:text-input">
            Kiến thức Excel
          </Link>
        </nav>

        <h1 className="font-display mt-5 text-4xl leading-[1.05] text-balance sm:text-5xl">
          Lộ trình học Excel
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          Toàn bộ nội dung miễn phí của site xếp thành một đường đi, gồm{" "}
          {total} chặng dừng. Không phải khóa học, không có ai chấm bài — chỉ là
          thứ tự mà tôi nghĩ là hợp lý nhất để đi qua chúng.
        </p>
        <p className="mt-4 max-w-prose text-ink-soft">
          Nếu bạn đang bí một lỗi cụ thể thì nhảy thẳng vào chặng 2. Nếu cần một
          file để nộp trong hôm nay thì đi thẳng chặng 3. Chặng 1 dành cho lúc
          bạn muốn hiểu vì sao những công thức trong file đó viết như vậy.
        </p>

        <Stage
          index={1}
          title="Làm quen với hàm nền tảng"
          lead={`${functions.length} hàm, và đây đúng là số hàm đang chạy thật trong các file mẫu của site — không phải một danh sách hàm phổ biến chép từ đâu về. Mỗi trang hàm dẫn ngược tới đúng những file đang dùng nó.`}
          stops={stage1}
        />

        <Stage
          index={2}
          title="Hết lỗi thường gặp"
          lead={`${totalPosts} bài, đọc theo thứ tự thì thành một mạch từ những mã lỗi hay gặp nhất tới những sự cố không có mã lỗi nào. Mỗi bài đều gắn với một file thật để đối chiếu, và có khung thử công thức ngay trên trang.`}
          stops={stage2}
        />

        <Stage
          index={3}
          title="Vào việc với file mẫu"
          lead={`${templates.length} file chia theo nghề. Tải là dùng được ngay, không đăng ký, và mọi ô công thức đều mở để xem cách nó tính.`}
          stops={stage3}
        />

        {/* Band đóng trang index, giống trang thư viện và trang cụm. */}
        <section className="mt-24 rounded-lg bg-surface-strong p-12">
          <h2 className="font-display text-3xl text-balance">
            Đi hết ba chặng rồi thì sao?
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Phần còn lại là tự dựng file cho đúng việc của mình, và đó là thứ
            đọc bài không thay được. Khóa học bên HVS Tài Chính Số dạy đúng
            đoạn đó.
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
