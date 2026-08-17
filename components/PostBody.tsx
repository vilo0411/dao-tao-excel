import Link from "next/link";
import Image from "next/image";
import { CopyButton } from "@/components/CopyButton";
import { FormulaSandbox } from "@/components/FormulaSandbox";
import { SheetPreview } from "@/components/SheetPreview";
import { VideoTip } from "@/components/VideoTip";
import { slugifyHeading, type Block } from "@/lib/knowledge-schema";
import { getAllTemplates } from "@/lib/templates";
import { getFunction } from "@/lib/functions";
import { getAllVideos } from "@/lib/videos";
import { display } from "@/lib/schema";

/**
 * Render thân bài từ mảng khối có kiểu.
 *
 * CỐ Ý KHÔNG mang "use client", dù nó bọc ba component client (SheetPreview,
 * FormulaSandbox, CopyButton, VideoTip). Đây là bài học đã ghi ở
 * components/VideoTipSection.tsx:8-18: đánh dấu client ở lớp bọc thì mọi trang
 * bài đều kéo theo chunk JavaScript của cả bốn thứ, kể cả bài chỉ có chữ. Để
 * nó là server component thì bài nào có khối nào mới tải chunk của khối đó.
 *
 * Nhờ là server component, khối `sheet` gọi thẳng getTemplate() và khối
 * `functionRef` gọi thẳng getFunction() — không phải truyền dữ liệu template
 * xuống qua props từ trang.
 *
 * Chiều rộng: mọi khối đều bó trong max-w-prose TRỪ bảng, lưới bảng tính và
 * sandbox. Ba thứ đó là bảng tính, và bảng tính cần bề ngang; bó chúng vào
 * chiều rộng dòng chữ chỉ tạo ra thanh cuộn ngang không cần thiết.
 */

function Heading({ level, text }: { level: 2 | 3; text: string }) {
  const id = slugifyHeading(text);
  // scroll-mt-8 để neo không dán tiêu đề sát mép trên khi nhảy tới —
  // cùng lớp đang dùng ở app/ham-excel/[function]/page.tsx.
  return level === 2 ? (
    <h2 id={id} className="font-display mt-16 scroll-mt-8 text-3xl">
      {text}
    </h2>
  ) : (
    <h3 id={id} className="font-display mt-10 scroll-mt-8 text-xl">
      {text}
    </h3>
  );
}

function CalloutBlock({ block }: { block: Extract<Block, { type: "callout" }> }) {
  /*
   * Ba sắc thái, và chỉ sắc thái cảnh báo được dùng màu `flag`.
   *
   * `flag` trong hệ thiết kế mang nghĩa "ô đang lỗi" (DESIGN.md, sheet-error-cell).
   * Dùng nó cho mẹo hay lưu ý là mượn màu để trang trí, đúng thứ DESIGN.md:542
   * cấm. Hai sắc thái kia vì vậy chỉ khác nhau ở nhãn chữ, không ở màu.
   */
  const warn = block.tone === "canh-bao";
  const label =
    block.tone === "canh-bao" ? "Cảnh báo" : block.tone === "meo" ? "Mẹo" : "Lưu ý";

  return (
    <aside
      className={`mt-8 max-w-prose border-l-2 py-1 pl-5 ${warn ? "border-flag" : "border-rule"}`}
    >
      <p className={`text-sm font-medium ${warn ? "text-flag" : "text-ink-faint"}`}>
        {label} · {block.title}
      </p>
      <p className="mt-2 text-ink-soft">{block.text}</p>
    </aside>
  );
}

