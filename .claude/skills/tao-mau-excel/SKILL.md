---
name: tao-mau-excel
description: Tạo hoặc sửa một mẫu Excel (.xlsx) cho Excel Template Hub — viết spec JSON, sinh file bằng openpyxl, chạy cổng QA công thức. Dùng khi được yêu cầu "tạo mẫu excel mới", "thêm template excel", "sửa công thức file excel", hoặc "làm bộ file excel".
---

# Tạo mẫu Excel cho dự án này

Dự án **không** dùng Excel COM interop hay chỉnh tay file .xlsx. Toàn bộ file được
**sinh ra từ spec JSON** bằng pipeline có sẵn:

```
data/templates/[category]/[slug].json   (nguồn sự thật, bạn chỉ sửa ở đây)
  → npm run validate   (Zod schema, lib/schema.ts)
  → npm run xlsx       (scripts/build_xlsx.py, openpyxl → public/downloads/…)
  → npm run bundle     (scripts/build_bundle.py, chỉ chạy nếu có data/systems/*.json khai bundle)
  → npm run qa         (scripts/qa_check.py, tính lại công thức bằng thư viện `formulas`, chặn publish nếu sai)
```

`npm run check` chạy cả bốn bước theo đúng thứ tự trên. **Không bao giờ sửa trực
tiếp file .xlsx trong `public/downloads/`** — nó bị ghi đè mỗi lần build và mọi
sửa tay sẽ mất không dấu vết.

## Quy trình thêm một template mới

1. Đọc một spec có sẵn cùng category trong `data/templates/` làm mẫu (ví dụ
   `data/templates/nhan-su/bang-theo-doi-nghi-phep.json`) để bám đúng văn phong
   và độ dài `intro`/`features`/`faq`.
2. Viết spec mới theo `lib/schema.ts` (`templateSchema`). Các trường bắt buộc:
   `slug`, `category` (phải nằm trong `CATEGORY_SLUGS` ở `lib/site.ts`), `h1`,
   `metaTitle` (≤60 ký tự), `metaDesc` (120–165 ký tự), `intro` (≥120 ký tự, chứa
   `primaryKeyword`), `difficulty`, `features` (3–6), `howToUse` (3–6 bước),
   `faq` (2–6), `ctaText`, `updatedAt` (ISO date), `sheets` (≥1).
3. Mỗi `sheet` cần `name` (≤31 ký tự, không chứa `\ / * ? : [ ]`), `description`,
   `columns`, `sampleRows`, `blankRows` (mặc định 20).
4. Mỗi `column` có `key` (định danh hợp lệ, dùng làm tên biến trong công thức),
   `header`, `type` (`text`/`number`/`date`/`currency`/`percent`/`formula`),
   `width` tuỳ chọn.
5. Cột `type: "formula"` **bắt buộc** có `formula` và `note` (note lên thẳng
   trang web — đây là hàng rào chống thin content, đừng bỏ qua).

## Cú pháp công thức — phải nhớ đúng

Công thức viết theo **tên cột**, không viết chữ cái cột:

```
"formula": "=IFERROR([ngayCong]{row}/[congChuan]{row},0)"
```

- `[key]` → được `resolve_formula` đổi thành chữ cái cột thật (song song giữa
  `lib/schema.ts` bản TypeScript và `scripts/build_xlsx.py` bản Python — **sửa một
  bên mà quên bên kia thì công thức hiển thị trên web sẽ khác công thức trong
  file tải về**, một lỗi âm thầm không có test nào bắt được ngoài mắt người).
- `{row}` bắt buộc phải có trong mọi công thức — thiếu nó thì công thức đúng ở
  dòng mẫu nhưng trỏ sai dòng khi kéo xuống dòng trống.
- **Không dùng tham chiếu tuyệt đối (`$`)** trong công thức theo dòng —
  `qa_check.py` sẽ tự động cảnh báo và chặn build vì nó trỏ sai khi kéo xuống.
- Option của `validation.type: "list"` không được chứa dấu phẩy — openpyxl nối
  các option bằng dấu phẩy nên option có dấu phẩy sẽ bị tách nhầm thành hai lựa
  chọn.
- Cột ngày trong `sampleRows` viết dạng chuỗi `"YYYY-MM-DD"` — script tự đổi
  sang kiểu `date` thật, đừng viết `dd/mm/yyyy`.

