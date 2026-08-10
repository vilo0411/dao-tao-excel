# Tiến độ — Excel Template Hub

Bảng theo dõi bám theo khung trong [prd-excel-template-hub.md](prd-excel-template-hub.md) mục 2.
Cập nhật file này mỗi khi làm xong một template hoặc một hạng mục hạ tầng.

**Cập nhật lần cuối:** 10/08/2026

---

## Tổng quan

| Hạng mục | Xong | Tổng | |
| :---- | ---: | ---: | :---- |
| Template `nhan-su` | 13 | 13 | `██████████` 100% |
| Template `ke-toan` | 12 | 12 | `██████████` 100% |
| Template `quan-ly-cong-viec` | 0 | 12 | `░░░░░░░░░░` 0% |
| **Tổng template** | **25** | **37** | `███████░░░` 68% |
| Bộ file | 1 | 3 | `███░░░░░░░` 33% |
| Hạ tầng | 14 | 18 | `███████░░` 78% |

**Giai đoạn hiện tại:** A — nội dung đã đủ, còn lại là rà nghiệp vụ và lên domain.
**Chặn giai đoạn B:** cần 12 trang qua DoD + lên domain thật + GSC nhận sitemap.
Nút cổ chai đã đổi: không còn là viết spec mà là **cột Rà** — 25 trang đang chờ người rà soát nghiệp vụ, và nhóm kế toán còn cần người rà gắt hơn nhóm nhân sự.

---

## Bốn cột trạng thái của một template

| Cột | Nghĩa | Cách xác nhận |
| :--- | :---- | :---- |
| **Spec** | `data/templates/[cat]/[slug].json` viết xong, Zod pass | `npm run validate` |
| **File** | .xlsx sinh được, QA công thức khớp, có `data/computed/…` | `npm run check` |
| **Rà** | Người rà soát nghiệp vụ đã duyệt (thuế, bảo hiểm, kế toán) | Ghi tên người rà vào cột |
| **Live** | Đã deploy, qua checklist DoD (PRD mục 6) | Mở URL thật |

⚠️ Cột **Rà** không được bỏ qua với template kế toán và nhân sự: schema chỉ chặn lỗi kỹ thuật, không chặn được số liệu nghiệp vụ sai.

---

## Nhân sự · HR — `/mau-excel/nhan-su`

CTA: `hrCourse`

| # | Slug | Spec | File | Rà | Live |
| :--- | :---- | :---: | :---: | :---: | :---: |
| 1 | `bang-tinh-luong-nhan-vien` | ✅ | ✅ | ⬜ | ⬜ |
| 2 | `bang-cham-cong-nhan-vien` | ✅ | ✅ | ⬜ | ⬜ |
| 3 | `bang-theo-doi-nghi-phep` | ✅ | ✅ | ⬜ | ⬜ |
| 4 | `bang-tinh-luong-lam-them-gio` | ✅ | ✅ | ⬜ | ⬜ |
| 5 | `bang-tinh-bao-hiem-xa-hoi` | ✅ | ✅ | ⬜ | ⬜ |
| 6 | `danh-sach-nhan-vien` | ✅ | ✅ | ⬜ | ⬜ |
| 7 | `bang-danh-gia-kpi-nhan-vien` | ✅ | ✅ | ⬜ | ⬜ |
| 8 | `bang-theo-doi-hop-dong-lao-dong` | ✅ | ✅ | ⬜ | ⬜ |
| 9 | `bang-cham-cong-theo-ca` | ✅ | ✅ | ⬜ | ⬜ |
| 10 | `bang-tinh-thuong-thang-13` | ✅ | ✅ | ⬜ | ⬜ |
| 11 | `bang-theo-doi-tuyen-dung` | ✅ | ✅ | ⬜ | ⬜ |
| 12 | `bang-theo-doi-dao-tao-nhan-vien` | ✅ | ✅ | ⬜ | ⬜ |
| 13 | `bang-tong-hop-nhan-su-thang` | ✅ | ✅ | ⬜ | ⬜ |

**Ghi chú rà nghiệp vụ — đọc trước khi rà:**

Ba nhóm số dưới đây dùng chung giữa nhiều file. Rà một file mà sửa số thì phải sửa cả nhóm, nếu không hai trang cạnh nhau sẽ nói hai con số khác nhau về cùng một quy định.