function ErrorCaseBlock({
  block,
}: {
  block: Extract<Block, { type: "errorCase" }>;
}) {
  /*
   * Khối này là dấu hiệu thị giác riêng của cả cụm Lỗi Excel, và nó dùng
   * `sheet-error-cell` — token đã có trong DESIGN.md:484 nhưng trước bài viết
   * này thì chưa trang nào dùng tới. Bo góc 0, font mono, chữ `flag`: đúng
   * hình dạng một ô Excel đang báo lỗi. Không phải màu mượn, đúng nghĩa gốc.
   */
  return (
    <div className="mt-8 border border-rule">
      <p className="border-b border-rule bg-panel px-4 py-2 font-mono text-sm text-flag">
        {block.error}
      </p>
      <dl className="divide-y divide-rule">
        <div className="px-4 py-4">
          <dt className="text-sm font-medium text-ink-faint">Vì sao xảy ra</dt>
          <dd className="mt-1 max-w-prose text-ink-soft">{block.cause}</dd>
        </div>
        <div className="px-4 py-4">
          <dt className="text-sm font-medium text-ink-faint">Cách sửa</dt>
          <dd className="mt-1 max-w-prose text-ink-soft">{block.fix}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Tô tên hàm trong công thức thành link sang /ham-excel.
 *
 * Đây là TẦNG C của luật chống ăn thịt keyword, ở phía hiển thị. Loader đã ép
 * bài phải khai mọi hàm-có-trang mà công thức dùng; chỗ này biến lời khai đó
 * thành link thật. Nhờ vậy bài không cần giải thích cú pháp — nó chỉ đường.
 *
 * Kỹ thuật mượn từ markFunction ở app/ham-excel/[function]/page.tsx, đảo
 * chiều: ở đó tô để nhấn mạnh một hàm, ở đây tô để dẫn đi.
 */
function linkFunctions(formula: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const m of formula.matchAll(/\b([A-Z][A-Z0-9.]*)\s*\(/g)) {
    const name = m[1];
    const entry = getFunction(name.toLowerCase());
    if (!entry) continue;

    const start = m.index!;
    if (start > last) parts.push(formula.slice(last, start));
    parts.push(
      <Link
        key={`${name}-${start}`}
        href={`/ham-excel/${entry.slug}`}
        className="text-computed underline decoration-computed/40 underline-offset-2 hover:decoration-computed"
      >
        {name}
      </Link>,
    );
    last = start + name.length;
  }

  if (last < formula.length) parts.push(formula.slice(last));
  return parts;
}

function FormulaBlock({ block }: { block: Extract<Block, { type: "formula" }> }) {
  return (
    <figure className="mt-8">
      <div className="overflow-x-auto border border-rule bg-panel px-4 py-3">
        <code className="font-mono text-sm whitespace-pre text-ink">
          {linkFunctions(block.formula)}
        </code>
      </div>
      <figcaption className="mt-2 max-w-prose text-sm text-ink-soft">
        {block.note}
      </figcaption>
      {block.caption && (
        <p className="mt-1 max-w-prose text-xs text-ink-faint">{block.caption}</p>
      )}
    </figure>
  );
}

function TableBlock({ block }: { block: Extract<Block, { type: "table" }> }) {
  return (
    <figure className="mt-8">
      <div className="overflow-x-auto border border-rule">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-panel">
              {block.headers.map((h) => (
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
            {block.rows.map((row, r) => (
              <tr key={r} className="not-first:border-t not-first:border-rule">
                {row.map((cell, c) => (
                  <td key={c} className="px-4 py-2 text-ink-soft not-first:border-l not-first:border-rule">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 max-w-prose text-sm text-ink-faint">
        {block.caption}
      </figcaption>
      {block.copyable && (
        <CopyButton rows={[block.headers, ...block.rows]} label="Chép bảng vào Excel" />
      )}
    </figure>
  );
}

function SheetBlock({ block }: { block: Extract<Block, { type: "sheet" }> }) {
  const template = getAllTemplates().find((t) => t.slug === block.templateSlug);
  // Loader đã kiểm template tồn tại và sheetIndex nằm trong tầm (lib/knowledge.ts),
  // nên nhánh này không chạy trên dữ liệu hợp lệ. Giữ để TypeScript yên tâm.
  if (!template) return null;

  const sheet = template.sheets[block.sheetIndex];

  return (
    <figure className="mt-8">
      <SheetPreview
        sheet={sheet}
        computed={template.computed?.[block.sheetIndex]}
      />
      <figcaption className="mt-3 max-w-prose text-sm text-ink-soft">
        {block.note}{" "}
        <Link
          href={template.href}
          className="text-input underline decoration-input/40 underline-offset-2 hover:decoration-input"
        >
          Mở trang file {template.h1}
        </Link>
        .
      </figcaption>
      {/*
        Chép ra tiêu đề cột cộng các dòng mẫu người dùng nhập tay — KHÔNG chép
        cột công thức. Dán một cột công thức dưới dạng giá trị tĩnh vào Excel
        là tạo ra một bảng trông đúng mà không tính lại được, đúng thứ cả site
        này viết ra để chống lại.
      */}
      {block.copyable && (
        <CopyButton
          rows={[
            sheet.columns.filter((c) => !c.formula).map((c) => c.header),
            ...sheet.sampleRows.map((row) =>
              sheet.columns
                .filter((c) => !c.formula)
                .map((c) => display(row[c.key], c.type)),
            ),
          ]}
          label="Chép dữ liệu mẫu vào Excel"
        />
      )}
    </figure>
  );
}

function RefBlock({
  href,
  kicker,
  title,
  meta,
  why,
}: {
  href: string;
  kicker: string;
  title: string;
  meta?: string;
  why: string;
}) {
  return (
    <aside className="mt-8 max-w-prose border border-rule bg-panel p-5">
      <p className="text-xs text-ink-faint">{kicker}</p>
      <Link href={href} className="font-display mt-1 block text-lg hover:text-input">
        {title}
      </Link>
      {meta && (
        <p className="mt-1 font-mono text-xs text-computed">{meta}</p>
      )}
      <p className="mt-3 text-sm text-ink-soft">{why}</p>
    </aside>
  );
}

export function PostBody({ body }: { body: Block[] }) {
  return (
    <div>
      {body.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={i} className="mt-6 max-w-prose text-ink-soft">
                {block.text}
              </p>
            );

          case "heading":
            return <Heading key={i} level={block.level} text={block.text} />;

          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={`mt-6 max-w-prose space-y-2 pl-5 text-ink-soft ${
                  block.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </Tag>
            );
          }

          case "steps":
            return (
              <ol key={i} className="mt-8 max-w-prose divide-y divide-rule border-y border-rule">
                {block.items.map((item, s) => (
                  <li key={item.step} className="flex gap-4 py-5">
                    <span className="font-mono text-sm text-ink-faint">
                      {String(s + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-medium">{item.step}</p>
                      <p className="mt-1 text-ink-soft">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            );

          case "table":
            return <TableBlock key={i} block={block} />;

          case "formula":
            return <FormulaBlock key={i} block={block} />;

          case "errorCase":
            return <ErrorCaseBlock key={i} block={block} />;

          case "callout":
            return <CalloutBlock key={i} block={block} />;

          case "image":
            return (
              <figure key={i} className="mt-8">
                <Image
                  src={block.src}
                  alt={block.alt}
                  width={block.width}
                  height={block.height}
                  className="h-auto w-full rounded-md border border-rule"
                />
                {block.caption && (
                  <figcaption className="mt-2 max-w-prose text-sm text-ink-faint">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "sheet":
            return <SheetBlock key={i} block={block} />;

          case "video": {
            const video = getAllVideos().find((v) => v.id === block.tiktokId);
            if (!video) return null;
            return (
              <div key={i} className="mt-8 max-w-md">
                {/* Bóc từng trường thay vì truyền cả object: xem VideoTipProps. */}
                <VideoTip
                  video={{
                    id: video.id,
                    title: video.title,
                    poster: video.poster,
                    templates: video.templates,
                    functions: video.functions,
                  }}
                />
              </div>
            );
          }

          case "functionRef": {
            const fn = getFunction(block.slug);
            if (!fn) return null;
            return (
              <RefBlock
                key={i}
                href={`/ham-excel/${fn.slug}`}
                kicker="Hàm dùng trong bài"
                title={`Hàm ${fn.name}`}
                meta={fn.syntax}
                why={block.why}
              />
            );
          }

          case "templateRef": {
            const t = getAllTemplates().find((x) => x.slug === block.slug);
            if (!t) return null;
            return (
              <RefBlock
                key={i}
                href={t.href}
                kicker="File mẫu liên quan"
                title={t.h1}
                why={block.why}
              />
            );
          }

          case "sandbox":
            return (
              <FormulaSandbox
                key={i}
                title={block.title}
                grid={block.grid}
                prompt={block.prompt}
                answer={block.answer}
                expected={block.expected}
                hint={block.hint}
              />
            );
        }
      })}
    </div>
  );
}