## Chỉ dùng hàm Excel đời cũ, cổ điển

Cổng QA không tính công thức bằng Excel thật — nó dùng thư viện Python
`formulas` (bản `1.3.4`, ghim cứng trong `requirements.txt`). Thư viện này hiểu
tốt các hàm Excel 2007 trở về trước nhưng **không đảm bảo hiểu hàm động đời
mới**. Toàn bộ spec hiện có chỉ dùng `IF`/`AND`/`OR`/`IFERROR`/`MAX`/`ROUND` cho
công thức theo dòng, và `INDEX`/`MATCH`/`SUMIF` cho công thức nối bundle — giữ
đúng phạm vi này:

- **An toàn:** `IF`, `AND`, `OR`, `IFERROR`, `MAX`, `MIN`, `ROUND`, `SUMIF`,
  `SUMIFS`, `COUNTIFS`, `AVERAGEIFS`, `INDEX`, `MATCH`, `VLOOKUP`.
- **Tránh, trừ khi đã tự kiểm chứng qua `npm run qa`:** `XLOOKUP`, `FILTER`,
  `UNIQUE`, `SORT`, `SEQUENCE`, `LET`, `LAMBDA`, `TEXTJOIN`, `IFS`, `SWITCH`,
  `MAXIFS`, `MINIFS` — các hàm mảng động (`FILTER`/`UNIQUE`/`SORT`/`SEQUENCE`)
  còn có rủi ro thứ hai: file do `openpyxl` sinh ra không có metadata "spill",
  nên dù có tính được thì Excel thật cũng chỉ hiện đúng ô đầu tiên của kết quả.
  Muốn lọc/sắp xếp/khử trùng lặp thì làm ngay trong Python khi soạn
  `sampleRows`, đừng đẩy việc đó vào công thức.
- Nếu `qa_check.py` gặp hàm nó không hiểu, `model.calculate()` trong
  `evaluate()` sẽ ném exception và cả script dừng ngang — đây là dấu hiệu rõ để
  nhận ra ngay, không phải lỗi ẩn.
- **Không tự ý nâng cấp `openpyxl`/`formulas` trong `requirements.txt`** —
  comment đầu file đã giải thích: bản mới có thể tính lại công thức ra kết quả
  khác, làm cổng QA của toàn bộ 5+ template hiện có báo sai hàng loạt dù công
  thức không đổi.

## Chạy pipeline và đọc lỗi

```powershell
npm run check
```

- `validate` báo lỗi Zod (thiếu trường, sai enum, key trùng, `[key]` không tồn
  tại, thiếu `{row}`, cột formula thiếu `note`).
- `xlsx`/`bundle` báo lỗi khi công thức trỏ tới cột không có hoặc option
  validation chứa dấu phẩy.
- `qa` là cổng nặng nhất: nó **tính lại toàn bộ workbook** bằng thư viện
  `formulas` (không cần Excel) và kiểm ba nhóm rủi ro — ô báo lỗi Excel
  (`#DIV/0!`, `#REF!`, `#N/A`…), công thức "chết" khi thêm dữ liệu vào dòng
  trống (script tự điền 5 dòng giả để mô phỏng), và tham chiếu tuyệt đối đặt
  nhầm. Khi `qa` đạt, nó ghi `data/computed/[category]/[slug].json` — trang
  web preview đọc số **thật** từ đây, không phải số người viết spec gõ tay.
- Dù `npm run check` xanh hết, **vẫn phải tự mở file bằng Excel thật một lần**
  trước khi publish — cổng QA bắt lỗi máy kiểm được, không bắt được lỗi ý nghĩa
  nghiệp vụ (ví dụ công thức đúng cú pháp nhưng sai luật thuế/bảo hiểm).

## Sau khi spec đạt QA

1. Khai `relatedSlugs` trỏ tới 1–3 template cùng category đã có.
2. Nếu là template kế toán/nhân sự: bắt buộc có người rà soát nghiệp vụ trước
   khi đánh dấu Live trong `PROGRESS.md` — schema chỉ chặn lỗi kỹ thuật.
3. Nếu slug này là node `planned` của một bộ trong `data/systems/*.json`, đổi
   node đó sang `live` — build sẽ fail cho tới khi đổi.
