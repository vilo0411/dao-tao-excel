import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { PostCard } from "@/components/PostCard";
import { cardGridClass } from "@/components/TemplateCard";
import { getPopulatedPillars, getPostsByPillar } from "@/lib/knowledge";
import { toPostCardData } from "@/lib/knowledge-schema";
import { breadcrumbList, graph } from "@/lib/jsonld";
import { absoluteUrl, isPillarSlug, PILLARS } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPopulatedPillars().map((pillar) => ({ pillar }));
}

type Params = { params: Promise<{ pillar: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pillar } = await params;
  if (!isPillarSlug(pillar)) return {};
  const info = PILLARS[pillar];

  return {
    title: info.name,
    description: info.description,
    alternates: { canonical: absoluteUrl(`/kien-thuc-excel/${pillar}`) },
  };
}

export default async function PillarPage({ params }: Params) {
  const { pillar } = await params;
  if (!isPillarSlug(pillar)) notFound();

  const info = PILLARS[pillar];
  const href = `/kien-thuc-excel/${pillar}`;
  const posts = getPostsByPillar(pillar).map(toPostCardData);

  const jsonLd = graph(
    {
      "@type": "CollectionPage",
      name: info.name,
      description: info.description,
      url: absoluteUrl(href),
      inLanguage: "vi-VN",
    },
    {
      "@type": "ItemList",
      name: info.name,
      // Cụm là một CHUỖI có thứ tự, không phải một đống bài. Khai
      // itemListOrder để Google đọc được điều đó thay vì phải đoán.
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: posts.length,
      itemListElement: posts.map((p) => ({
        "@type": "ListItem",
        position: p.order,
        name: p.h1,
        url: absoluteUrl(p.href),
      })),
    },
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
      { name: info.name, path: href },
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
          {info.name}
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {info.description}
        </p>
        <p className="mt-4 max-w-prose text-ink-soft">
          {posts.length} bài, xếp theo thứ tự nên đọc. Mỗi bài đều gắn với một
          file mẫu thật để đối chiếu, và công thức trên trang là công thức đang
          chạy trong file đó chứ không phải ví dụ dựng riêng.
        </p>

        {/*
          Liệt kê TOÀN BỘ bài, không phân trang và không cắt. Đây là trang duy
          nhất trên site cho người đọc thấy được cụm đầy đủ tới đâu, và cắt bớt
          ở đây là bỏ mất chính thứ đó — cùng với 15 link nội bộ.
        */}
        <ul className={`mt-12 ${cardGridClass(posts.length)}`}>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </ul>

        {/* Band đóng trang index: `surface-strong`, giống trang thư viện file. */}
        <section className="mt-24 rounded-lg bg-surface-strong p-12">
          <h2 className="font-display text-3xl text-balance">
            Sửa xong lỗi rồi thì lấy file về mà dùng
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Mỗi bài trong cụm này đều dẫn tới một file mẫu miễn phí đã dựng sẵn
            công thức chống lỗi. Tải về, mở ra xem công thức, sửa theo việc của
            bạn.
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
