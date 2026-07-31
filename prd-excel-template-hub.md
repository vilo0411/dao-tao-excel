**PRODUCT REQUIREMENTS DOCUMENT**

Excel Template Hub — pSEO Lead Magnet → Khóa học HVS

*v2.1 — bỏ bridge page khóa học, thêm glossary hàm Excel*

| Version | v2.1 |
| :---- | :---- |
| **Ngày** | 31/07/2026 |
| **Thay thế** | v2.0 (28/07/2026) |
| **Trạng thái** | Đang triển khai — hạ tầng xong, đang scale nội dung |
| **Thị trường** | Việt Nam (vi-VN) |
| **Tech stack** | Next.js 16 (App Router) + TypeScript + Tailwind v4 |
| **Domain** | https://excel.nguyenvietloc.com |

---

## 0. NHỮNG GÌ ĐÃ THAY ĐỔI SO VỚI v2.0

| Hạng mục | v2.0 (kế hoạch) | v2.1 (thực tế đang làm) | Lý do |
| :---- | :---- | :---- | :---- |
| `/khoa-hoc-excel` | Bridge page + form lead → webhook | **Bỏ hẳn**, cùng `/api/lead`, `LeadForm`, `lib/lead.ts` | Site chưa có traffic để form lead tạo ra tín hiệu đáng kể; giữ một funnel rỗng tốn diện tích nav và một route API không ai gọi |
| Glossary hàm Excel (mục 2.8) | "Chưa triển khai", làm xen kẽ khi rảnh | **Đã triển khai** tại `/ham-excel` + `/ham-excel/[function]`, thay đúng vị trí `/khoa-hoc-excel` từng chiếm trên nav | Chi phí thấp (dữ liệu `functions` đã tự sinh sẵn), lấp đúng khoảng trống nav để lại |
| Đo lường lead | Webhook `/api/lead` | **Bỏ** — không còn điểm đo lead nào trên site này | Hệ quả trực tiếp của việc bỏ `/khoa-hoc-excel`; CTA sang HVS ở trang template/category vẫn đo được qua UTM + GA4 `outbound_cta_click`, không đổi |

*(Changelog v1.0 → v2.0 giữ nguyên bên dưới, không xoá — để không ai đọc nhầm hướng cũ.)*

## 0.1 NHỮNG GÌ ĐÃ THAY ĐỔI SO VỚI v1.0

Ghi lại rõ để không ai đọc PRD cũ rồi làm sai hướng.

| Hạng mục | v1.0 (kế hoạch) | v2.0 (thực tế đang làm) | Lý do |
| :---- | :---- | :---- | :---- |
| URL gốc template | `/template-excel/…` | `/mau-excel/…` | Slug tiếng Việt, khớp keyword người Việt gõ ("mẫu excel …") |
| Đích chuyển đổi | Tự xây khóa học + waitlist | **Cầu nối sang HVS** (`taichinhso.hvsvn.com`) | Đã có khóa học sẵn bên HVS, không cần dựng LMS |
| Thu thập lead | Waitlist khóa học của mình | Form lead trên `/khoa-hoc-excel` → webhook | Không gắn được analytics trên HVS, đây là điểm đo duy nhất ta kiểm soát |
| Số category | 6 | **3** | Chỉ mở category khi có nội dung thật; category rỗng là trang mỏng |
| Preview template | Ảnh screenshot + `next/image` | **Lưới HTML dựng từ data** (`SheetPreview`) | Không phải bảo trì file ảnh; công thức và số liệu trên trang là thật, index được, không tốn LCP |
| Nội dung trang | Mô tả do người viết | **Sinh từ spec JSON, số liệu do Excel thật tính ra** | Pipeline QA bằng Python đọc lại file .xlsx, sai số là fail build |
| Sitemap | `next-sitemap` | `app/sitemap.ts` (native) | Sinh từ đúng nguồn dữ liệu của `generateStaticParams`, không thể lệch |
| Hosting | Vercel | Vercel (bản thật) + GitHub Pages (bản xem thử, chặn index) | Xem trước miễn phí trước khi trỏ domain |
| Payment / LMS / blog | Phase 2 | **Bỏ hẳn** — nằm bên HVS | Ta chỉ làm phần đầu phễu |

