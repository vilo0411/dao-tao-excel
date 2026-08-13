# Mẹo video từ kênh TikTok HVS Tài Chính Số

Mỗi video một file `<id>.json`. Video **không** mở trang riêng.

Chỗ gắn chính là **trang template**, đặt ngay trên `CourseCta`: người đọc vừa
tải file xong → xem mẹo 30 giây → mới gặp lời mời học. Ba bậc thang tăng dần
thay vì nhảy thẳng từ file miễn phí sang khóa 1.5tr.

Trang hàm (`functions`) là đường phụ, phần lớn video để trống trường này. Lý do
nằm trong `lib/videos.ts`: kênh dạy theo việc, còn glossary chỉ có 10 hàm nền
tảng rút từ công thức template — hai tập hợp gần như không giao nhau.

## Quy trình

1. **Lấy URL video.** Không tự động hoàn toàn được:
   - `yt-dlp --no-check-certificates --flat-playlist --print "%(id)s"
     "https://www.tiktok.com/@excel.taichinhso"` lấy được **~10 video gần
     nhất** rồi chết ở bước phân trang. Đủ cho việc cập nhật định kỳ.
   - Muốn cả kho: xin HVS export từ **Settings → Download your data** của
     TikTok (miễn phí, đủ URL + caption + ngày), hoặc dùng Apify TikTok Scraper.

2. **Dựng khung + tải poster:**

   ```
   npm run videos -- https://www.tiktok.com/@excel.taichinhso/video/730...
   ```

   Script gọi oEmbed, đoán template từ caption, tạo `data/videos/<id>.json`,
   tải poster về `public/videos/<id>.jpg`.

   Chạy không tham số (`npm run videos`) thì chỉ tải lại poster còn thiếu.

3. **Sửa file vừa tạo:**
   - `title` — viết lại cho người đọc, bỏ hashtag.
   - `summary` — 2-3 câu, **bắt buộc**. Đây là phần duy nhất Google đọc được;
     embed TikTok không cho trang một chữ nào.
   - `templates` — xác nhận bằng cách xem video.

4. `npm run validate` trước khi commit.

## Luật

- Tối đa **2 template** và **2 hàm** mỗi video. Ép chọn cái chính.
- Tối đa **2 video** mỗi trang (`MAX_VIDEOS_PER_PAGE` trong `lib/videos.ts`).
- Không gắn vào đâu cả → build fail. Video như vậy không hiện ở đâu, để lại chỉ
  làm người sau tưởng nó đã lên trang.
- Thiếu `summary` hoặc thiếu poster → build fail.

`validate` bắt được slug không tồn tại. Nó **không** bắt được tag đúng-mà-lệch:
video nói về pivot table nhưng caption trùng hai từ với template chấm công vẫn
qua cửa. Chỗ đó chỉ người xem video mới thấy.

## Video chưa có chỗ gắn

Kênh có nhiều mẹo về XLOOKUP, pivot, biểu đồ — site chưa có template nào dùng
tới. Đừng phá luật "hàm chỉ mở trang khi có template dùng thật" để nhét chúng
vào. Muốn XLOOKUP có trang thì dựng một template dùng XLOOKUP, trang hàm sẽ tự
mọc theo luật cũ.

## Chưa làm

Hub `/meo-excel`. Chỉ mở khi có video đủ chữ để đứng thành bài — xem số liệu
GA4 `video_tip_play` trên trang template trước.
