# Excel Template Hub — excel.nguyenvietloc.com

Site pSEO thư viện mẫu Excel miễn phí, dẫn chuyển đổi về khóa học Excel của
HVS Tài Chính Số.

Kế hoạch đầy đủ: `~/.claude/plans/t-i-ang-l-n-k-playful-locket.md`
Đề nghị gửi DSC/HVS: `docs/phase-0-de-nghi-hvs.md`

## Nguyên tắc cốt lõi: một spec sinh ra cả file lẫn trang

```
data/templates/nhan-su/bang-tinh-luong-nhan-vien.json
   ├── scripts/build_xlsx.py  →  public/downloads/nhan-su/....xlsx
   └── Next.js SSG            →  /mau-excel/nhan-su/bang-tinh-luong-nhan-vien
```

Phần "công thức dùng trong file", "hàm sử dụng" và giải thích trên trang đều
được suy ra từ công thức có thật trong spec, nên nội dung trang không thể trôi
lệch khỏi file người dùng tải về.

Công thức viết theo tên cột chứ không theo chữ cái ô:

```json
"formula": "=IF([hoTen]{row}=\"\",\"\",[ngayCong]{row}+[nghiPhep]{row})"
```

`[key]` → chữ cái cột, `{row}` → số dòng. `resolveFormula` trong
`lib/templates.ts` và `resolve_formula` trong `scripts/build_xlsx.py` phải cho
ra kết quả giống hệt nhau.

## Lệnh

```bash
npm run dev        # chạy dev
npm run validate   # kiểm tra spec, in công thức đã resolve
npm run xlsx       # sinh lại toàn bộ file .xlsx
npm run qa         # cổng QA: tính lại workbook, dò lỗi công thức
npm run check      # chạy cả ba lệnh trên
npm run build      # build production
```

Cần venv Python cho hai lệnh `xlsx` và `qa`:

```bash
python3 -m venv .venv && .venv/bin/pip install openpyxl formulas
```

## Quy trình thêm một mẫu mới

1. Tạo `data/templates/<category>/<slug>.json` (tên file phải trùng `slug`)
2. `npm run check` — spec sai sẽ làm gãy build, không lọt lên production
3. **Mở file bằng Excel thật** và soát ý nghĩa nghiệp vụ
4. `npm run build`

### Bước 3 là bắt buộc, không được bỏ

`npm run qa` tính lại toàn bộ workbook và bắt được: ô báo lỗi (`#DIV/0!`,
`#REF!`, `#N/A`...), công thức chết khi người dùng nhập thêm dòng, tham chiếu
tuyệt đối `$` đặt nhầm.

Nhưng nó **không** biết công thức có đúng nghiệp vụ hay không. Một công thức
tính sai thuế vẫn chạy trơn tru và vẫn qua QA.

Ví dụ có thật gặp khi dựng `bang-tinh-luong-nhan-vien`: số liệu thuế TNCN theo
trí nhớ của mô hình ngôn ngữ là mức giảm trừ 11 triệu / 4,4 triệu và biểu thuế
7 bậc — đều đã lỗi thời. Từ kỳ tính thuế 2026, mức giảm trừ là **15,5 triệu /
6,2 triệu** và biểu thuế rút còn **5 bậc** (5/10/20/30/35%) theo Nghị quyết
110/2025/UBTVQH15. QA tự động không thể phát hiện sai lệch này.

Với mẫu có số liệu pháp lý (thuế, bảo hiểm, lương tối thiểu), luôn đối chiếu
với văn bản hiện hành trước khi publish.

## Hệ thiết kế

Lấy từ ngôn ngữ của chính bảng tính, không dùng màu trang trí. Hai màu nhấn mã
hóa đúng sự phân biệt mà cả site đang dạy:

| Token | Nghĩa |
|---|---|
| `computed` (#0e6b4a) | ô Excel tự tính bằng công thức |
| `input` (#1f4b99) | ô người dùng nhập tay |
| `flag` (#a63a21) | chỉ dùng cho ô báo lỗi |

Điểm nhấn của site là `SheetPreview`: bảng preview có dải chữ cái cột, cột số
dòng và **thanh công thức sống** — bấm hoặc tab vào ô xanh thì công thức thật
của đúng ô đó hiện lên. Đây là luận điểm của cả site dựng thành giao diện: nơi
khác đưa file rồi giấu cách làm, ở đây công thức nằm ngay trên bảng.

Con số trong ô xanh không phải gõ tay mà do `qa_check.py` tính lại từ file
.xlsx rồi ghi ra `data/computed/`, và **chỉ ghi khi QA đạt** — website không thể
hiển thị một con số chưa qua kiểm tra.

Font: Archivo (tiêu đề) + Be Vietnam Pro (nội dung) + JetBrains Mono (công
thức, tham chiếu ô). Cả ba bắt buộc phải có subset `vietnamese`; thiếu là dấu
rơi về font hệ thống và gây layout shift. Instrument Serif đã bị loại vì lý do
này.

### Cần bổ sung

Đặt ảnh chân dung tại `public/loc.jpg`. Chưa có thì component tự hiện monogram
"LN", không vỡ layout.

## Định vị và công khai quan hệ

Site đứng tên người thật và giới thiệu khóa học của HVS ở ngôi thứ nhất — lời
khuyên của một người có sức nặng hơn banner quảng cáo, nhất là với người vừa
nhận file miễn phí xong.

Câu công khai quan hệ với HVS nằm ở `lib/author.ts`, hiện để trung tính vì chưa
chốt hình thức hợp tác. Khi chốt (affiliate, cộng tác viên, hay hoàn toàn vô
tư) thì sửa đúng một chỗ đó, footer và mọi trang cập nhật theo.

## Phân luồng CTA

Cấu hình ở `lib/site.ts`:

- category `nhan-su` → khóa Excel cho nhân sự (trả phí)
- các category còn lại → trang tư vấn

Ghi đè từng mẫu bằng trường `ctaTarget` trong spec. Mọi link ra ngoài đều gắn
UTM kèm slug mẫu, và bắn GA4 event `outbound_cta_click`.

Lưu ý: slug trang khóa học nhân sự bên HVS **viết hoa**, bản chữ thường đang
404. Đừng "chuẩn hóa" thành chữ thường.