4. Cập nhật `PROGRESS.md`: bảng roadmap của category, phần Tổng quan, và Nhật
   ký (ghi ngày `YYYY-MM-DD` theo ngày hiện tại).

## Làm bộ file (nhiều template nối vào một workbook)

Chỉ làm khi **mọi node của bộ đã `live`** (schema chặn thẳng nếu còn `planned`).
Xem `data/systems/quan-ly-nhan-su-thang.json` làm ví dụ đầy đủ.

1. Thêm khối `bundle` vào spec hệ thống: `sheets` xếp đúng chiều đầu vào → xử
   lý → tổng, `links` là các cột đổi từ ô nhập tay sang công thức nối.
2. Công thức nối dùng `[key]{row}` cho cột cùng sheet, `[Tên sheet!key]` cho
   cột sheet khác (chuyển thành vùng tuyệt đối `'Sheet'!$B$2:$B$500`, luôn có
   dấu nháy đơn quanh tên sheet nên tên sheet chứa khoảng trắng vẫn an toàn —
   không cần tự thêm) — **không bao giờ gõ thẳng chữ cái cột**.
3. Toàn bộ sheet của một bộ nằm chung **một workbook** — đây là lựa chọn kiến
   trúc cố ý để công thức nối không bao giờ thành tham chiếu ngoại file kiểu
   `='[1]Ten sheet'!$B$2` (Excel ghi `[1]` trỏ tới một file rời trên đĩa; kiểu
   này vỡ ngay khi người dùng đổi tên hay chuyển thư mục file, và openpyxl xoá
   mất giá trị cache của nó mỗi lần ghi lại). Đừng tách bundle thành nhiều file
   .xlsx rồi nối bằng công thức ngoại file để "gọn" — đúng thứ mà kiến trúc này
   tồn tại để tránh.
4. `npm run check` sẽ chạy thêm hai phép QA riêng cho bundle, không được bỏ
   qua: **khóa nối** (mọi ô nối phải tra ra dữ liệu thật trên dòng mẫu — bắt
   trường hợp `INDEX/MATCH`/`SUMIF` không khớp và im lặng trả về rỗng hoặc 0)
   và **lan truyền** (sửa một ô ở sheet đầu vào thì sheet tổng phải đổi theo —
   phép duy nhất chứng minh dữ liệu chảy hết chuỗi).
5. Đổi tên sheet trong `bundle.sheets` sau khi đã dùng là gãy mọi công thức trỏ
   tới nó — validate bắt được lỗi, nhưng phải nhớ sửa cả hai chỗ (spec bundle
   và tên sheet gốc trong template) cùng lúc.

## Giữ nhất quán về giao diện

Mọi style dùng chung đã khai ở đầu `scripts/build_xlsx.py`: `HEADER_FILL`
(xanh dương đậm cho header), `HEADER_FONT`, `FORMULA_FILL` (xanh nhạt đánh dấu
ô công thức để người dùng biết đừng gõ đè), `TITLE_FONT`, `BORDER`,
`NUMBER_FORMATS`. Nếu cần thêm style cho một template mới, sửa/tái dùng các
hằng số này thay vì tạo `PatternFill`/`Font` rời rạc trong hàm build riêng —
37 template roadmap trong `PROGRESS.md` phải trông giống nhau khi mở cạnh nhau.

## Việc không nên làm

- Không sửa `public/downloads/**/*.xlsx` bằng tay hoặc bằng Excel COM — mọi
  thay đổi phải đi qua spec JSON rồi build lại.
- Không viết công thức bằng chữ cái cột cứng (`E5`, `$D$2`) trong spec.
- Không thêm cột `formula` mà thiếu `note` — Zod sẽ chặn, nhưng đừng cố lách
  bằng note rỗng có ý nghĩa hình thức.
- Không đánh dấu Live trong `PROGRESS.md` khi chưa qua `npm run check` xanh và
  (với kế toán/nhân sự) chưa có người rà soát nghiệp vụ.
- Không dùng hàm mảng động (`XLOOKUP`, `FILTER`, `UNIQUE`, `SORT`, `SEQUENCE`)
  hay `LET`/`LAMBDA` trong công thức spec — xem mục "Chỉ dùng hàm Excel đời cũ"
  ở trên.
- Không nâng cấp `openpyxl`/`formulas` trong `requirements.txt` mà không chạy
  lại `npm run check` cho toàn bộ template hiện có.