---

## 1. MÔ HÌNH SẢN PHẨM

```
Google search "mẫu excel tính lương"
        │
        ▼
  Trang template (SSG, miễn phí, không cần đăng ký)
        │  tải .xlsx  ·  đọc giải thích công thức  ·  xem preview lưới
        ▼
  Nhận ra "mình chưa tự làm được cái này"
        │
        └──► CTA trực tiếp → HVS (có UTM theo từng slug)

Google search "hàm vlookup trong excel" (intent học hàm, không phải tải mẫu)
        │
        ▼
  /ham-excel/[function] (SSG, tự trích từ công thức thật trong template)
        │  cú pháp · giải thích · từng chỗ hàm đó chạy thật, link tới trang template
        ▼
  Điều hướng ngược sang trang template dùng hàm đó
```

**UVP:** Tải mẫu Excel dùng được ngay — hiểu từng công thức trong đó — rồi học để tự dựng lại.

**Hai đích trên HVS:**

| Đích | URL | Dùng cho |
| :---- | :---- | :---- |
| `consult` | `/thuc-tap-so/gioi-thieu-excel` | Traffic lạnh, không lộ giá — mặc định cho `ke-toan`, `quan-ly-cong-viec` |
| `hrCourse` | `/thuc-tap-so/EXCEL-UNG-DUNG-CHO-NHAN-SU` (1.500.000đ) | Mặc định cho category `nhan-su` — sát nhu cầu nhất |

⚠️ Slug `EXCEL-UNG-DUNG-CHO-NHAN-SU` viết HOA là bản duy nhất trả 200. Không "chuẩn hóa" thành chữ thường.

---

## 2. SITEMAP KHUNG ⭐

Đây là phần chính của v2.0. Toàn bộ khung URL của site, kèm trạng thái từng trang.

**Chú thích:** ✅ đã có · 🔨 đang làm · ⬜ đã lên khung, chưa có nội dung

### 2.1 Cây trang tổng thể

```
/                                          ✅ Trang chủ
│
├── /mau-excel                             ✅ Hub tất cả template (filter theo category)
│   │
│   ├── /mau-excel/nhan-su                 ✅ Category hub — Nhân sự (CTA → hrCourse)
│   │   ├── bang-tinh-luong-nhan-vien      ✅
│   │   ├── bang-cham-cong-nhan-vien       ✅
│   │   └── … 10 template nữa              ⬜ (bảng 2.2)
│   │
│   ├── /mau-excel/ke-toan                 ⬜ Category hub — Kế toán (CTA → consult)
│   │   └── 12 template                    ⬜ (bảng 2.3)
│   │
│   └── /mau-excel/quan-ly-cong-viec       ⬜ Category hub — Quản lý công việc (CTA → consult)
│       └── 12 template                    ⬜ (bảng 2.4)
│
│   Bộ file không có nhánh riêng: mỗi bộ sống ngay dưới category của nó,
│   cùng route với template lẻ — /mau-excel/nhan-su/quan-ly-nhan-su-thang
│   chẳng hạn, không phải /mau-excel/bo-file/quan-ly-nhan-su-thang.
│
├── /ham-excel                             ✅ Glossary hàm Excel (mục 2.8) — nhánh riêng, không nằm dưới /mau-excel
│   └── /ham-excel/[function]              ✅ 1 hàm/trang, chỉ mở khi có template thật dùng hàm đó
│
├── /sitemap.xml                           ✅ Tự sinh, lọc category rỗng
├── /robots.txt                            ✅ Allow all, disallow /api/
└── /downloads/[category]/[slug].xlsx      ✅ File tải, sinh bằng script Python
```

