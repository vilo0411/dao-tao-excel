import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { CopyButton } from "@/components/CopyButton";
import { FormulaSandbox } from "@/components/FormulaSandbox";
import { getAllExercises, getExercise } from "@/lib/knowledge";
import { AUTHOR_ID, breadcrumbList, graph, personNode } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllExercises().map((e) => ({ slug: e.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const ex = getExercise(slug);
  if (!ex) return {};

  return {
    title: { absolute: ex.metaTitle },
    description: ex.metaDesc,
    alternates: { canonical: absoluteUrl(ex.href) },
    openGraph: {
      type: "article",
      title: ex.metaTitle,
      description: ex.metaDesc,
      url: absoluteUrl(ex.href),
      modifiedTime: ex.updatedAt,
    },
  };
}

export default async function ExercisePage({ params }: Params) {
  const { slug } = await params;
  const ex = getExercise(slug);
  if (!ex) notFound();

  const jsonLd = graph(
    {
      /*
       * LearningResource chứ không phải BlogPosting: trang này không phải bài
       * đọc, nó là một bài tập có đề, có dữ liệu và có lời giải. Khai đúng thứ
       * nó là thì Google phân biệt được nó với bài lý thuyết cùng chủ đề — mà
       * đó chính là điều ta cần, vì hai trang này cố ý đứng cạnh nhau.
       */
      "@type": "LearningResource",
      name: ex.h1,
      description: ex.metaDesc,
      url: absoluteUrl(ex.href),
      inLanguage: "vi-VN",
      learningResourceType: "Bài tập thực hành",
      educationalLevel: "Người mới và trung cấp",
      dateModified: ex.updatedAt,
      author: { "@id": AUTHOR_ID },
      isBasedOn: absoluteUrl(ex.postHref),
    },
    personNode(),
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
      { name: "Bài tập", path: "/kien-thuc-excel/bai-tap" },
      { name: ex.h1, path: ex.href },
    ]),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-5 py-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <Link href="/" className="hover:text-input">
            Trang chủ
          </Link>
          <span aria-hidden> / </span>
          <Link href="/kien-thuc-excel" className="hover:text-input">
            Kiến thức Excel
          </Link>
          <span aria-hidden> / </span>
          <Link href="/kien-thuc-excel/bai-tap" className="hover:text-input">
            Bài tập
          </Link>
        </nav>

        <h1 className="font-display mt-5 text-4xl leading-[1.05] text-balance sm:text-5xl">
          {ex.h1}
        </h1>

        <p className="mt-6 text-lg text-ink-soft">{ex.brief}</p>

        {/* Link ngược về bài lý thuyết, đặt ngay đầu chứ không giấu ở chân trang. */}
        <aside className="mt-8 border border-rule bg-panel p-5">
          <p className="text-xs text-ink-faint">Lý thuyết của bài tập này</p>
          <Link
            href={ex.postHref}
            className="font-display mt-1 block text-lg hover:text-input"
          >
            {ex.postH1}
          </Link>
          <p className="mt-2 text-sm text-ink-soft">
            Nếu bạn chưa rõ nguyên nhân gốc thì đọc bài đó trước — trang này chỉ
            có đề, dữ liệu và lời giải, không giải thích lại.
          </p>
        </aside>

        <h2 className="font-display mt-24 text-3xl">Dữ liệu đề bài</h2>
        <figure className="mt-5">
          <div className="overflow-x-auto border border-rule">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-panel">
                  {ex.dataset.headers.map((h) => (
                    <th
                      key={h}
                      className="border-b border-rule px-4 py-2 font-medium not-first:border-l"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ex.dataset.rows.map((row, r) => (
                  <tr key={r} className="not-first:border-t not-first:border-rule">
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className="px-4 py-2 text-ink-soft not-first:border-l not-first:border-rule"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="mt-2 text-sm text-ink-faint">
            {ex.dataset.caption}
          </figcaption>
          <CopyButton
            rows={[ex.dataset.headers, ...ex.dataset.rows]}
            label="Chép dữ liệu vào Excel"
          />
        </figure>

        <h2 className="font-display mt-24 text-3xl">Yêu cầu</h2>
        <ol className="mt-5 divide-y divide-rule border-y border-rule">
          {ex.tasks.map((task, i) => (
            <li key={task.ask} className="flex gap-4 py-5">
              <span className="font-mono text-sm text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p>{task.ask}</p>
                {task.hint && (
                  <p className="mt-2 text-sm text-ink-faint">
                    Gợi ý: {task.hint}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <FormulaSandbox
          title={ex.sandbox.title}
          grid={ex.sandbox.grid}
          prompt={ex.sandbox.prompt}
          answer={ex.sandbox.answer}
          expected={ex.sandbox.expected}
          hint={ex.sandbox.hint}
        />

        {/*
          Lời giải để mở, không gập trong <details>.
          Gập lại nghe có vẻ đúng tinh thần bài tập, nhưng nó đánh đổi sai: người
          muốn tự làm thì không cuộn xuống, còn Google thì đọc được hết dù khối
          có gập hay không. Gập chỉ thêm một cú bấm cho người đã quyết định xem.
        */}
        <h2 className="font-display mt-24 text-3xl">Lời giải</h2>
        <p className="mt-5 text-ink-soft">
          Từng bước một, và mỗi bước nói rõ vì sao viết như vậy chứ không chỉ
          viết gì. Bước cuối cùng là công thức bạn nên dừng lại ở đó.
        </p>
        <ol className="mt-8 space-y-8">
          {ex.solution.map((step, i) => (
            <li key={step.formula}>
              <p className="font-mono text-sm text-ink-faint">Bước {i + 1}</p>
              <div className="mt-2 overflow-x-auto border border-rule bg-panel px-4 py-3">
                <code className="font-mono text-sm whitespace-pre text-ink">
                  {step.formula}
                </code>
              </div>
              <p className="mt-2 text-ink-soft">{step.why}</p>
            </li>
          ))}
        </ol>

        <p className="mt-24 text-sm text-ink-faint">
          Cập nhật{" "}
          <time dateTime={ex.updatedAt}>
            {new Date(ex.updatedAt).toLocaleDateString("vi-VN")}
          </time>
        </p>

        <div className="mt-6">
          <AuthorByline />
        </div>
      </div>
    </>
  );
}