| Nhóm số | Xuất hiện ở | Giá trị đang dùng |
| :---- | :---- | :---- |
| Thuế TNCN 2026 | số 1, 10, và bảng demo trang chủ (`HeroSheet`) | giảm trừ 15,5tr bản thân + 6,2tr/người phụ thuộc, biểu 5 bậc |
| Bảo hiểm | số 1, 5 | 10,5% NV / 21,5% DN; trần BHXH-BHYT 46,8tr; trần BHTN theo vùng 99,2 / 88,2 / 77,2 / 69tr |
| Giờ làm và làm thêm | số 4, 9 | 150% / 200% / 300%, tăng ca đêm 200%, phụ cấp đêm 30%, nghỉ giữa giờ của ca liên tục tính vào giờ làm (Điều 109) |

`scripts/check-hero-sheet.mts` đã chặn được nhóm thuế lệch giữa spec và trang chủ. Hai nhóm còn lại chưa có cổng tự động — phải rà bằng mắt.

Điểm cần người có nghiệp vụ xác nhận, không phải lỗi kỹ thuật nên máy không bắt được:

- Số 5: mức tham chiếu 2.340.000đ và bốn mức lương tối thiểu vùng có còn đúng ở thời điểm publish không.
- Số 4: mức 200% cho giờ tăng ca ban đêm ngày thường (150 + 30 + 20). Đúng luật nhưng nếu giờ đó rơi vào ngày nghỉ tuần hoặc ngày lễ thì file chưa tính, đã ghi rõ trong FAQ.
- Số 8: bốn trần thử việc 180 / 60 / 30 / 6 ngày, và các ngoại lệ của quy tắc hai lần ký có thời hạn.
- Số 10: cách tính thuế cho tháng chi trả thưởng — file cộng dồn lương và thưởng rồi tính lũy tiến, không tách thuế riêng cho khoản thưởng.

Số 13 là **file tổng** của bộ `quan-ly-nhan-su-thang`, nằm ngoài 12 slot ban đầu của PRD. Mỗi bộ file kéo theo một file tổng như vậy, nên tổng số template sẽ nhích lên theo số bộ được dựng.

---

## Bộ file — `/mau-excel/[category]/[slug]`

Một bộ = một quy trình công việc có thật: vài file đầu vào, vài file xử lý, đúng một file tổng. Node `planned` phải trỏ tới slug **đã có trong bảng roadmap ở trên** — viết xong template đó là loader tự bắt phải đổi node sang `live`, không có cách nào quên.

Bộ đủ 100% node `live` thì khai thêm khối `bundle`: toàn bộ sheet nằm trong **một workbook**, các cột nối đổi từ ô nhập tay thành công thức `INDEX/MATCH` và `SUMIF` trỏ sang sheet khác. Đây mới là thứ giữ lời hứa của sơ đồ — không có nó, người tải về nhận mấy file rời và phải tự ghép tay đúng cái quy trình mà sơ đồ vừa vẽ. Bản tải từng file lẻ vẫn giữ nguyên cho người chỉ cần một bảng.

| Slug bộ | Category | File live / tổng | Node còn thiếu |
| :---- | :---- | :---: | :---- |
| `quan-ly-nhan-su-thang` | `nhan-su` | 5/5 | — · **có file gộp** |
| _(kế toán — chưa dựng)_ | `ke-toan` | — | đã đủ 12 template, dựng bộ được bất cứ lúc nào |
| _(quản lý công việc — chưa dựng)_ | `quan-ly-cong-viec` | — | cần ≥ 3 template trước |

⚠️ Đừng công bố một bộ mà node `master` còn `planned`: trang bộ khi đó hứa một file tổng không tồn tại, đúng thứ mà cả site đang phản đối.

---

## Kế toán · Tài chính — `/mau-excel/ke-toan`

CTA: `consult` · **Đủ 12/12 template của Phase 1**