*(`/khoa-hoc-excel` — bridge page + form lead — đã bỏ trong v2.1, xem mục 0.)*

**Quy tắc mở category:** một category chỉ được xuất hiện trong nav, sitemap và trang hub khi đã có **≥ 5 template**. Trước đó `generateStaticParams` không sinh trang cho nó. Lý do: trang hub rỗng là thin content, làm loãng đánh giá chất lượng của một site mới.
*(Hiện `ke-toan` và `quan-ly-cong-viec` vẫn build ra trang rỗng — cần sửa, xem mục 6.)*

### 2.2 `/mau-excel/nhan-su` — Nhân sự · HR

CTA mặc định: `hrCourse` · Mục tiêu Phase 1: 12 template

| # | Slug | H1 / keyword chính | TT |
| :--- | :---- | :---- | :--- |
| 1 | `bang-tinh-luong-nhan-vien` | mẫu excel tính lương nhân viên | ✅ |
| 2 | `bang-cham-cong-nhan-vien` | mẫu excel chấm công nhân viên | ✅ |
| 3 | `bang-theo-doi-nghi-phep` | mẫu excel theo dõi ngày phép | ⬜ |
| 4 | `bang-tinh-luong-lam-them-gio` | mẫu excel tính lương làm thêm giờ | ⬜ |
| 5 | `bang-tinh-bao-hiem-xa-hoi` | mẫu excel tính bảo hiểm xã hội | ⬜ |
| 6 | `danh-sach-nhan-vien` | mẫu excel quản lý hồ sơ nhân sự | ⬜ |
| 7 | `bang-danh-gia-kpi-nhan-vien` | mẫu excel đánh giá KPI nhân viên | ⬜ |
| 8 | `bang-theo-doi-hop-dong-lao-dong` | mẫu excel theo dõi hợp đồng lao động | ⬜ |
| 9 | `bang-cham-cong-theo-ca` | mẫu excel chấm công theo ca | ⬜ |
| 10 | `bang-tinh-thuong-thang-13` | mẫu excel tính thưởng tháng 13 | ⬜ |
| 11 | `bang-theo-doi-tuyen-dung` | mẫu excel theo dõi tuyển dụng | ⬜ |
| 12 | `bang-theo-doi-dao-tao-nhan-vien` | mẫu excel theo dõi đào tạo nội bộ | ⬜ |

### 2.3 `/mau-excel/ke-toan` — Kế toán · Tài chính

CTA mặc định: `consult` · Mục tiêu Phase 1: 12 template

| # | Slug | H1 / keyword chính | TT |
| :--- | :---- | :---- | :--- |
| 1 | `so-quy-tien-mat` | mẫu excel sổ quỹ tiền mặt | ⬜ |
| 2 | `bang-ke-thu-chi` | mẫu excel bảng kê thu chi hằng ngày | ⬜ |
| 3 | `bang-theo-doi-cong-no-phai-thu` | mẫu excel theo dõi công nợ phải thu | ⬜ |
| 4 | `bang-theo-doi-cong-no-phai-tra` | mẫu excel theo dõi công nợ phải trả | ⬜ |
| 5 | `so-kho-nhap-xuat-ton` | mẫu excel nhập xuất tồn kho | ⬜ |
| 6 | `bang-theo-doi-dong-tien` | mẫu excel quản lý dòng tiền | ⬜ |
| 7 | `bang-tinh-khau-hao-tai-san-co-dinh` | mẫu excel tính khấu hao TSCĐ | ⬜ |
| 8 | `bang-ke-hoa-don-dau-vao-dau-ra` | mẫu excel bảng kê hóa đơn GTGT | ⬜ |
| 9 | `bang-theo-doi-tam-ung` | mẫu excel theo dõi tạm ứng | ⬜ |
| 10 | `bao-cao-ket-qua-kinh-doanh` | mẫu excel báo cáo kết quả kinh doanh | ⬜ |
| 11 | `bang-tinh-gia-thanh-san-pham` | mẫu excel tính giá thành sản phẩm | ⬜ |
| 12 | `bang-du-toan-ngan-sach` | mẫu excel dự toán ngân sách | ⬜ |

