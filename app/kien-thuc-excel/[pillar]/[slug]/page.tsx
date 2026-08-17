import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { CourseCta } from "@/components/CourseCta";
import { FaqList } from "@/components/FaqList";
import { PillarOutline } from "@/components/PillarOutline";
import { PostBody } from "@/components/PostBody";
import { PostCard } from "@/components/PostCard";
import { PostNav } from "@/components/PostNav";
import { PostToc } from "@/components/PostToc";
import { Quiz } from "@/components/Quiz";
import { cardGridClass } from "@/components/TemplateCard";
import {
  getAllPosts,
  getExerciseForPost,
  getPopulatedPillars,
  getPost,
  getPostsByPillar,
  getRelatedPosts,
} from "@/lib/knowledge";
import { toPostCardData } from "@/lib/knowledge-schema";
import { getAllTemplates } from "@/lib/templates";
import { getFunction } from "@/lib/functions";
import { AUTHOR_ID, breadcrumbList, faqPage, graph, personNode } from "@/lib/jsonld";
import { absoluteUrl, PILLARS, SITE_NAME } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  // getPopulatedPillars() gác ngưỡng MIN_POSTS_PER_PILLAR và NÉM LỖI nếu một
  // cụm dở dang. Gọi nó ở đây chứ không lọc bằng getAllPosts() là có chủ đích:
  // dựng trang bài cho một cụm chưa mở nghĩa là dựng ra những trang có
  // breadcrumb trỏ về một hub 404.
  const open = new Set<string>(getPopulatedPillars());
  return getAllPosts()
    .filter((p) => open.has(p.pillar))
    .map((p) => ({ pillar: p.pillar, slug: p.slug }));
}

type Params = { params: Promise<{ pillar: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pillar, slug } = await params;
  const post = getPost(pillar, slug);
  if (!post) return {};

  return {
    // `absolute` để Next không nối thêm "| Mẫu Excel" và đẩy tiêu đề vượt 60
    // ký tự — cùng lý do đã ghi ở trang template.
    title: { absolute: post.metaTitle },
    description: post.metaDesc,
    alternates: { canonical: absoluteUrl(post.href) },
    openGraph: {
      type: "article",
      title: post.metaTitle,
      description: post.metaDesc,
      url: absoluteUrl(post.href),
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { pillar, slug } = await params;
  const post = getPost(pillar, slug);
  if (!post) notFound();

  const pillarInfo = PILLARS[post.pillar];
  const pillarHref = `/kien-thuc-excel/${post.pillar}`;
  const siblings = getPostsByPillar(post.pillar).map(toPostCardData);
  const related = getRelatedPosts(post, 3).map(toPostCardData);
  const exercise = getExerciseForPost(post.slug);

  const templateBySlug = new Map(getAllTemplates().map((t) => [t.slug, t]));

  const jsonLd = graph(
    {
      "@type": "BlogPosting",
      headline: post.h1,
      description: post.metaDesc,
      url: absoluteUrl(post.href),
      mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(post.href) },
      inLanguage: "vi-VN",
      datePublished: post.updatedAt,
      dateModified: post.updatedAt,
      wordCount: post.wordCount,
      author: { "@id": AUTHOR_ID },
      isPartOf: {
        "@type": "Blog",
        name: "Kiến thức Excel",
        url: absoluteUrl("/kien-thuc-excel"),
      },
      /*
       * `about` trỏ tới đúng những trang mà bài này dẫn đi. Nó nói với Google
       * rằng ba khu của site nói về những thực thể liên quan nhau, thay vì là
       * ba đống nội dung rời — và nó chỉ khai được vì luật chống ăn thịt buộc
       * bài phải trỏ ra chứ không được viết lại.
       */
      about: [
        ...post.templateRefs.flatMap((s) => {
          const t = templateBySlug.get(s);
          return t ? [{ "@type": "Thing", name: t.h1, url: absoluteUrl(t.href) }] : [];
        }),
        ...post.functionRefs.flatMap((s) => {
          const fn = getFunction(s);
          return fn
            ? [
                {
                  "@type": "Thing",
                  name: `Hàm ${fn.name}`,
                  url: absoluteUrl(`/ham-excel/${fn.slug}`),
                },
              ]
            : [];
        }),
      ],
    },
    personNode(),
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
      { name: pillarInfo.name, path: pillarHref },
      { name: post.h1, path: post.href },
    ]),
    faqPage(post.faq),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*
        Trang rộng max-w-6xl nhưng CỘT CHỮ vẫn max-w-3xl. Quy tắc long-form
        trong DESIGN.md nói về chiều rộng dòng chữ, không phải chiều rộng
        trang; cột mục lục bên trái nằm ngoài cột chữ nên không phạm.
      */}
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <PillarOutline
            posts={siblings}
            currentSlug={post.slug}
            pillarName={pillarInfo.name}
            pillarHref={pillarHref}
          />

          <article className="min-w-0">
            <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
              <Link href="/" className="hover:text-input">
                Trang chủ
              </Link>
              <span aria-hidden> / </span>
              <Link href="/kien-thuc-excel" className="hover:text-input">
                Kiến thức Excel
              </Link>
              <span aria-hidden> / </span>
              <Link href={pillarHref} className="hover:text-input">
                {pillarInfo.name}
              </Link>
            </nav>

            <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.05] text-balance sm:text-5xl">
              {post.h1}
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-ink-soft">{post.intro}</p>

            <div className="mt-8 max-w-3xl">
              <PostNav
                prev={post.prev}
                next={post.next}
                position={post.position}
                variant="gon"
              />
            </div>

            <div className="max-w-3xl">
              <PostToc items={post.toc} />
              <PostBody body={post.body} />

              <h2 className="font-display mt-24 text-3xl">Câu hỏi thường gặp</h2>
              <FaqList items={post.faq} className="mt-5" />

              <Quiz items={post.quiz} />

              {/*
                Dải luyện tập, chỉ hiện khi bài này đã có trang bài tập. Bài
                chưa có thì không render gì — không có ô "sắp ra mắt", cùng lý
                do với hub bài tập.
              */}
              {exercise && (
                <section className="mt-24 border border-rule bg-panel p-6">
                  <p className="text-xs text-ink-faint">Luyện tập bài này</p>
                  <Link
                    href={exercise.href}
                    className="font-display mt-1 block text-lg hover:text-input"
                  >
                    {exercise.h1}
                  </Link>
                  <p className="mt-2 text-sm text-ink-soft">
                    {exercise.tasks.length} yêu cầu trên một bộ dữ liệu chép
                    được vào Excel, kèm lời giải giải thích từng bước.
                  </p>
                </section>
              )}

              <PostNav
                prev={post.prev}
                next={post.next}
                position={post.position}
              />
            </div>

            {related.length > 0 && (
              <section>
                <h2 className="font-display mt-24 text-3xl">Bài liên quan</h2>
                <ul className={`mt-5 ${cardGridClass(related.length)}`}>
                  {related.map((item) => (
                    <PostCard key={item.slug} post={item} />
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-24">
              <CourseCta
                target={post.ctaTarget}
                text={post.ctaText}
                campaign="kien-thuc"
                content={post.slug}
              />
            </div>

            <p className="mt-24 text-sm text-ink-faint">
              Cập nhật{" "}
              <time dateTime={post.updatedAt}>
                {new Date(post.updatedAt).toLocaleDateString("vi-VN")}
              </time>{" "}
              · {post.wordCount} từ · {SITE_NAME}
            </p>

            <div className="mt-6">
              <AuthorByline />
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
