import Link from "next/link";
import {
  ROLE_LABEL,
  ROLES,
  type NodeRole,
  type SystemEdge,
  type SystemMapData,
  type SystemNode,
} from "@/lib/systems-schema";

/**
 * Sơ đồ một bộ file: file nào đưa dữ liệu gì sang file nào.
 *
 * Vẽ bằng ngôn ngữ bảng tính chứ không phải flowchart — ô vuông góc, dải chữ
 * cái cột A/B/C ở trên, font mono cho nhãn. Ba cột là ba vai trò, và luật
 * "edge phải chảy sang hạng cao hơn" trong lib/systems-schema.ts bảo đảm mọi
 * mũi tên đều đi từ trái sang phải, không có đường nào phải quay ngược.
 *
 * Hai màu input / computed ở đây vẫn mang đúng nghĩa gốc của chúng, chỉ nâng
 * từ cấp ô lên cấp file: xanh dương = file bạn gõ tay, xanh lá = file Excel
 * kéo số từ file khác về. Đây là lý do được phép dùng chúng ngoài SheetPreview.
 *
 * KHÔNG có phép đo layout nào ở đây, và đó là quyết định thiết kế chứ không
 * phải sự lười. Bản trước vẽ mũi tên bằng SVG toạ độ tuyệt đối, nên phải chạy
 * useLayoutEffect + ResizeObserver + document.fonts.ready mới có đường — tức
 * là HTML tĩnh ra đời không có sơ đồ, và các ô nhảy chỗ một nhịp sau khi font
 * tải xong. Ở đây mũi tên là DOM thật nằm trong một cột nối riêng của lưới,
 * nên sơ đồ đúng ngay từ byte đầu tiên và tự đổi trục bằng CSS:
 *
 *   < lg  xếp dọc, mũi tên chỉ xuống, nhãn nằm bên phải đường
 *   >= lg ba cột ngang, mũi tên chỉ phải, nhãn nằm trên đường
 *
 * Cùng một DOM cho cả hai, chỉ khác flex-direction và một cú xoay 90 độ của
 * đầu mũi tên. Đổi được vì mọi mũi tên đều nối hai cột liền nhau — xem
 * SkipChip bên dưới để biết cạnh vượt cột đi đâu.
 */