### 2.4 `/mau-excel/quan-ly-cong-viec` — Quản lý công việc

CTA mặc định: `consult` · Mục tiêu Phase 1: 12 template

| # | Slug | H1 / keyword chính | TT |
| :--- | :---- | :---- | :--- |
| 1 | `bang-theo-doi-tien-do-cong-viec` | mẫu excel theo dõi tiến độ công việc | ⬜ |
| 2 | `ke-hoach-cong-viec-tuan` | mẫu excel kế hoạch công việc tuần | ⬜ |
| 3 | `gantt-chart-excel` | mẫu gantt chart excel | ⬜ |
| 4 | `bang-phan-cong-cong-viec` | mẫu excel phân công công việc | ⬜ |
| 5 | `to-do-list-excel` | mẫu excel to do list | ⬜ |
| 6 | `bang-theo-doi-du-an` | mẫu excel quản lý dự án | ⬜ |
| 7 | `bang-theo-doi-chi-phi-du-an` | mẫu excel theo dõi chi phí dự án | ⬜ |
| 8 | `bang-theo-doi-muc-tieu-okr` | mẫu excel theo dõi OKR | ⬜ |
| 9 | `checklist-cong-viec-hang-ngay` | mẫu excel checklist công việc | ⬜ |
| 10 | `bang-danh-gia-rui-ro-du-an` | mẫu excel đánh giá rủi ro dự án | ⬜ |
| 11 | `lich-lam-viec-nhom` | mẫu excel lịch làm việc nhóm | ⬜ |
| 12 | `bien-ban-hop` | mẫu excel biên bản họp | ⬜ |

**Tổng khung Phase 1: 36 trang template + 3 category hub + 4 trang hệ thống = 43 trang.**
Đây là con số thay thế mốc "125–170 trang" của v1.0 — làm 36 trang chất lượng cao trước, đo tốc độ index rồi mới quyết định scale.

Cộng thêm **lớp bộ file** (mục 2.7): 3 trang bộ + 3 file tổng = 6 trang, đưa Phase 1 lên **49 trang**.

### 2.7 Lớp bộ file — `/mau-excel/[category]/[slug]` ⭐

Category chỉ là một cái thùng phẳng: nó nói "đây là 12 file nhân sự", không nói file nào nhập tay, file nào ăn dữ liệu từ file nào, file nào là bản tổng cuối. Người làm hành chính tải ba file rời về rồi tự đoán cách ghép.

Mô hình lấy từ nghề SEO — onpage / offpage / technical mỗi mảng một file cộng một file quản lý tổng. Mỗi **bộ** là một quy trình có thật, gồm file `input` (nhập tay), file `process` (có công thức), và đúng một file `master`. Quan hệ giữa chúng được khai tường minh bằng `edges`, mỗi cạnh mang tên dữ liệu chảy qua ("số công tháng"), và trang bộ vẽ chúng thành sơ đồ dạng lưới bảng tính.

| | |
| :---- | :---- |
| **Nhắm từ khóa** | "bộ file excel quản lý nhân sự", "file excel quản lý nhân sự tổng hợp" — rộng hơn và intent cao hơn từ khóa một file lẻ |
| **Nguồn dữ liệu** | `data/systems/[slug].json`, schema `lib/systems-schema.ts` |
| **Ràng buộc build** | Đúng một `master`, edge chỉ chảy `input → process → master`, node `live` phải có template thật và ngược lại, mỗi file thuộc tối đa một bộ |
| **File tổng** | Là template thật, tải được, đi qua đúng pipeline `build_xlsx` + `qa_check`. Không có ngoại lệ "trang web đóng vai file tổng" |
| **Điều kiện mở một bộ** | ≥ 3 node `live`, và node `master` bắt buộc `live` |
| **Vị trí URL** | Nằm ngay dưới category của nó, chung route `/mau-excel/[category]/[slug]` với template lẻ — không có nhánh `bo-file` riêng. Bộ file là một cách xếp thư viện, không phải một loại nội dung khác; tách ra một nhánh riêng sẽ chia đôi thư viện thành hai cửa vào cho cùng một tập file — chia đôi cả internal link lẫn tín hiệu SEO. Nav vì vậy chỉ có một mục "Thư viện file", và mỗi category chỉ có một cửa vào |

