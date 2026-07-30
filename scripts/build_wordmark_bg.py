"""Dựng public/excel-wordmark.svg — chữ EXCEL bằng ô bảng tính, chìm dưới nền.

Cách đọc hình: chữ quay 90°, chạy từ trên xuống dọc lề phải trang, rồi tan thành
các ô rời. Đúng thủ pháp file efexbg.svg của efex.vn, khác ba chỗ có lý do:

1. Ô SẮC GÓC. efex bo góc ~4px mỗi ô. Ở đây không được: globals.css đặt luật
   "một bảng tính bo góc là một bảng tính sai", và ô ở đây đọc ra là ô bảng
   tính chứ không phải pixel chung chung.

2. GLYPH 5x5 THÂN DÀY 2 Ô. Lấy đúng từ chữ E và F của efex (giải ra được từ
   toạ độ trong file gốc): thanh ngang phủ kín 5 ô, thân đứng dày 2 ô. Chữ X
   phải tự dựng vì trong file gốc nó đã tan mất, nên nó theo cùng độ dày để
   không nhẹ hơn bốn chữ còn lại.

3. MÀU INK, KHÔNG PHẢI TRẮNG. efex để ô màu trắng xanh vì nền trang họ tối. Nền
   trang này là --color-paper trắng, nên trắng trên trắng là vô hình — chữ phải
   là --color-ink ở độ mờ rất thấp. Đây là lý do kỹ thuật, không phải lựa chọn
   thẩm mỹ: đổi COLOR về #ffffff thì hoa văn biến mất hẳn khỏi trang.

   OP_WORD 0.18 ra khoảng #d5d7da trên giấy trắng — đậm hơn một chút so với
   --color-rule (#dddddd, tức ink ở ~0.135), nên nó đọc ra là một hình có chủ ý
   chứ không phải một vệt bẩn. Đây là mức trần: đậm hơn nữa thì chữ h1 và đoạn
   văn nằm trên nó bắt đầu khó đọc.

Toạ độ hoá: một pixel glyph (hàng r, cột k) đặt vào ô (x = (4-r), y = k). Đây
là phép quay lấy nguyên từ file efex, không phải rotate() tự chọn — nên chữ
không bị lật ngược.

Chạy: python3 scripts/build_wordmark_bg.py
"""

from __future__ import annotations

import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "excel-wordmark.svg"

COLOR = "#181d26"  # --color-ink; xem mục 3 ở docstring về việc vì sao không trắng

PITCH = 40  # bước lưới
TILE = 29  # cạnh ô; tỉ lệ ô/bước 0.725 lấy từ efex (28.8/39.58)

OP_WORD = 0.18  # ô thuộc nét chữ
OP_TAIL = 0.14  # ô ở đuôi tan, còn giảm tiếp theo khoảng cách

GAP = 1  # số ô trống giữa hai chữ
TAIL = 4  # chiều dài đuôi tan, tính theo ô

# Font 5x5. Thanh ngang phủ kín, thân đứng dày 2 ô — đọc được ở cỡ nhỏ mà vẫn
# đủ nặng để không biến thành hoa văn vô nghĩa ở độ mờ 18%.
GLYPHS = {
    "E": ["11111", "11000", "11111", "11000", "11111"],
    "X": ["11011", "01110", "00100", "01110", "11011"],
    "C": ["11111", "11000", "11000", "11000", "11111"],
    "L": ["11000", "11000", "11000", "11000", "11111"],
}

WORD = "EXCEL"

# "vertical" = quay 90°, chữ chạy xuống dọc mép, đúng như efex. "horizontal" =
# chữ đọc ngang bình thường.
#
# Đổi cờ này thì phải đổi cả class ở app/page.tsx cho khớp: bản dọc cần một dải
# hẹp cao ~742px đặt ở lề ngoài khung nội dung, bản ngang cần một dải thấp rộng
# đặt trong khung. Tỉ lệ ảnh là 189:1349 (dọc) hoặc 1349:189 (ngang).
ORIENT = "vertical"

cells: list[tuple[int, int, float]] = []  # (ô x, ô y, độ mờ)

# Trục dọc theo chiều chạy của chữ; trục ngang là 5 ô bề dày nét.
along = 0
for letter in WORD:
    rows = GLYPHS[letter]
    for r, row in enumerate(rows):
        for k, bit in enumerate(row):
            if bit == "1":
                # Quay 90°: hàng glyph thành trục ngang đảo chiều, cột glyph
                # thành trục chạy. Phép quay này giải ra từ toạ độ file efex
                # chứ không tự chọn, nên chữ không bị lật ngược.
                cells.append((4 - r, along + k, OP_WORD))
    along += len(rows[0]) + GAP

along -= GAP  # bỏ khoảng trống dôi sau chữ cuối

# ---- Đuôi tan. Xác suất và độ mờ cùng giảm theo khoảng cách, nên chữ không
# bị cắt cụt mà cũng không kéo thành một vệt nhiễu dài. ----
rng = random.Random(20260730)
for d in range(1, TAIL + 1):
    keep = 1.0 - d / (TAIL + 1)
    for x in range(5):
        if rng.random() < keep * 0.55:
            cells.append((x, along + d, OP_TAIL * keep))

LONG = along + TAIL
if ORIENT == "horizontal":
    cells = [(cy, 4 - cx, op) for cx, cy, op in cells]
    W, H = LONG * PITCH + TILE, 4 * PITCH + TILE
else:
    W, H = 4 * PITCH + TILE, LONG * PITCH + TILE

parts = [
    f'<rect x="{cx * PITCH}" y="{cy * PITCH}" width="{TILE}" height="{TILE}"'
    f' fill="{COLOR}" fill-opacity="{op:.3f}"/>'
    for cx, cy, op in cells
]

svg = (
    f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none"'
    ' xmlns="http://www.w3.org/2000/svg">\n' + "\n".join(parts) + "\n</svg>\n"
)

OUT.write_text(svg, encoding="utf-8")
print(f"{OUT.name}  {W}x{H}  {len(parts)} ô  {len(svg):,} bytes")

# Bản đồ ASCII, in ra ở hướng đọc được: kiểm chữ có bị lật hay thiếu nét mà
# không cần mở browser. Đây là cách duy nhất bắt được lỗi lật chữ nếu sau này
# ai đó sửa phép quay ở trên.
grid = {(cx, cy) for cx, cy, _ in cells}
for r in range(5):
    if ORIENT == "horizontal":
        print("  " + "".join("#" if (a, r) in grid else "." for a in range(LONG + 1)))
    else:
        print("  " + "".join("#" if (4 - r, a) in grid else "." for a in range(LONG + 1)))
