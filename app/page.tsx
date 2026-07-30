import Link from "next/link";
import type { Metadata } from "next";
import { AuthorCard } from "@/components/Author";
import { Faq } from "@/components/Faq";
import { FeatureGrid } from "@/components/FeatureGrid";
import { HeroSheet } from "@/components/HeroSheet";
import { cardGridClass, TemplateCard } from "@/components/TemplateCard";
import { getAllTemplates, toCardData } from "@/lib/templates";
import { absoluteUrl } from "@/lib/site";
import { AUTHOR } from "@/lib/author";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  const templates = getAllTemplates().slice(0, 6);
  const templateCount = getAllTemplates().length;

  // Ngày cập nhật lấy từ spec mới nhất chứ không viết tay: gõ cứng một tháng
  // vào JSX thì ba tháng nữa nó thành lời nói dối, mà không ai nhớ ra để sửa.
  // updatedAt là ISO date nên sort chuỗi đã đúng thứ tự thời gian.
  const lastUpdated = getAllTemplates()
    .map((t) => t.updatedAt)
    .sort()
    .at(-1);
  const [year, month] = lastUpdated?.split("-") ?? [];

  /*
   * Khối thông số bên phải hero. Nó trả lời đúng bốn câu hỏi người mới vào
   * hỏi trước khi chịu đọc: có bao nhiêu file, tải về là định dạng gì, có
   * dính macro không, trang này còn sống không.
   *
   * "0 macro" là sự thật kiểm được: file dựng bằng openpyxl ra .xlsx, mà
   * .xlsx theo chuẩn thì không chứa macro — muốn có macro phải là .xlsm.
   */
  const heroSpecs = [
    { label: "file", value: String(templateCount) },
    { label: "định dạng", value: ".xlsx" },
    { label: "macro", value: "0" },
    ...(year ? [{ label: "cập nhật", value: `${month}/${year}` }] : []),
  ];

  // Bảng demo dựng theo file bảng lương. Link tới file thật nếu nó còn tồn
  // tại — đổi slug hay bỏ file đi thì phần chú thích tự rút link, không gãy.
  const demoHref = getAllTemplates().find(
    (t) => t.slug === "bang-tinh-luong-nhan-vien",
  )?.href;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-16 pb-24 sm:pt-20">
      {/*
        Hero không có nền, không viền, không hình minh họa — nhưng cũng không
        để trống. Thứ đặt dưới câu mở đầu là chính sản phẩm: một bảng tính sửa
        được. Site đi bán ý "bạn sẽ hiểu file chạy bằng gì", mà ý đó chứng minh
        bằng một cú kéo số thì nhanh hơn mọi đoạn văn viết thêm.

        Chiều dọc bị cắt bớt so với nhịp 96px chuẩn (pt-16 thay vì py-24, và
        bảng cách hero mt-10 thay vì mt-16) vì lý do cụ thể: bảng demo phải lọt
        vào màn hình đầu trên laptop 13". Bảng là phần tiếp nối của hero, không
        phải một band mới, nên nhịp band-to-band không áp dụng giữa hai khối
        này — 96px được giữ nguyên từ bảng xuống khối kế tiếp.

        Từ lg trở lên chia hai cột: cột phải trước đây là khoảng trắng chết
        (h1 max-w-2xl trong khung max-w-5xl), giờ mang khối thông số.
      */}
      <section className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="max-w-2xl">
          {/*
            Kicker dựng đúng hình thanh công thức của HeroSheet ngay bên dưới:
            hộp tên ô, nhãn fx, rồi nội dung. Người đọc gặp lại ký hiệu đó sau
            vài trăm pixel, nên hero và bảng đọc ra là một khối thay vì hai
            phương ngữ va nhau không có chuyển tiếp.
          */}
          <p aria-hidden className="mb-6 flex text-xs">
            <span className="border border-rule bg-panel px-2 py-1 font-mono text-ink-soft">
              A1
            </span>
            <span className="border-y border-r border-rule bg-panel px-2 py-1 font-mono text-ink-faint italic">
              fx
            </span>
            <span className="min-w-0 truncate border-y border-r border-rule px-3 py-1 text-ink-soft">
              Thư viện file Excel miễn phí
            </span>
          </p>

          <h1 className="font-display text-5xl leading-[1.05] text-balance sm:text-6xl">
            File Excel tôi dựng cho việc của mình
          </h1>
          <p className="mt-8 max-w-prose text-lg text-ink-soft">
            Tải một file mẫu về là chuyện dễ. Sửa được nó khi sếp đổi yêu cầu
            mới là chuyện khó, và đó là lúc phần lớn file tải trên mạng bó tay
            vì không ai nói cho bạn biết bên trong nó chạy bằng gì.
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
        </div>

        {/*
          Thông số dựng theo phương ngữ bảng tính: bo góc 0, viền hairline, số
          để mono canh phải. Không dùng màu ngữ nghĩa vì đây không phải ô nhập
          hay ô công thức — chỉ là một bảng thông số.

          Trên lg nó nằm cột phải ngang tầm h1; dưới lg nó rơi xuống dưới cặp
          nút, chỗ đó vẫn hợp lý vì người vừa đọc xong lời hứa thì câu hỏi tiếp
          theo đúng là "có bao nhiêu file".
        */}
        <dl className="max-w-2xl border border-rule bg-paper text-sm lg:max-w-none">
          {heroSpecs.map((spec) => (
            <div
              key={spec.label}
              className="flex items-baseline justify-between gap-4 border-b border-rule px-3 py-2 last:border-b-0"
            >
              <dt className="text-ink-soft">{spec.label}</dt>
              <dd className="font-mono tabular-nums text-ink">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="sr-only">Thử một bảng tính lương</h2>
        <HeroSheet templateHref={demoHref} />
      </section>

      {/*
        Demo ở trên vừa chứng minh luận điểm chính bằng một cú kéo số. Khối
        này gom lại thành 4 câu scannable, để người lướt nhanh không phải đọc
        lại đoạn văn ở hero hay ở band coral mới nắm được vì sao khác.
      */}
      <section className="mt-24">
        <h2 className="font-display text-3xl">Vì sao khác</h2>
        <div className="mt-6">
          <FeatureGrid />
        </div>
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
      <section className="on-dark relative mt-24 overflow-hidden rounded-lg bg-coral p-10 text-paper sm:p-12">
        {/*
          Chữ EXCEL bằng ô bảng tính, quay 90° chạy xuống dọc mép phải rồi tan
          thành ô rời — thủ pháp lấy từ efexbg.svg của efex.vn.

          Ba quyết định neo ở đây, không phải trong file SVG:

          - Đặt đúng band này chứ không phải hero. Chữ trắng cần nền tối mới
            hiện ra, và đây là chỗ duy nhất trên trang chủ được phép to tiếng
            nên hoa văn không phá nhịp trắng của các band còn lại.

          - `bg-size-[auto_100%]` chứ không phải một bề rộng cố định. Chiều cao
            band đổi theo cách đoạn văn ngắt dòng, mà chữ chìm dài 35 ô trên 5 ô
            ngang — đặt cứng bề rộng thì ở một bề ngang nào đó chữ dài quá band
            và chữ L bị mép dưới cắt mất. Khớp theo chiều cao thì chữ luôn vừa,
            và đuôi tan luôn rơi đúng vào khoảng 20% cuối.

          - Tràn hẳn ra mép phải (right-0), không thụt vào theo padding. Hoa văn
            chạm mép thì chìm; thụt vào là thành một cái hình được đặt cạnh chữ.

          Chỉ bật từ lg: hẹp hơn thế thì đoạn văn max-w-prose ăn hết bề ngang
          và chữ chìm nằm đè lên chữ thật.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-20 bg-[url('/excel-wordmark.svg')] bg-right-top bg-no-repeat bg-size-[auto_100%] lg:block"
        />

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

      <section className="mt-24">
        <h2 className="font-display text-3xl">Câu hỏi thường gặp</h2>
        <div className="mt-6">
          <Faq />
        </div>
      </section>

      <div className="mt-24">
        <h2 className="sr-only">Về {AUTHOR.name}</h2>
        <AuthorCard />
      </div>
    </div>
  );
}
