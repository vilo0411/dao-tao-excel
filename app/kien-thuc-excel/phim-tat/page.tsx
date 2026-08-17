import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/Author";
import { ShortcutTable } from "@/components/ShortcutTable";
import { getShortcutGroups, getShortcuts } from "@/lib/knowledge";
import { breadcrumbList, graph } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";

/**
 * Bảng tra phím tắt Excel.
 *
 * Trang tra cứu, không phải bài viết — nên JSON-LD chỉ có BreadcrumbList.
 * Khai Article cho một bảng tra là mô tả sai thứ nó là.
 *
 * Về chủ đề, chỗ đúng của nó là cụm "Excel cơ bản" (chưa mở), nên tạm thời nó
 * đứng thẳng dưới /kien-thuc-excel. Khi cụm đó mở, cân nhắc chuyển vào và đặt
 * 301 — đừng để hai URL cùng phục vụ một nội dung.
 */

export const metadata: Metadata = {
  title: "Phím tắt Excel — bảng tra có tìm kiếm, cho Windows và macOS",
  description:
    "Bảng tra hơn 70 phím tắt Excel theo nhóm việc, có ô tìm kiếm và chuyển giữa Windows với macOS. Tìm theo việc muốn làm, hoặc theo tổ hợp phím.",
  alternates: { canonical: absoluteUrl("/kien-thuc-excel/phim-tat") },
};

export default function ShortcutsPage() {
  const data = getShortcuts();
  if (!data) notFound();

  const groups = getShortcutGroups();

  const jsonLd = graph(
    breadcrumbList([
      { name: "Trang chủ", path: "/" },
      { name: "Kiến thức Excel", path: "/kien-thuc-excel" },
      { name: "Phím tắt Excel", path: "/kien-thuc-excel/phim-tat" },
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
          Phím tắt Excel
        </h1>
        <p className="mt-6 max-w-prose text-lg text-ink-soft">
          {data.shortcuts.length} tổ hợp phím xếp theo nhóm việc, không phải
          theo bảng chữ cái. Gõ vào ô tìm kiếm để lọc — tìm được cả theo việc
          bạn muốn làm lẫn theo tổ hợp phím bạn nhớ mang máng.
        </p>
        <p className="mt-4 max-w-prose text-ink-soft">
          Vài tổ hợp trong bảng này gắn thẳng với các bài sửa lỗi của site.
          Ctrl và End là cách chẩn đoán{" "}
          <Link
            href="/kien-thuc-excel/loi-excel/file-excel-nang-va-cham"
            className="text-input underline decoration-input/40 underline-offset-2 hover:decoration-input"
          >
            file Excel nặng bất thường
          </Link>
          ; Ctrl và dấu huyền là thứ tắt chế độ{" "}
          <Link
            href="/kien-thuc-excel/loi-excel/excel-hien-cong-thuc-thay-vi-ket-qua"
            className="text-input underline decoration-input/40 underline-offset-2 hover:decoration-input"
          >
            hiện công thức thay vì kết quả
          </Link>
          ; và Ctrl với T là cách chặn{" "}
          <Link
            href="/kien-thuc-excel/loi-excel/excel-loc-khong-het-du-lieu"
            className="text-input underline decoration-input/40 underline-offset-2 hover:decoration-input"
          >
            bộ lọc bỏ sót dòng
          </Link>
          .
        </p>

        <ShortcutTable shortcuts={data.shortcuts} groups={groups} />

        <p className="mt-12 text-sm text-ink-faint">
          Dấu gạch ngang ở cột macOS nghĩa là hệ điều hành đó không có tổ hợp
          tương đương, chứ không phải chưa điền. Nhiều lệnh trên macOS phải đi
          qua thanh trình đơn.
        </p>

        <section className="mt-24 rounded-lg bg-surface-strong p-12">
          <h2 className="font-display text-3xl text-balance">
            Nhớ phím tắt không làm bảng tính hết lỗi
          </h2>
          <p className="mt-5 max-w-prose text-ink-soft">
            Phần lớn thời gian mất đi trong Excel không phải vì gõ chậm, mà vì
            một cột tính sai và không ai biết. Cụm bài về lỗi đi đúng vào đó.
          </p>
          <Link
            href="/kien-thuc-excel/loi-excel"
            className="mt-8 inline-block rounded-lg bg-ink px-6 py-4 font-medium text-paper hover:opacity-85"
          >
            Mở cụm Lỗi Excel
          </Link>
        </section>

        <p className="mt-24 text-sm text-ink-faint">
          Cập nhật{" "}
          <time dateTime={data.updatedAt}>
            {new Date(data.updatedAt).toLocaleDateString("vi-VN")}
          </time>
        </p>

        <div className="mt-6">
          <AuthorByline />
        </div>
      </div>
    </>
  );
}