Lớp này cũng vá điểm yếu internal linking: trước đây một file chỉ nối sang file khác qua `relatedSlugs` phẳng; giờ mỗi file lẻ mang một dải `SystemStrip` trỏ về bộ và các file anh em, còn trang bộ trỏ ngược xuống toàn bộ file con.

### 2.8 Glossary hàm Excel — `/ham-excel/[function]` ⭐ (đã triển khai, v2.1)

Ngoài trang template, một nguồn traffic khác đang bị bỏ trống: người tìm "hàm vlookup trong excel", "hàm sumif" — intent học hàm, không phải intent tải mẫu nghiệp vụ. Đối thủ (Gitiho, hocexcel.online, Thegioididong) chiếm nhóm từ khóa này bằng bài hướng dẫn hàm thuần, không gắn với file nghiệp vụ thật nào. Site này có thể chiếm cùng nhóm từ khóa với chi phí gần bằng 0, vì dữ liệu đã tồn tại sẵn.

| | |
| :---- | :---- |
| **Vị trí URL** | `/ham-excel/[function]` — nhánh riêng ở gốc, **không** nằm dưới `/mau-excel`. Lý do: intent "học hàm X" khác intent "tải mẫu Excel Y"; gộp chung cây sẽ làm loãng breadcrumb/category của `/mau-excel` (vốn chỉ có 3 category theo mục 2, không có chỗ cho một "category" là tên hàm) |
| **Nguồn dữ liệu** | Trường `functions` — đã tự trích từ công thức thật trong spec template (mục 3.1, "Trường tự sinh, không khai tay") — `lib/functions.ts` |
| **Nội dung mỗi trang** | Cú pháp + định nghĩa trung lập (viết một lần/hàm, `FUNCTION_INFO` trong `lib/functions.ts`, không phải nội dung nghiệp vụ nên không cần người rà kế toán/nhân sự duyệt) + từng công thức thật đã dùng hàm này kèm `note` gốc từ spec, link thẳng tới trang template ở `/mau-excel/...` (internal link 2 chiều, không phải trang mồ côi) |
| **Vai trò** | Nội dung phụ trợ / hub liên kết nội bộ — **không phải** một loại trang lọc thay thế category (khác với "trang lọc theo hàm" đã loại ở mục 2.6 khi nó được hình dung là trang danh mục độc lập cạnh tranh với category) |
| **Điều kiện mở** | Một hàm chỉ lên trang khi có ≥ 1 template thật dùng hàm đó — cùng nguyên tắc chống thin content với category (mục 2.1). `npm run validate` ném lỗi nếu một hàm mới xuất hiện trong công thức mà `FUNCTION_INFO` chưa có mục tương ứng |
| **Trạng thái** | 8 hàm có trang: IF, IFERROR, AND, OR, N, ROUND, MAX, MIN — đúng số hàm thật đang chạy trong 18 template hiện có. Số này tự tăng khi viết thêm template dùng hàm mới, không cần sửa route |

### 2.5 Cấu trúc liên kết nội bộ (không được có trang mồ côi)

```
Trang chủ ──► 3 category hub ──► từng trang template
    │                                   │
    └──► /mau-excel ────────────────────┘
                                        │
Mỗi trang template link ra:             ▼
  · breadcrumb  → Trang chủ / Mẫu Excel / Category
  · related     → 3 template (khai trong spec, thiếu thì tự bù cùng category)
  · CTA         → HVS (kèm UTM)
```