| # | Slug | Spec | File | Rà | Live |
| :--- | :---- | :---: | :---: | :---: | :---: |
| 1 | `so-quy-tien-mat` | ✅ | ✅ | ⬜ | ⬜ |
| 2 | `bang-ke-thu-chi` | ✅ | ✅ | ⬜ | ⬜ |
| 3 | `bang-theo-doi-cong-no-phai-thu` | ✅ | ✅ | ⬜ | ⬜ |
| 4 | `bang-theo-doi-cong-no-phai-tra` | ✅ | ✅ | ⬜ | ⬜ |
| 5 | `so-kho-nhap-xuat-ton` | ✅ | ✅ | ⬜ | ⬜ |
| 6 | `bang-theo-doi-dong-tien` | ✅ | ✅ | ⬜ | ⬜ |
| 7 | `bang-tinh-khau-hao-tai-san-co-dinh` | ✅ | ✅ | ⬜ | ⬜ |
| 8 | `bang-ke-hoa-don-dau-vao-dau-ra` | ✅ | ✅ | ⬜ | ⬜ |
| 9 | `bang-theo-doi-tam-ung` | ✅ | ✅ | ⬜ | ⬜ |
| 10 | `bao-cao-ket-qua-kinh-doanh` | ✅ | ✅ | ⬜ | ⬜ |
| 11 | `bang-tinh-gia-thanh-san-pham` | ✅ | ✅ | ⬜ | ⬜ |
| 12 | `bang-du-toan-ngan-sach` | ✅ | ✅ | ⬜ | ⬜ |

**Ghi chú rà nghiệp vụ — đọc trước khi rà:**

Nhóm kế toán khác nhóm nhân sự ở một điểm: sai số ở đây không chỉ làm trang mất uy tín mà còn kéo người dùng vào rủi ro thuế. Bốn điểm dưới đây máy không bắt được.

- Số 2: mốc **20 triệu đồng** cho cảnh báo chi tiền mặt. Đây là ngưỡng bắt buộc thanh toán không dùng tiền mặt để được khấu trừ thuế GTGT đầu vào và tính vào chi phí được trừ. Phải xác nhận mốc này còn đúng ở thời điểm publish, và xác nhận cách diễn đạt trong FAQ không bị đọc thành lời khuyên thuế.
- Số 3: bốn bậc tuổi nợ 0 / 1-30 / 31-60 / trên 60 ngày là quy ước quản trị, **không phải** bậc trích lập dự phòng nợ khó đòi. FAQ đã nói rõ chỗ này — nếu sửa lời, đừng làm mất ranh giới đó.
- Số 4: ngưỡng cảnh báo **7 ngày** trước hạn trả, và cách xử lý chiết khấu thanh toán sớm (file khuyên hạch toán riêng như thu nhập tài chính, không trừ thẳng vào công nợ).
- Số 5: cột giá trị tồn kho nhân đúng một đơn giá cho cả dòng, tức chỉ đúng với **bình quân gia quyền**. Đã ghi trong FAQ là không thay được cách tính giá theo lô hay FIFO.

- Số 6: ranh giới **dòng tiền không phải lợi nhuận** — file chỉ ghi tiền thật vào ra, không ghi doanh thu đã xuất hóa đơn mà chưa thu. FAQ đã nói rõ; nếu biên tập lại đừng làm mất ranh giới đó, vì đọc số dư cuối kỳ thành lãi là nhầm lẫn tốn kém nhất về dòng tiền. Cũng cần xác nhận bốn nhóm chi (mua hàng / lương và bảo hiểm / vận hành / khác) là cách gom hợp với doanh nghiệp nhỏ Việt Nam, chứ không phải ba nhóm kinh doanh - đầu tư - tài chính theo chuẩn báo cáo lưu chuyển tiền tệ.

- Số 7: mốc **30 triệu đồng** của tiêu chuẩn ghi nhận TSCĐ, và khung thời gian khấu hao tối thiểu / tối đa của sáu nhóm tài sản trong danh sách sổ xuống. File không tự chặn số năm nằm ngoài khung — schema chỉ giới hạn 1–50 năm — nên đây là chỗ người rà phải soi. Cũng cần xác nhận cách file xử lý tháng đầu tiên (không chia theo ngày, hướng dẫn nhập tay vào lũy kế đầu kỳ) là chấp nhận được.
- Số 8: mốc **20 triệu** dùng lại từ số 2, nhưng ở đây nó không chỉ là cảnh báo mà **đổi luôn con số** ở cột thuế được khấu trừ. Ba điểm cần xác nhận: mốc còn đúng ở thời điểm publish, quy tắc tính theo tổng mua trong ngày của cùng một người bán (file xét theo dòng nên không bắt được, đã ghi trong FAQ), và mức thuế suất 8% xuất hiện trong dòng mẫu có còn hiệu lực không.
- Số 9: ngưỡng **15 ngày** cho hai bậc quá hạn là quy ước quản trị, không phải quy định. Đoạn FAQ nói về việc trừ vào lương cần rà kỹ nhất trong cả nhóm — phải giữ đúng ranh giới "theo quy chế tài chính đã ban hành và trong giới hạn pháp luật lao động cho phép", đừng để đọc thành lời khuyên trừ lương tự do.
- Số 10: cột thuế TNDN là **ước tính theo tháng**, không cộng dồn ra số quyết toán năm (không xử lý chuyển lỗ, không loại chi phí không được trừ). FAQ đã nói rõ; giữ nguyên ranh giới đó. Hai ngưỡng 20% và 5% ở cột cảnh báo là mức tham chiếu chung, đã ghi rõ là phải sửa theo ngành.
- Số 11: ranh buộc lớn nhất là **chi phí bán hàng và quản lý không được đưa vào giá thành** — đưa nhầm là thổi giá trị hàng tồn kho. Cần xác nhận thêm rằng lời khuyên "kiểm lại tiêu thức phân bổ sản xuất chung trước khi dừng mặt hàng" không bị đọc thành khuyến khích bán dưới giá vốn.
- Số 12: ngưỡng **90%** cho cảnh báo sát trần là quy ước quản trị. Điểm cần soi là logic đảo chiều theo cột Loại — rà bằng cách thử một dòng Thu và một dòng Chi có cùng tỷ lệ thực hiện, hai dòng đó phải cho hai kết luận ngược nhau.

