import type { Metadata } from "next";
import { AuthorCard } from "@/components/Author";
import { CourseCta } from "@/components/CourseCta";
import { LeadForm } from "@/components/LeadForm";
import { absoluteUrl, IS_PREVIEW } from "@/lib/site";
import { AUTHOR } from "@/lib/author";

export const metadata: Metadata = {
  title: "Khóa học Excel tôi giới thiệu cho người đi làm",
  description:
    "Vì sao tôi giới thiệu khóa Excel của HVS Tài Chính Số, khóa này dạy gì, và ai thì không nên học. Để lại thông tin nếu bạn muốn được tư vấn.",
  alternates: { canonical: absoluteUrl("/khoa-hoc-excel") },
};

/** Nội dung khóa học, dẫn theo thông tin công bố trên trang của HVS. */
const MODULES = [
  {
    title: "Nền tảng bảng tính đúng chuẩn",
    detail:
      "Cấu trúc dữ liệu dạng bảng, định dạng số, và những thói quen khiến công thức vỡ khi thêm dòng.",
  },
  {
    title: "Nhóm hàm xử lý dữ liệu",
    detail:
      "IF và IF lồng nhau, IFERROR, SUMIF, COUNTIF, VLOOKUP và XLOOKUP — đúng các hàm nằm trong file bạn vừa tải ở đây.",
  },
  {
    title: "Tổng hợp và báo cáo",
    detail:
      "PivotTable, lọc và nhóm dữ liệu, dựng báo cáo tự cập nhật khi số liệu thay đổi.",
  },
  {
    title: "Dashboard quản trị",
    detail:
      "Thiết kế chỉ tiêu, biểu đồ và dashboard theo dõi — phần trọng tâm của khóa Excel ứng dụng cho nhân sự.",
  },
];

const REASONS = [
  {
    point: "Dạy cách dựng lại, không dạy cách chép",
    detail:
      "Phần lớn nội dung Excel miễn phí trên mạng là làm theo từng bước. Xong bài thì làm được đúng bài đó, đổi yêu cầu một chút là tắc. Khóa này đi vào vì sao công thức chạy như vậy.",
  },
  {
    point: "Đúng nhóm hàm mà công việc văn phòng cần",
    detail:
      "Không sa vào VBA hay những thứ hiếm dùng. Trọng tâm là nhóm hàm và thao tác chiếm gần hết khối lượng việc thật ở văn phòng.",
  },
  {
    point: "Có phần dashboard, thứ khó tự học nhất",
    detail:
      "Hàm thì tra mạng được. Còn bố cục một dashboard đọc được và tự cập nhật thì cần người đã làm chỉ lại.",
  },
];

export default function CoursePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Khóa học Excel ứng dụng cho người đi làm",
    description:
      "Khóa học Excel từ nền tảng đến dashboard quản trị, do HVS Tài Chính Số tổ chức.",
    inLanguage: "vi-VN",
    url: absoluteUrl("/khoa-hoc-excel"),
    provider: {
      "@type": "Organization",
      name: "HVS Tài Chính Số",
      url: "https://taichinhso.hvsvn.com/thuc-tap-so",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-5 py-14">
        <div className="max-w-2xl">
          <p className="cell-ref text-sm text-ink-faint">
            {AUTHOR.name} giới thiệu
          </p>
          <h1 className="font-display mt-3 text-4xl leading-[1.1] font-bold text-balance sm:text-5xl">
            Đến lúc nào thì nên đi học Excel
          </h1>
          <p className="mt-6 max-w-prose text-lg text-ink-soft">
            File mẫu giải quyết được việc của hôm nay. Nhưng nếu tháng nào bạn
            cũng phải đi tìm một file khác vì yêu cầu vừa đổi, thì thứ bạn thiếu
            không phải là thêm một file nữa.
          </p>
        </div>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="font-display text-2xl font-bold">
              Vì sao tôi giới thiệu khóa này
            </h2>
            <ul className="mt-6 space-y-6">
              {REASONS.map((reason) => (
                <li key={reason.point} className="border-l-2 border-input pl-5">
                  <p className="font-medium">{reason.point}</p>
                  <p className="mt-1 max-w-prose text-ink-soft">
                    {reason.detail}
                  </p>
                </li>
              ))}
            </ul>

            <h2 className="font-display mt-14 text-2xl font-bold">Học những gì</h2>
            {/* Đánh số vì đây là lộ trình có thứ tự, học phần sau cần phần trước. */}
            <ol className="mt-6 space-y-5">
              {MODULES.map((module, index) => (
                <li
                  key={module.title}
                  className="grid gap-1 sm:grid-cols-[2.5rem_1fr]"
                >
                  <span className="cell-ref pt-1 text-sm text-ink-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium">{module.title}</p>
                    <p className="mt-1 max-w-prose text-ink-soft">
                      {module.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <h2 className="font-display mt-14 text-2xl font-bold">
              Ai thì đừng học
            </h2>
            <p className="mt-4 max-w-prose text-ink-soft">
              Nếu bạn chỉ cần một bảng tính duy nhất cho một việc duy nhất, tải
              file ở đây là đủ, không cần trả tiền học. Nếu bạn đã dùng thạo
              PivotTable và viết được hàm lồng nhau, khóa này phần đầu sẽ nhàm.
              Tôi nói trước để bạn khỏi mất tiền oan.
            </p>

            <div className="mt-10 space-y-5">
              <CourseCta
                target="hrCourse"
                text="Nếu bạn làm nhân sự, đây là khóa sát nhất"
                content="bridge-page"
                campaign="bridge"
              />
              <p className="text-sm text-ink-soft">
                Làm mảng khác hoặc chưa rõ nên học khóa nào?{" "}
                <CourseCta
                  target="consult"
                  variant="inline"
                  text="Xem trang giới thiệu chương trình của HVS"
                  content="bridge-page"
                  campaign="bridge"
                />
                .
              </p>
            </div>

            <div className="mt-14">
              <AuthorCard />
            </div>
          </div>

          <aside className="h-fit border border-rule bg-panel p-6 lg:sticky lg:top-6">
            <h2 className="font-display text-xl font-bold">
              Muốn hỏi trước khi quyết định
            </h2>

            {IS_PREVIEW ? (
              /*
               * Bản tĩnh không có API route nhận lead. Thà bỏ hẳn form còn hơn
               * để một form bấm vào rồi im lặng — người dùng sẽ tưởng đã gửi.
               */
              <>
                <p className="mt-3 text-sm text-ink-soft">
                  Form nhận tư vấn chưa chạy trên bản xem thử này. Bạn có thể
                  liên hệ thẳng HVS qua trang giới thiệu chương trình.
                </p>
                <div className="mt-5">
                  <CourseCta
                    target="consult"
                    variant="inline"
                    text="Mở trang tư vấn của HVS"
                    content="preview-sidebar"
                    campaign="preview"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-ink-soft">
                  Để lại thông tin, đội ngũ HVS sẽ tư vấn lộ trình theo đúng
                  công việc bạn đang làm.
                </p>
                <div className="mt-6">
                  <LeadForm source="/khoa-hoc-excel" />
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