export function SystemMap({ map }: { map: SystemMapData }) {
  const columns = ROLES.map((role) => ({
    role,
    nodes: map.nodes.filter((n) => n.role === role),
  })).filter((c) => c.nodes.length > 0);

  // Cột hiển thị được đánh lại chỉ số sau khi bỏ vai trò rỗng, để chữ cái cột
  // luôn là A, B, C liền mạch chứ không nhảy cóc.
  const columnOf = new Map<string, number>();
  columns.forEach((col, i) => {
    for (const node of col.nodes) columnOf.set(node.slug, i);
  });

  const span = (edge: SystemEdge) =>
    (columnOf.get(edge.to) ?? 0) - (columnOf.get(edge.from) ?? 0);

  const nameOf = (slug: string) =>
    map.nodes.find((n) => n.slug === slug)?.shortName ?? slug;

  /*
   * Lưới một mạch: [cột A][khe A→B][cột B][khe B→C][cột C]. Số cột phụ thuộc
   * dữ liệu nên template phải tính ở runtime, nhưng chỉ áp dụng từ lg trở lên
   * — dưới đó grid về một cột và đúng thứ tự DOM này trở thành luồng dọc.
   */
  const template = columns.map(() => "minmax(0,1fr)").join(" auto ");

  return (
    <figure className="not-prose">
      <div
        className="grid grid-cols-1 border border-rule lg:grid-cols-(--map-cols)"
        style={{ "--map-cols": template } as React.CSSProperties}
      >
        {/* Dải chữ cái cột: khung của bảng tính, không phải dữ liệu. Dưới lg
            nó biến mất cùng với trục ngang mà nó đang gán nhãn. */}
        {columns.flatMap((col, index) => [
          index > 0 && (
            <div
              key={`head-gap-${index}`}
              aria-hidden
              className="hidden border-b border-rule bg-panel lg:block"
            />
          ),
          <div
            key={`head-${col.role}`}
            aria-hidden
            className="hidden border-b border-rule bg-panel px-3 py-1 text-center text-xs text-ink-faint lg:block cell-ref"
          >
            {String.fromCharCode(65 + index)} · {ROLE_LABEL[col.role]}
          </div>,
        ])}

        {columns.flatMap((col, index) => [
          index > 0 && (
            <Connector
              key={`gap-${index}`}
              edges={map.edges.filter(
                (e) =>
                  columnOf.get(e.from) === index - 1 &&
                  columnOf.get(e.to) === index,
              )}
              // Khe chỉ cần nói "sang file nào" khi cột đích có nhiều hơn một
              // file để nhầm; cột đích một file thì mũi tên đã tự rõ.
              nameOf={col.nodes.length > 1 ? nameOf : undefined}
            />
          ),
          <div
            key={col.role}
            className="flex flex-col gap-4 p-4 lg:gap-5 lg:p-5"
          >
            {col.nodes.map((node) => (
              <NodeBox
                key={node.slug}
                node={node}
                skips={map.edges.filter(
                  (e) => e.from === node.slug && span(e) > 1,
                )}
                nameOf={nameOf}
              />
            ))}
          </div>,
        ])}
      </div>

      {/*
        Bản bằng chữ của phần hình học. Mũi tên vô nghĩa với trình đọc màn hình
        và với Google, nên luồng dữ liệu luôn có một bảng ma trận nguồn × đích
        đứng sau — không phụ thuộc vào việc CSS nào đang áp dụng.
      */}
      <EdgeMatrix map={map} nameOf={nameOf} />

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="bg-input-bg border-input/40 inline-block h-3 w-3 border"
          />
          file bạn nhập tay
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="bg-computed-bg border-computed/40 inline-block h-3 w-3 border"
          />
          file tự kéo số về
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 border border-dashed border-rule bg-panel"
          />
          đang dựng
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Khe giữa hai cột: mỗi cạnh là một đường kẻ có nhãn dữ liệu chảy qua nó.
 *
 * Cả cụm là một phần tử lưới bình thường nên nó tự giãn theo cột hai bên,
 * không có toạ độ nào phải tính lại khi bề rộng đổi.
 */
function Connector({
  edges,
  nameOf,
}: {
  edges: SystemEdge[];
  nameOf?: (slug: string) => string;
}) {
  if (edges.length === 0) return <div aria-hidden />;

  return (
    <ul
      aria-hidden
      className="flex flex-col justify-center gap-3 border-y border-rule bg-panel/60 px-4 py-3 lg:w-36 lg:gap-4 lg:border-x lg:border-y-0 lg:px-2"
    >
      {edges.map((edge) => (
        <li
          key={`${edge.from}->${edge.to}`}
          className="flex items-center gap-3 lg:flex-col lg:gap-1"
        >
          {/* Đường kẻ + đầu mũi tên. Dọc ở màn hẹp, ngang từ lg — cùng một
              DOM, khác mỗi trục flex và một cú xoay đầu mũi tên. */}
          <span className="flex min-h-10 shrink-0 flex-col items-center self-stretch lg:order-2 lg:min-h-0 lg:w-full lg:flex-row">
            <span className="w-px flex-1 bg-rule lg:h-px lg:w-auto" />
            <svg
              width="7"
              height="7"
              viewBox="0 0 8 8"
              className="rotate-90 lg:rotate-0"
              fill="var(--color-ink-faint)"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" />
            </svg>
          </span>

          <span className="cell-ref text-[11px] leading-tight text-ink-faint lg:order-1 lg:text-center lg:text-[10px]">
            {nameOf && (
              <span className="block text-ink-soft">→ {nameOf(edge.to)}</span>
            )}
            {edge.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

const NODE_TONE: Record<NodeRole, string> = {
  input: "border-input bg-input-bg",
  process: "border-computed bg-computed-bg",
  master: "border-computed bg-computed-bg",
};

/**
 * Một ô trên sơ đồ. Bo góc 0 tuyệt đối — đây vẫn là tầng bảng tính.
 * Node chưa có file thì không phải link: gửi người đọc tới một trang 404 để
 * chứng minh bộ file "đầy đủ" thì thà để ô mờ và nói thẳng là đang dựng.
 */
function NodeBox({
  node,
  skips,
  nameOf,
}: {
  node: SystemNode;
  skips: SystemEdge[];
  nameOf: (slug: string) => string;
}) {
  const planned = node.status === "planned";
  const tone = planned
    ? "border-dashed border-rule bg-panel text-ink-faint"
    : NODE_TONE[node.role];

  const body = (
    <>
      <span className="cell-ref flex items-baseline justify-between gap-2 text-[11px] uppercase">
        <span className={planned ? "" : "text-ink-faint"}>
          {node.role === "master" ? "File tổng" : ROLE_LABEL[node.role]}
        </span>
        {planned && <span className="text-ink-faint">đang dựng</span>}
      </span>
      <span className="mt-1 block font-medium text-pretty">{node.shortName}</span>
      <span className="mt-1 block text-xs text-ink-faint">{node.owner}</span>

      {/*
        Cạnh vượt cột không vẽ được bằng đường kẻ: nó phải xuyên qua cả cột
        giữa. Bản trước cho nó đi vòng ngoài lưới, tốn cỡ một phần tư diện tích
        sơ đồ để nói một ý mà một dòng chữ nói xong — nên giờ nó là dòng chữ.
      */}
      {skips.map((edge) => (
        <span
          key={edge.to}
          className="cell-ref mt-2 block border-t border-dotted border-current/25 pt-1 text-[10px] leading-tight text-ink-faint"
        >
          → thẳng sang {nameOf(edge.to)}: {edge.label}
        </span>
      ))}
    </>
  );

  const className = `block border px-3 py-3 text-sm ${tone} ${
    node.role === "master" ? "border-2" : ""
  }`;

  if (planned || !node.href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link
      href={node.href}
      className={`${className} transition-colors hover:border-ink`}
    >
      {body}
    </Link>
  );
}

/**
 * Ma trận nguồn × đích — cùng dữ liệu với sơ đồ, không có hình học.
 *
 * Để sr-only chứ không hiện ở màn hẹp: luồng dọc phía trên đã in đủ nhãn từng
 * cạnh rồi, bày thêm một bảng nữa chỉ là nói lại y nguyên. Nó tồn tại để
 * trình đọc màn hình và crawler có một cấu trúc thật để đọc — bảng có tiêu đề
 * hàng/cột nói được "ai đưa gì cho ai" chặt hơn danh sách câu rời.
 */
function EdgeMatrix({
  map,
  nameOf,
}: {
  map: SystemMapData;
  nameOf: (slug: string) => string;
}) {
  const targets = map.nodes.filter((n) => map.edges.some((e) => e.to === n.slug));
  const sources = map.nodes.filter((n) =>
    map.edges.some((e) => e.from === n.slug),
  );

  return (
    <table className="sr-only">
      <caption>Dữ liệu chảy từ file nào sang file nào</caption>
      <thead>
        <tr>
          <th scope="col">File nguồn</th>
          {targets.map((t) => (
            <th key={t.slug} scope="col">
              {t.shortName}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sources.map((source) => (
          <tr key={source.slug}>
            <th scope="row">{source.shortName}</th>
            {targets.map((target) => {
              const edge = map.edges.find(
                (e) => e.from === source.slug && e.to === target.slug,
              );
              return (
                <td key={target.slug}>
                  {edge
                    ? `${nameOf(source.slug)} đưa ${edge.label} sang ${nameOf(target.slug)}`
                    : "không nối"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