Số 1 và 5 còn một ràng buộc chung: file khai là công cụ theo dõi và đối chiếu, không khai là sổ sách chính thức theo chế độ kế toán. Giữ nguyên ranh giới đó khi biên tập lại.

---

## Quản lý công việc — `/mau-excel/quan-ly-cong-viec`

CTA: `consult` · Hub chưa mở (cần ≥ 5 template)

| # | Slug | Spec | File | Rà | Live |
| :--- | :---- | :---: | :---: | :---: | :---: |
| 1 | `bang-theo-doi-tien-do-cong-viec` | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | `ke-hoach-cong-viec-tuan` | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | `gantt-chart-excel` | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | `bang-phan-cong-cong-viec` | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | `to-do-list-excel` | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | `bang-theo-doi-du-an` | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | `bang-theo-doi-chi-phi-du-an` | ⬜ | ⬜ | ⬜ | ⬜ |
| 8 | `bang-theo-doi-muc-tieu-okr` | ⬜ | ⬜ | ⬜ | ⬜ |
| 9 | `checklist-cong-viec-hang-ngay` | ⬜ | ⬜ | ⬜ | ⬜ |
| 10 | `bang-danh-gia-rui-ro-du-an` | ⬜ | ⬜ | ⬜ | ⬜ |
| 11 | `lich-lam-viec-nhom` | ⬜ | ⬜ | ⬜ | ⬜ |
| 12 | `bien-ban-hop` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Hạ tầng & vận hành

### Đã xong

- [x] Next.js 16 App Router + TypeScript + Tailwind v4
- [x] Schema Zod cho spec template, fail build khi sai
- [x] Pipeline `npm run check` (validate → build_xlsx → qa_check)
- [x] Trang chủ, hub `/mau-excel`, category hub, trang chi tiết (SSG)
- [x] `SheetPreview` — lưới HTML, phân biệt ô nhập / ô Excel tính
- [x] Meta động, canonical khớp trailing slash
- [x] JSON-LD: CreativeWork + BreadcrumbList + FAQPage
- [x] Breadcrumb + related tự bù (không có trang mồ côi)
- [x] `sitemap.xml` sinh từ data, lọc category rỗng · `robots.txt`
- [x] CTA sang HVS kèm UTM theo slug
- [x] `/ham-excel` + `/ham-excel/[function]` — glossary hàm Excel, thay cho `/khoa-hoc-excel` (xem PRD mục 0, v2.1)
- [x] CI deploy bản xem thử lên GitHub Pages (chặn index)
- [x] Lớp bộ file: schema + loader (`lib/systems*.ts`), `/mau-excel/bo-file` + `/mau-excel/bo-file/[slug]`, sơ đồ `SystemMap`, dải `SystemStrip` trên trang file lẻ, JSON-LD `Collection` + `ItemList` + `isPartOf`
- [x] **Tham chiếu dòng trên** trong công thức spec: ngoài `{row}` còn dùng được `{row-N}`. Đây là thứ mở khóa cả nhóm cột lũy kế của kế toán (tồn quỹ, dòng tiền ròng). Chỉ cho lùi lên, không cho `{row+N}` — trỏ xuống là tạo vòng lặp tham chiếu; schema chặn cả token gõ sai kiểu `{row -1}`, vốn sẽ lọt nguyên văn dấu ngoặc nhọn vào file và chỉ lộ ra ở tay người tải về
- [x] **File gộp**: khối `bundle` trong spec bộ, `scripts/build_bundle.py`, cú pháp `[Tên sheet!key]` cho tham chiếu xuyên sheet, cổng QA kiểm khóa nối và kiểm lan truyền đầu-cuối

