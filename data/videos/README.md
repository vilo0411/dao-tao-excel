# Mẹo video gắn vào trang hàm

Mỗi video một file `<id>.json`. Video **không** mở trang riêng — nó là nội dung
bổ sung cho `/ham-excel/<hàm>`, chỗ mỏng nhất của site hiện nay.

## Quy trình

1. Lấy URL video (copy tay, hoặc export từ Creator Center của HVS). TikTok
   không có API công khai liệt kê video của một kênh, nên bước này không tự
   động được.

2. Dựng khung + tải poster:

   ```
   npm run videos -- https://www.tiktok.com/@excel.taichinhso/video/730...
   ```

   Script gọi oEmbed, tạo `data/videos/<id>.json` với caption gốc và các hàm
   **đoán được** từ caption, rồi tải poster về `public/videos/<id>.jpg`.

3. Mở file vừa tạo, sửa ba trường:
   - `title` — viết lại cho người đọc, đừng để nguyên caption câu view.
   - `summary` — 2-3 câu, **bắt buộc**. Đây là phần duy nhất Google đọc được;
     embed TikTok không cho trang một chữ nào.
   - `functions` — xác nhận bằng cách xem video. Gợi ý từ caption chỉ để đỡ gõ.

4. `npm run validate` trước khi commit.

## Luật

- Tối đa **2 hàm** mỗi video. Ép chọn hàm chính, chặn thói tag rải lấy link.
- Tối đa **2 video** mỗi trang hàm (`MAX_VIDEOS_PER_FUNCTION` trong
  `lib/videos.ts`).
- Thiếu `summary` hoặc thiếu poster thì build fail.
- Hàm phải đã có trang, tức là có template dùng thật.

`validate` bắt được slug không tồn tại. Nó **không** bắt được tag đúng-mà-lệch:
video nói về pivot table nhưng nhắc SUMIF ở giây thứ 3 vẫn qua cửa. Chỗ đó chỉ
người xem video mới thấy.

## Chưa làm

- Khối video trên trang template (trường `templates` đã có sẵn trong schema
  nhưng chưa hiển thị ở đâu) — đợi xem số liệu `video_tip_play` trên trang hàm
  trước.
- Hub `/meo-excel`. Chỉ mở khi có video đủ chữ để đứng thành bài.
