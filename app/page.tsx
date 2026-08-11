import Link from "next/link";
import type { Metadata } from "next";
import { AuthorCard } from "@/components/Author";
import { Faq } from "@/components/Faq";
import { FeatureGrid } from "@/components/FeatureGrid";
import { HeroSheet } from "@/components/HeroSheet";
import { cardGridClass, TemplateCard } from "@/components/TemplateCard";
import { getAllTemplates, withThumb } from "@/lib/templates";
import { absoluteUrl, withBasePath } from "@/lib/site";
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

        Chiều dọc bị cắt bớt so với nhịp band chuẩn (pt-16 thay vì py-24, và
        bảng cách hero mt-10 thay vì mt-16) vì lý do cụ thể: bảng demo phải lọt
        vào màn hình đầu trên laptop 13". Bảng là phần tiếp nối của hero, không
        phải một band mới, nên nhịp band-to-band không áp dụng giữa hai khối
        này — nhịp đầy đủ được trả lại từ bảng xuống khối kế tiếp.

        Từ lg trở lên chia hai cột: cột phải trước đây là khoảng trắng chết
        (h1 max-w-2xl trong khung max-w-5xl), giờ mang khối thông số.
      */}
      <section className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="max-w-2xl bg-paper">
          {/*
            bg-paper ở đây không phải để tạo card — nó che lưới nền
            (body::before) chạy phía sau. h1 và đoạn mô tả không có nền riêng
            như dl thông số hay hai nút bên dưới, nên trước đây lưới kẻ ô chạy
            xuyên thẳng qua chữ, đọc như đường gạch ngang đè lên nội dung.

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
              href="/ham-excel"
              /* bg-paper chứ không để trong suốt: nút phụ phải là một khối đục
                 như nút chính. Để trong suốt thì nó nhận bất cứ nền nào nằm
                 dưới — giấy kẻ ô chạy xuyên qua giữa chữ — và đọc ra là một
                 khung viền rỗng chứ không phải một cái nút bấm được. */
              className="rounded-lg border border-rule bg-paper px-6 py-4 font-medium hover:border-ink"
            >
              Tra cứu hàm Excel
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

      {/*
        Padding ở đây không phải để cho thoáng mà để giấy kẻ ô của trang có chỗ
        hiện ra quanh bảng: bảng tính là một khối đục kín, không chừa lề thì nó
        đè kín lưới và mất luôn cái viền không khí. Đây là chỗ lưới nền có
        nghĩa nhất trên cả site — nó đóng khung đúng một bảng tính thật.
      */}
      <section className="mt-10 p-4 sm:p-8">
        <h2 className="sr-only">Thử một bảng tính lương</h2>
        <HeroSheet templateHref={demoHref} />
      </section>

      {/*
        Demo ở trên vừa chứng minh luận điểm chính bằng một cú kéo số. Khối
        này gom lại thành 4 câu scannable, để người lướt nhanh không phải đọc
        lại đoạn văn ở hero hay ở band coral mới nắm được vì sao khác.
      */}
      {/*
        Nhịp band-to-band của trang chủ: 96px trên mobile, 128px từ sm trở lên
        (mt-24 sm:mt-32, lặp lại ở mọi band bên dưới). Trang chủ xếp toàn khối
        dày sát nhau — lưới 4 ô, lưới 6 card, FAQ — nên 96px trần giữa đáy một
        lưới và một h2 text-3xl không đủ để mắt thấy chỗ cắt: h2 đọc ra như
        dòng cuối của khối bên trên. 128px mới tách hẳn.

        Riêng band này lấy mt-20 sm:mt-24 chứ không phải mt-24 sm:mt-32, vì
        khối bảng demo ngay trên đã tự mang padding (p-4 sm:p-8). Cộng vào là
        đúng 96/128px như mọi mối nối khác. Sửa padding của bảng thì phải sửa
        kèm số ở đây, không thì band này lệch ra khỏi nhịp.
      */}
      <section className="relative mt-20 sm:mt-24">
        {/*
          Chữ EXCEL bằng ô bảng tính, tan thành ô rời ở cuối — thủ pháp lấy từ
          efexbg.svg của efex.vn.

          Nằm dọc, quay 90° như bản gốc, và chạy ở LỀ NGOÀI khung nội dung
          (lề trái) chứ không ở trong một cột nào. Ở lề thì không có khối nền
          đặc nào che, cả chữ hiện đủ và mỗi chữ được ~104px.

          Neo từ khối "Vì sao khác" trở xuống chứ không từ hero hay bảng demo.
          Hai khối trên là chỗ phải thuyết phục: hero có kicker, h1, khối thông
          số và cặp nút; bảng demo thì cần người đọc chịu kéo thử một ô. Thêm
          hoa văn ngang tầm mắt ở đó là thêm một thứ đòi lượt đọc. Bắt đầu ở
          đây thì hai khối đầu sạch, hoa văn đi kèm đúng phần trang mà mắt đã
          chuyển sang lướt.

          Bề rộng và vị trí đều bám theo lề, không gõ cứng. `(100vw − 64rem) / 2`
          chính là lề trái, vì khung nội dung khoá ở max-w-5xl = 64rem.

          189px là cỡ GỐC của file SVG, tức ô 29px trên bước lưới 40px — đúng cỡ
          ô efex dùng. Nhưng render ở đây bị chặn ở 100px, thấp hơn cỡ gốc khá
          nhiều — lý do nằm ở đoạn "100px, không phải 189px" phía dưới, ngay
          trước đoạn nói về mask.

          Hai hằng số trừ đi trong công thức là hai khoảng thở, đừng bỏ:
          dải cách mép màn hình 40px, và cách khung nội dung ít nhất ~35px. Bản
          trước chỉ chừa 12px với mép màn hình nên hoa văn đọc ra là bị màn hình
          ép vào chứ không phải được đặt ở lề.

          Hai con số còn lại:

          - `xl:block`. Dưới 1280px lề trái còn dưới ~110px, hẹp hơn thế thì
            hoa văn không còn ra hình nữa, nên tắt hẳn.

          - `aspect-[189/1349]` thay vì gõ cứng chiều cao: tỉ lệ đúng bằng
            viewBox của file SVG, nên bề rộng co giãn thì chiều cao tự theo, chữ
            không bao giờ bị méo hay bị cắt cụt ở chữ L.

          `mask-b-from-70%` là chỗ chữ tan vào giấy. Nó tính theo PHẦN TRĂM
          chiều cao thật của chính element — nên hoa văn luôn đậm đều 70% đầu
          rồi mờ dần và chạm hẳn 0 đúng ở mép dưới của nó, dù element được
          render to hay nhỏ. 70% không phải số tròn chọn bừa: bốn chữ E X C E
          chiếm ~960/1349 ≈ 71% chiều cao gốc, nên mốc này rơi đúng đầu chữ L —
          bốn chữ đầu giữ nguyên lực, chữ L nhạt dần rồi giao thẳng cho đuôi tan
          dựng sẵn trong SVG.

          100px, không phải 189px: khối "Vì sao khác" bên dưới (h2 + FeatureGrid)
          chỉ cao khoảng ~575px, còn hoa văn ở cỡ gốc 189px cao tới 1349px — dư
          ra gần 800px, chạy xuyên qua cả khoảng cách mt-24/32 xuống tới giữa
          "File mới nhất", đọc ra như hai band dính vào nhau thay vì có khoảng
          nghỉ. Vì mask luôn tắt hẳn đúng ở mép dưới của element (xem đoạn
          trên), hạ bề rộng xuống 100px kéo mép dưới đó về ~714px — đủ để chữ
          EXCE vẫn hiện trọn (kết ở ~508px) mà toàn bộ hoa văn tắt hẳn ngay
          trước khi chạm "File mới nhất", không cần đụng vào mask hay SVG.
          Không hạ thấp hơn nữa: dưới ~90px các ô 29px bắt đầu khó đọc ra chữ.

          -z-10 để nó nằm dưới chữ. Nền trắng đặt trên body nên nền vẫn được vẽ
          vào canvas, dưới cả lớp z âm — hoa văn không bị nền trang ăn mất.

          Ảnh nền đặt bằng `style` chứ không phải bằng class nền tùy ý của
          Tailwind (đừng viết lại kiểu đó — và cũng đừng gõ nguyên cái class ấy
          vào comment, Tailwind quét cả comment rồi sinh ra một url không giải
          được, gãy build): url() trong CSS là chuỗi tĩnh, Next không chèn
          basePath vào đó, nên bản GitHub
          Pages (nằm trong /ten-repo/) đi tìm /excel-wordmark.svg ở gốc domain
          và ăn 404 — hoa văn biến mất. withBasePath() mới ra đúng đường dẫn ở
          cả hai đích.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 -left-[calc((100vw-64rem)/2-20px)] -z-10 hidden aspect-[189/1349] w-[min(100px,calc((100vw-64rem)/2-44px))] bg-top bg-no-repeat bg-size-[100%_auto] mask-b-from-70% xl:block"
          style={{
            backgroundImage: `url('${withBasePath("/excel-wordmark.svg")}')`,
          }}
        />

        <h2 className="font-display text-3xl">Vì sao khác</h2>
        <div className="mt-6">
          <FeatureGrid />
        </div>
      </section>

      {templates.length > 0 && (
        <section className="mt-24 sm:mt-32">
          <h2 className="font-display text-3xl">File mới nhất</h2>
          <ul className={`mt-6 ${cardGridClass(templates.length)}`}>
            {templates.map((template) => (
              <TemplateCard
                key={template.slug}
                template={withThumb(template)}
              />
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
      <section className="on-dark mt-24 rounded-lg bg-coral sm:mt-32 p-10 text-paper sm:p-12">
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

      <section className="mt-24 sm:mt-32">
        <h2 className="font-display text-3xl">Câu hỏi thường gặp</h2>
        <div className="mt-6">
          <Faq />
        </div>
      </section>

      <div className="mt-24 sm:mt-32">
        <h2 className="sr-only">Về {AUTHOR.name}</h2>
        <AuthorCard />
      </div>
    </div>
  );
}