### Còn lại

- [ ] **Chặn category rỗng** — `ke-toan`, `quan-ly-cong-viec` hiện vẫn build ra trang rỗng; áp quy tắc ≥ 5 template
- [ ] **`NEXT_PUBLIC_GA_ID`** — chưa có GA4, mọi chỉ số đo lường đang bằng 0
- [ ] **Trỏ domain thật + deploy Vercel**
- [ ] **Verify Google Search Console + submit sitemap**

---

## Nhật ký

| Ngày | Việc |
| :---- | :---- |
| 10/08/2026 | **Xong 5 template kế toán còn lại — nhóm `ke-toan` đủ 12/12.** Khấu hao TSCĐ (đường thẳng, `MIN` chặn trần để tài sản hết giá trị tự dừng trích thay vì âm dần), bảng kê hóa đơn GTGT (đầu vào và đầu ra chung một bảng, cột thuế được khấu trừ **tự trả về 0** với hóa đơn từ 20 triệu trả tiền mặt — cảnh báo không đủ, phải đổi luôn con số), theo dõi tạm ứng (dùng cột `ngayChotSo` thay `TODAY` như hai file công nợ, để bảng in hôm nay và bảng mở lại tháng sau cho cùng một con số quá hạn), báo cáo kết quả kinh doanh (xếp ngang theo tháng thay vì dọc theo chỉ tiêu; `MAX(0;…)` chặn thuế âm ở tháng lỗ), tính giá thành (dở dang đầu kỳ + phát sinh − dở dang cuối kỳ), dự toán ngân sách (cột đánh giá **đảo chiều theo cột Loại**: cùng tỷ lệ 110% thì dòng Thu là đạt kế hoạch còn dòng Chi là vượt ngân sách) |
| 10/08/2026 | **`bang-theo-doi-dong-tien`** — kế toán 6/12. Bảng nhìn tiền theo kỳ chứ theo phiếu như sổ quỹ: mỗi dòng một tháng, số dư cuối kỳ cộng dồn bằng `{row-N}`, cột cảnh báo tách riêng *âm dòng tiền* (kỳ này chi trội) khỏi *âm quỹ* (hết tiền thật) vì hai thứ đó đòi hai cách xử lý khác nhau. Hàm mới đầu tiên kể từ khi có glossary: `SUM` — dùng dạng vùng cho khối cột thu và khối cột chi để chèn thêm nhóm không phải sửa công thức, và đã thêm mục từ điển trong `FUNCTION_INFO` như cổng validate yêu cầu |
| 31/07/2026 | **Bỏ `/khoa-hoc-excel`** (bridge page + form lead + `/api/lead` + `LeadForm`/`lib/lead.ts`), thay bằng **glossary hàm Excel** `/ham-excel` + `/ham-excel/[function]` (PRD mục 2.8, `lib/functions.ts`). Nguồn dữ liệu là `template.functions` đã tự trích sẵn — 8 hàm có template thật dùng (IF, IFERROR, AND, OR, N, ROUND, MAX, MIN). `npm run validate` giờ ném lỗi nếu một hàm mới xuất hiện trong công thức mà chưa có mục từ điển (`FUNCTION_INFO`) |
| 30/07/2026 | **Mở nhóm `ke-toan` với 5 template đầu**: sổ quỹ tiền mặt, bảng kê thu chi, công nợ phải thu, công nợ phải trả, sổ kho nhập xuất tồn — vừa đủ ngưỡng 5 để mở hub. Mở rộng cú pháp công thức thêm `{row-N}` để cột lũy kế trỏ được lên dòng trên; trước đó cả nhóm cột số dư lũy kế là bất khả thi vì QA cấm tham chiếu tuyệt đối `$`, mà `SUM` neo từ dòng đầu thì gãy khi người dùng kéo công thức xuống |
| 30/07/2026 | **Xong 8 template `nhan-su` còn lại** — nhóm nhân sự đủ 13/13. Thêm định dạng ngày cho `SheetPreview` (cột công thức trả serial Excel, trước đó in ra số trần). Sửa `bang-cham-cong-theo-ca`: nghỉ giữa giờ của ca liên tục được tính vào giờ làm theo Điều 109, trước đó trừ cho mọi ca nên ca đêm đủ 8 tiếng chỉ ra 0,94 công |
| 28/07/2026 | **File gộp** cho `quan-ly-nhan-su-thang`: 6 sheet trong một workbook, 17 công thức nối. Viết `danh-sach-nhan-vien` + `bang-theo-doi-nghi-phep`. Bảng lương thêm cột công nên lương mới thực sự phụ thuộc chấm công |
| 28/07/2026 | Lớp **bộ file**: `/mau-excel/bo-file` + trang bộ có sơ đồ liên kết, bộ `quan-ly-nhan-su-thang`, file tổng `bang-tong-hop-nhan-su-thang` |
| 28/07/2026 | PRD v2.0 — chốt khung 43 trang, mô hình bridge sang HVS. Tạo file theo dõi này |
| 27/07/2026 | `bang-tinh-luong-nhan-vien`, `bang-cham-cong-nhan-vien` — spec + file + QA |
| — | Khởi tạo dự án, CI deploy GitHub Pages |