`getRelatedTemplates()` đã tự bù related bằng template cùng category khi spec khai thiếu, nên điều kiện "không trang mồ côi" được bảo đảm ở tầng code, không phụ thuộc người viết nội dung.

### 2.6 Những trang KHÔNG làm

| Trang | Lý do |
| :---- | :---- |
| `/blog`, bài viết dài | Ưu tiên template trước; blog chỉ xét sau khi 36 trang đã index |
| Trang lọc theo hàm Excel như một trang danh mục độc lập | Tách khỏi mục 2.8 — trang glossary hàm (mục 2.8) không phải trang lọc, mà là nội dung phụ trợ dựng từ dữ liệu đã có sẵn |
| Trang lọc theo độ khó | Trùng ý định tìm kiếm với category, dễ thành duplicate |
| Đăng nhập, tài khoản, thanh toán | Nằm bên HVS |
| Trang khóa học riêng lẻ | Ta không bán khóa học, chỉ giới thiệu |

*(Lưu ý: trang bộ file (`/mau-excel/[category]/[slug]`, xem mục 2.7) **không** nằm trong danh sách này. Nó là scope mới bổ sung, không phải một biến thể của trang lọc bị loại — trang lọc chỉ xáo lại cùng một tập file, còn trang bộ mang thông tin mới mà không trang nào khác có: quan hệ dữ liệu giữa các file.)*

---

## 3. DATA MODEL (thực tế)

Khác v1.0 khá nhiều: spec không chỉ mô tả template mà **định nghĩa luôn file Excel**, để script sinh ra .xlsx và trang web từ cùng một nguồn.

```
data/templates/[category]/[slug].json    ← spec do người/AI viết, validate bằng Zod
        │
        ├─► scripts/build_xlsx.py  ──► public/downloads/[category]/[slug].xlsx
        │
        ├─► scripts/qa_check.py    ──► data/computed/[category]/[slug].json
        │        (mở lại file .xlsx thật, tính công thức, ghi ra kết quả)
        │
        └─► lib/templates.ts       ──► trang web (SSG)
```

### 3.1 Trường trong spec

| Nhóm | Trường | Ràng buộc do schema ép |
| :---- | :---- | :---- |
| Định danh | `slug`, `category` | slug không dấu; tên file phải trùng slug; category phải trùng thư mục |
| SEO | `metaTitle`, `metaDesc`, `h1`, `primaryKeyword`, `intro` | metaTitle ≤ 60 ký tự; metaDesc 120–165; intro ≥ 120 ký tự |
| Nội dung | `features` (3–6), `howToUse` (3–6 bước), `faq` (2–6) | Đều bắt buộc — đây là hàng rào chống thin content |
| Cấu trúc file | `sheets[].columns[]` | Cột `formula` **bắt buộc có `note` giải thích**; công thức tham chiếu theo `[key]{row}` chứ không phải "E5" |
| Dữ liệu mẫu | `sheets[].sampleRows`, `blankRows` | Key phải khớp cột nhập liệu; số dòng trống có sẵn công thức |
| Chuyển đổi | `ctaText`, `ctaTarget?` | Không khai thì lấy `defaultCta` của category |
| Liên kết | `relatedSlugs` (≤ 5) | Phải trỏ tới template có thật, không tự trỏ về mình |

**Trường tự sinh, không khai tay:** `functions` (trích từ công thức thật), `href`, `downloadUrl`, `categoryName`, `computed`.

### 3.2 Vì sao ràng buộc chặt như vậy

Spec sinh bằng AI nên sai sót là bình thường. Mọi vi phạm đều **fail build** thay vì âm thầm lên production: công thức trỏ tới cột không tồn tại, related trỏ tới trang không có, meta quá dài, cột công thức thiếu giải thích — đều chặn ngay tại `npm run check`.

