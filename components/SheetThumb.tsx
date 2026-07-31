import type { ColumnMap } from "@/lib/schema";

/**
 * Các cột trong file, vẽ thành một dải ô bảng tính trong card.
 *
 * Vì sao card cần nó: card vốn là tiêu đề + đoạn mô tả + mấy tên hàm — ba khối
 * chữ. Người lướt trang chủ không có cách nào biết file gồm những gì trước khi
 * bấm vào, mà đó chính là thứ họ đang quyết định.
 *
 * Vì sao là TÊN CỘT chứ không phải một bảng thu nhỏ có dữ liệu: xem chú thích ở
 * `ColumnMap` trong lib/schema.ts. Tóm tắt là ở bề ngang một card, dữ liệu mẫu
 * co xuống 10px thì vừa không đọc được vừa tự sinh ra rác.
 *
 * Vì sao KHÔNG dùng ảnh chụp: dải này dựng từ chính spec đã sinh ra file .xlsx
 * nên không bao giờ lệch với file. Ảnh chụp thì lệch ngay lần sửa spec đầu
 * tiên, và không có gì nhắc ai đi chụp lại.
 *
 * Phương ngữ bảng tính, nên bo góc 0 tuyệt đối và hai màu giữ nguyên nghĩa:
 * xanh dương là cột bạn nhập, xanh lá là cột Excel tự tính.
 */
export function SheetThumb({ map }: { map: ColumnMap }) {
  if (map.names.length === 0) return null;

  return (
    <div className="mt-5">
      {/*
        Ô xuống dòng được thay vì nằm một hàng cắt chữ. Tên cột tiếng Việt dài
        ngắn rất khác nhau ("Thu" cạnh "Tổng công hưởng lương"), ép hết vào một
        hàng thì hàng nào cũng có một cái tên cụt — mà một tên cột cụt thì không
        còn là thông tin nữa.
      */}
      <ul className="flex flex-wrap gap-1">
        {map.names.map((name, i) => (
          <li
            key={`${name}-${i}`}
            className={`border px-1.5 py-0.5 text-xs ${
              map.isFormula[i]
                ? "border-computed/40 bg-computed-bg text-computed"
                : "border-input/40 bg-input-bg text-ink-soft"
            }`}
          >
            {name}
          </li>
        ))}
        {map.more > 0 && (
          /* Nói thẳng số cột còn lại thay vì để dải ô kết thúc lửng lơ: card
             giấu bớt là chuyện bình thường, giấu mà không khai mới là nói dối
             về quy mô file. */
          <li className="px-1.5 py-0.5 text-xs text-ink-faint">
            +{map.more} cột
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Bản một dòng của cùng câu chuyện, dùng ở danh sách dạng dòng.
 *
 * Dòng trong TemplateList chỉ cao ~44px nên không nhét nổi một bảng thu nhỏ.
 * Thứ vẫn vừa là hình dạng cột: mấy ô con cho biết file này phần lớn là chỗ
 * bạn nhập hay phần lớn là chỗ Excel tính. Đó đúng là câu người tra danh sách
 * đang hỏi — "file này tự tính giúp tôi được bao nhiêu".
 *
 * Cùng ký hiệu với dãy ô trên SystemCard, chỉ khác cấp: ở đó mỗi ô là một file,
 * ở đây mỗi ô là một cột.
 */
export function SheetShape({ shape }: { shape: boolean[] }) {
  if (shape.length === 0) return null;

  const computed = shape.filter(Boolean).length;

  /*
   * Cột trong lưới rộng cố định, nên số ô phải có trần: file 16 cột mà vẽ đủ
   * 16 ô là tràn sang cột "Độ khó" và cả vùng hết ra hình bảng tính.
   *
   * Cắt đuôi thì tỉ lệ xanh dương / xanh lá hiện ra sai, nên phần vượt trần
   * được nén lại theo đúng tỉ lệ thật thay vì bỏ đi — hình dạng giữ nguyên, chỉ
   * là vẽ bằng ít ô hơn. Con số chính xác vẫn nằm ở nhãn cho trình đọc màn hình.
   */
  const MAX = 12;
  const drawn =
    shape.length <= MAX
      ? shape
      : Array.from(
          { length: MAX },
          (_, i) => i >= MAX - Math.round((computed / shape.length) * MAX),
        );

  return (
    <span
      className="flex items-center gap-px"
      // Ô màu không đọc thành lời được, nên nói thẳng con số cho trình đọc.
      title={`${computed}/${shape.length} cột do Excel tự tính`}
    >
      <span className="sr-only">
        {computed} trên {shape.length} cột do Excel tự tính
      </span>
      {drawn.map((isFormula, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-3 w-1 border ${
            isFormula
              ? "border-computed/40 bg-computed-bg"
              : "border-input/40 bg-input-bg"
          }`}
        />
      ))}
    </span>
  );
}