---

## Quy trình thêm một template

1. Viết `data/templates/[category]/[slug].json` theo schema (`lib/schema.ts`).
2. `npm run check` — phải xanh cả ba bước.
3. Khai `relatedSlugs` trỏ tới 1–3 template cùng category đã có.
4. Rà soát nghiệp vụ nếu là kế toán / nhân sự.
5. Mở trang local, kiểm theo DoD (PRD mục 6).
6. Nếu slug này là node `planned` của một bộ, đổi node sang `live` — build sẽ fail cho tới khi đổi.
7. Cập nhật bảng trên + phần Tổng quan + Nhật ký, rồi commit.

## Quy trình thêm một bộ file

1. Viết `data/systems/[slug].json` theo schema (`lib/systems-schema.ts`). Node `planned` phải dùng đúng slug đã ghi trong roadmap ở trên.
2. `npm run validate` — loader chặn: edge chảy ngược vai trò, hai `master`, node lạc lõng, một file nằm trong hai bộ, slug trùng template/category.
3. Viết **file tổng** trước khi công bố bộ (xem cảnh báo ở mục Bộ file).
4. Mở `/mau-excel/[category]/[slug]` ở local: sơ đồ phải vẽ đúng ở màn rộng, và thu hẹp dưới 640px phải rớt sang chip chữ.
5. Cập nhật bảng Bộ file + Tổng quan + Nhật ký, rồi commit.

## Quy trình thêm file gộp cho một bộ

Chỉ làm khi mọi node của bộ đã `live` — schema chặn thẳng nếu còn node `planned`.

1. Thêm khối `bundle` vào `data/systems/[slug].json`: `sheets` xếp theo đúng chiều đầu vào → xử lý → tổng, `links` là các cột đổi từ nhập tay sang công thức.
2. Công thức nối viết bằng `[key]{row}` cho cột cùng sheet và `[Tên sheet!key]` cho cột sheet khác. Không bao giờ gõ chữ cái cột.
3. `npm run check` — validate chặn: sheet nguồn đứng sau sheet đích (tức có vòng lặp tham chiếu), cột không tồn tại, đè lên cột vốn đã là công thức, node không góp sheet nào.
4. Cổng QA còn chạy hai phép thử riêng cho file gộp, và đây là hai phép không được bỏ qua:
   - **khóa nối** — mọi ô nối phải tra ra dữ liệu trên dòng mẫu. Bắt trường hợp công thức đúng cú pháp, file mở bình thường, nhưng `INDEX/MATCH` không khớp được dòng nào và im lặng trả về rỗng.
   - **lan truyền** — sửa một ô đầu vào thì sheet tổng phải đổi theo. Đây là phép duy nhất chứng minh dữ liệu thật sự chảy hết chuỗi.
5. Mở bằng Excel thật, gõ thử một ô ở sheet đầu vào và nhìn sheet tổng đổi. Cổng QA dùng thư viện tính lại chứ không phải Excel.
6. ⚠️ Đổi tên sheet trong `bundle.sheets` là gãy mọi công thức trỏ tới nó — validate bắt được, nhưng nhớ sửa cả hai chỗ cùng lúc.