Con số hiển thị trên trang là con số **Excel thật tính ra** (qua `qa_check.py`), không phải số người viết gõ tay. Đây là điểm khác biệt so với đối thủ: mọi trang đều có nội dung kỹ thuật đúng, kiểm chứng được.

---

## 4. KIẾN TRÚC KỸ THUẬT

| Hạng mục | Thực tế |
| :---- | :---- |
| Framework | Next.js 16.2 App Router, React 19, TypeScript |
| Styling | Tailwind v4 (theo `DESIGN.md`) |
| Render | SSG toàn bộ — `generateStaticParams` cho category và slug |
| Data | JSON trong `data/templates/`, đọc bằng `node:fs` lúc build |
| Validate | Zod v4 (`lib/schema.ts`) — dùng chung cho build và script CLI |
| Sinh file .xlsx | Python + openpyxl (`scripts/build_xlsx.py`) |
| QA công thức | Python (`scripts/qa_check.py`) — tính lại từ file thật |
| Preview | `components/SheetPreview.tsx` — lưới HTML, xanh = ô nhập, xanh lá = ô Excel tính |
| Sitemap / robots | `app/sitemap.ts`, `app/robots.ts` native |
| Structured data | CreativeWork + BreadcrumbList + FAQPage trên mỗi trang template; DefinedTerm + BreadcrumbList trên mỗi trang `/ham-excel/[function]` |
| Analytics | GA4 qua `NEXT_PUBLIC_GA_ID` |
| Deploy | Vercel (bản thật) · GitHub Pages `NEXT_PUBLIC_PREVIEW=1` (export tĩnh, chặn index) |

*(Không còn route API nào trong site — `app/api/lead` đã bỏ cùng `/khoa-hoc-excel` ở v2.1, xem mục 0. `app/api` hiện rỗng.)*

**Lệnh:** `npm run check` = validate spec → sinh .xlsx → QA lại công thức. Chạy trước mỗi lần thêm template.

### 4.1 Yêu cầu hiệu năng

- Lighthouse Performance ≥ 90 trên mobile.
- LCP < 2,5s · CLS < 0,1.
- Toàn bộ SSG, không SSR, không client-side fetch cho nội dung SEO.
- Preview là HTML/CSS nên không có ảnh nặng — bù lại phải giữ bảng cuộn ngang trong container riêng, không để body cuộn ngang trên mobile.

---

## 5. ĐO LƯỜNG

Ta **không** đo được chuyển đổi cuối trên HVS, nên thước đo thật là click CTA có UTM. Từ v2.1 không còn form lead nào trên site (xem mục 0), nên đây là điểm đo duy nhất còn lại ngoài GA4 chuẩn.

| Chỉ số | Cách đo | Ngưỡng 3 tháng sau khi có 36 trang |
| :---- | :---- | :---- |
| Trang được index | Google Search Console | > 80% |
| Organic sessions/tháng | GA4 | > 2.000 |
| Tỷ lệ tải file | GA4 event trên lượt xem trang template | > 15% |
| Click CTA sang HVS | GA4 `outbound_cta_click` + UTM đối chiếu với HVS | > 3% |
| Lượt xem `/ham-excel/*` dẫn sang trang template | GA4 outbound trong nội bộ site | Theo dõi, chưa đặt ngưỡng — trang mới mở |
| Thời gian trên trang | GA4 | > 90 giây |

*UTM bắt buộc trên mọi link ra HVS: `utm_content` = slug template, để biết chính xác trang nào đẩy được click chứ không chỉ biết "từ site template".*

---

## 6. TRẠNG THÁI HIỆN TẠI & VIỆC CÒN LẠI

### Đã xong
Toàn bộ hạ tầng: 3 loại trang template, SSG, meta động, canonical khớp trailing slash, JSON-LD nhiều loại, breadcrumb, related tự bù, sitemap lọc category rỗng, robots, download .xlsx, CTA có UTM, glossary hàm Excel `/ham-excel` (mục 2.8), GA4 component, pipeline validate/build/QA, CI deploy GitHub Pages.

### Việc còn lại — theo thứ tự ưu tiên

| # | Việc | Ghi chú |
| :--- | :---- | :---- |
| 1 | **Viết 34 template còn lại** theo khung mục 2 | Nút cổ chai duy nhất đáng kể. Pipeline đã sẵn sàng |
| 2 | Chặn category rỗng | `ke-toan` và `quan-ly-cong-viec` hiện vẫn build ra trang rỗng; áp quy tắc ≥ 5 template |
| 3 | Cấu hình `NEXT_PUBLIC_GA_ID` + verify GSC | Không có số liệu thì mọi chỉ số mục 5 đều vô nghĩa |
| 4 | Trỏ domain thật, deploy Vercel | Hiện mới có bản xem thử chặn index |
| 5 | Đo Lighthouse mobile, submit sitemap | Sau khi lên domain thật |

### Định nghĩa hoàn thành cho mỗi trang template

1. URL đúng `/mau-excel/[category]/[slug]`, không 404.
2. `npm run check` xanh — spec hợp lệ, .xlsx sinh được, QA công thức khớp.
3. metaTitle ≤ 60 ký tự có primary keyword; metaDesc 120–165 ký tự có CTA "Tải ngay".
4. H1 duy nhất chứa primary keyword; primary keyword xuất hiện trong intro và ≥ 1 H2.
5. Canonical đúng, JSON-LD qua Rich Results Test.
6. Nút tải hoạt động, file mở được trong Excel và Google Sheets, không cảnh báo lỗi.
7. Mọi cột công thức đều có giải thích hiển thị trên trang.
8. 3 related hiển thị và link đúng; CTA sang HVS có đủ UTM.
9. Lighthouse mobile ≥ 90, không lỗi console.

---

## 7. RỦI RO

| Rủi ro | Mức | Giải pháp |
| :---- | :---- | :---- |
| Site mới, Google index chậm | Cao | Submit sitemap ngay khi lên domain; internal link chặt từ trang chủ; chờ 4–8 tuần trước khi kết luận |
| 36 trang quá ít để có traffic đáng kể | Vừa | Chấp nhận — giai đoạn này là đo tốc độ index và tỷ lệ chuyển đổi, không phải đo traffic |
| Không đo được chuyển đổi cuối trên HVS | Cao | UTM theo slug + lead form riêng; định kỳ đối chiếu số với bên HVS |
| Spec sinh bằng AI có nội dung sai nghiệp vụ (thuế, bảo hiểm) | Cao | Schema chỉ chặn được lỗi kỹ thuật, không chặn được lỗi nghiệp vụ — mọi template kế toán/nhân sự phải có người rà soát trước khi publish |
| Nội dung thuế/bảo hiểm lỗi thời | Vừa | `updatedAt` trên mỗi trang; rà lại đầu mỗi năm tài chính |
| Đối thủ copy chiến lược pSEO | Vừa | Moat là chất lượng file thật + giải thích công thức, không phải số lượng trang |

---

## 8. LỘ TRÌNH

| Giai đoạn | Mục tiêu | Điều kiện chuyển giai đoạn |
| :---- | :---- | :---- |
| **A — Đang ở đây** | Hoàn tất 12 template `nhan-su` | 12 trang qua DoD, lên domain thật, GSC nhận sitemap |
| **B** | 12 template `ke-toan` | ≥ 80% trang giai đoạn A được index |
| **C** | 12 template `quan-ly-cong-viec` | Có lead thật từ form |
| **D** | Quyết định scale | Nếu index tốt và có lead → mở thêm category (bán hàng, cá nhân, dự án) hoặc nhân sâu trong 3 category hiện có. Nếu không → xem lại chất lượng nội dung trước khi thêm trang |

---

*Cập nhật sau mỗi giai đoạn. Thay đổi lớn về scope cần thống nhất trước khi triển khai.*
