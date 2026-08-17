/**
 * Test cho lib/formula-eval.ts.
 *
 *   node --experimental-strip-types scripts/test-formula-eval.mts
 *
 * Dùng `node:test` có sẵn trong Node thay vì thêm một test runner: repo này
 * chưa có framework test nào, và kéo về một cái chỉ để chạy một file là cái
 * giá không tương xứng. Chạy trong `npm run validate` nên CI cũng bắt được.
 *
 * Bộ test này là điều kiện để sandbox tồn tại. Một bộ tính công thức trả sai
 * trên trang dạy Excel thì tệ hơn hẳn việc không có sandbox — nó dạy sai.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateFormula,
  formatValue,
  isError,
  SUPPORTED_FUNCTION_NAMES,
  type Grid,
} from "../lib/formula-eval.ts";

/**
 * Lưới dùng chung cho phần lớn test.
 *
 *      A            B        C        D
 *  1   "Lương"      12000    0        "Nguyễn A"
 *  2   "Thưởng"     3000     2        "Trần B"
 *  3   "Phạt"       -500     4        ""
 *  4   "Tổng"       null     null     "8"        ← số lưu dạng VĂN BẢN
 */
const grid: Grid = [
  ["Lương", 12000, 0, "Nguyễn A"],
  ["Thưởng", 3000, 2, "Trần B"],
  ["Phạt", -500, 4, ""],
  ["Tổng", null, null, "8"],
];

/** Gọn hơn viết evaluateFormula(...) rồi formatValue(...) ở từng dòng. */
function ev(formula: string, g: Grid = grid): string {
  return formatValue(evaluateFormula(formula, g));
}

// ---------------------------------------------------------------------------

test("hằng số và cú pháp cơ bản", () => {
  assert.equal(ev("=1"), "1");
  assert.equal(ev("1"), "1", "thiếu dấu = vẫn tính được");
  assert.equal(ev("=1.5"), "1.5");
  assert.equal(ev('="xin chào"'), "xin chào");
  assert.equal(ev('="he said ""hi"""'), 'he said "hi"');
  assert.equal(ev("=TRUE"), "TRUE");
  assert.equal(ev("=FALSE"), "FALSE");
  assert.equal(ev("="), "", "công thức rỗng ra ô trống, không phải lỗi");
});

test("số học và thứ tự ưu tiên", () => {
  assert.equal(ev("=1+2*3"), "7", "nhân trước cộng");
  assert.equal(ev("=(1+2)*3"), "9");
  assert.equal(ev("=2^3^2"), "512", "luỹ thừa kết hợp phải: 2^(3^2)");
  assert.equal(ev("=10-3-2"), "5", "trừ kết hợp trái");
  assert.equal(ev("=-3+1"), "-2");
  assert.equal(ev("=-2^2"), "4", "dấu âm buộc chặt hơn luỹ thừa, như Excel");
  assert.equal(ev("=0.1+0.2"), "0.3", "cắt đuôi nhị phân");
});

test("chia cho 0 ra #DIV/0! chứ không ra Infinity", () => {
  assert.equal(ev("=1/0"), "#DIV/0!");
  assert.equal(ev("=B1/C1"), "#DIV/0!", "C1 = 0");
  assert.equal(ev("=B1/C2"), "6000", "C2 = 2");
});

test("lỗi lan truyền qua toán tử", () => {
  assert.equal(ev("=1/0+1"), "#DIV/0!");
  assert.equal(ev("=SUM(1/0, 5)"), "#DIV/0!");
});

test("nối chuỗi", () => {
  assert.equal(ev('="a"&"b"'), "ab");
  assert.equal(ev("=D1&\" - \"&B1"), "Nguyễn A - 12000");
  assert.equal(ev("=1&2"), "12", "số nối thành chuỗi");
  assert.equal(ev("=TRUE&\"\""), "TRUE");
});

test("so sánh", () => {
  assert.equal(ev("=1<2"), "TRUE");
  assert.equal(ev("=2<=2"), "TRUE");
  assert.equal(ev("=1<>1"), "FALSE");
  assert.equal(ev('="abc"="ABC"'), "TRUE", "so chữ không phân biệt hoa thường");
  assert.equal(ev("=B1>B2"), "TRUE");
});

test("tham chiếu ô và dải", () => {
  assert.equal(ev("=A1"), "Lương");
  assert.equal(ev("=B1"), "12000");
  assert.equal(ev("=b1"), "12000", "tham chiếu không phân biệt hoa thường");
  assert.equal(ev("=Z99"), "", "ô ngoài lưới là ô trống, không phải lỗi");
  assert.equal(ev("=SUM(B1:B3)"), "14500");
  assert.equal(ev("=SUM(B3:B1)"), "14500", "dải viết ngược vẫn đúng");
  assert.equal(ev("=B1:B3"), "#VALUE!", "dải ở ngữ cảnh vô hướng là lỗi");
});

test("SUM bỏ qua chữ trong dải nhưng ép kiểu đối số vô hướng", () => {
  // Đây là bằng chứng cho bài "số lưu dạng văn bản": D4 chứa chuỗi "8".
  assert.equal(ev("=SUM(D4)"), "8", "đối số vô hướng: chuỗi số được ép kiểu");
  assert.equal(ev("=SUM(D1:D4)"), "0", "trong dải: mọi chuỗi đều bị bỏ qua");
  assert.equal(ev("=D4+0"), "8", "toán tử thì ép kiểu");
  assert.equal(ev("=SUM(B1:B4)"), "14500", "ô trống trong dải tính là 0");
});

test("MAX và MIN", () => {
  assert.equal(ev("=MAX(B1:B3)"), "12000");
  assert.equal(ev("=MIN(B1:B3)"), "-500");
  assert.equal(ev("=MAX(A1:A3)"), "0", "dải toàn chữ ra 0, đúng như Excel");
  assert.equal(ev("=MIN(5, 2, 9)"), "2");
});

test("ROUND làm tròn nửa ra xa số 0", () => {
  assert.equal(ev("=ROUND(2.5, 0)"), "3");
  assert.equal(ev("=ROUND(-2.5, 0)"), "-3", "KHÔNG phải -2 như Math.round");
  assert.equal(ev("=ROUND(1234.5678, 2)"), "1234.57");
  assert.equal(ev("=ROUND(1234.5678, -2)"), "1200", "chữ số âm làm tròn hàng trăm");
});

test("N đổi chữ thành 0 chứ không báo lỗi", () => {
  assert.equal(ev("=N(5)"), "5");
  assert.equal(ev('=N("abc")'), "0");
  assert.equal(ev("=N(A1)"), "0", "A1 là chữ");
  assert.equal(ev("=N(TRUE)"), "1");
  // Đúng khuôn cột luỹ kế trong template: chạm dòng tiêu đề vẫn không gãy.
  assert.equal(ev("=N(A1)+B1"), "12000");
});

test("IF tính lười — nhánh không chọn không được sinh lỗi", () => {
  assert.equal(ev("=IF(TRUE, 1, 2)"), "1");
  assert.equal(ev("=IF(FALSE, 1, 2)"), "2");
  assert.equal(ev("=IF(FALSE, 1)"), "FALSE", "thiếu đối số 3 ra FALSE");
  assert.equal(
    ev('=IF(C1=0, "chưa có ngày công", B1/C1)'),
    "chưa có ngày công",
    "nhánh B1/C1 KHÔNG được chạy, nếu chạy sẽ ra #DIV/0!",
  );
  assert.equal(ev("=IF(C2>0, B2/C2, 0)"), "1500");
});

test("IFERROR bắt lỗi của nhánh đầu", () => {
  assert.equal(ev("=IFERROR(1/0, 0)"), "0");
  assert.equal(ev("=IFERROR(B1/C2, 0)"), "6000", "không lỗi thì giữ giá trị gốc");
  assert.equal(ev('=IFERROR(1/0, "chưa tính được")'), "chưa tính được");
  assert.equal(ev("=IFERROR(1/0, 1/0)"), "#DIV/0!", "nhánh dự phòng cũng lỗi");
});

test("AND và OR", () => {
  assert.equal(ev("=AND(TRUE, TRUE)"), "TRUE");
  assert.equal(ev("=AND(TRUE, FALSE)"), "FALSE");
  assert.equal(ev("=OR(FALSE, TRUE)"), "TRUE");
  assert.equal(ev("=AND(B1>0, C2>0)"), "TRUE");
  assert.equal(ev("=OR(B3>0, C1>0)"), "FALSE");
  assert.equal(ev("=AND(A1:A3)"), "#VALUE!", "dải toàn chữ: không còn giá trị logic nào");
});

test("REPT", () => {
  assert.equal(ev('=REPT("*", 3)'), "***");
  assert.equal(ev('=REPT("ab", 0)'), "");
  assert.equal(ev('=REPT("*", -1)'), "#VALUE!");
  assert.equal(ev('=REPT("*", 40000)'), "#VALUE!", "vượt trần 32767 ký tự");
});

test("hàm ngoài phạm vi ra #NAME? chứ không trả sai", () => {
  assert.equal(ev("=XLOOKUP(1,A1:A3,B1:B3)"), "#NAME?");
  assert.equal(ev("=VLOOKUP(1,A1:B3,2)"), "#NAME?");
  assert.equal(ev("=SUMM(1)"), "#NAME?", "gõ nhầm tên hàm");
  assert.equal(ev("=TONG_DOANH_THU"), "#NAME?", "tên vùng chưa đặt");
});

test("cú pháp không hỗ trợ báo lỗi thay vì im lặng tính sai", () => {
  assert.equal(ev("=$A$1"), "#NAME?", "tham chiếu tuyệt đối chưa hỗ trợ");
  assert.equal(ev("=Sheet2!A1"), "#NAME?", "tham chiếu sheet khác chưa hỗ trợ");
  assert.equal(ev("=1 2"), "#VALUE!", "token thừa");
  assert.equal(ev("=SUM("), "#VALUE!", "ngoặc không đóng");
  assert.equal(ev('="chưa đóng'), "#VALUE!");
  assert.equal(ev("=ROUND(1)"), "#VALUE!", "thiếu đối số bắt buộc");
});

test("SUPPORTED_FUNCTION_NAMES khớp với hiện thực", () => {
  assert.ok(SUPPORTED_FUNCTION_NAMES.length >= 10);
  for (const name of SUPPORTED_FUNCTION_NAMES) {
    assert.equal(
      isError(evaluateFormula(`=${name}(`)),
      true,
      `${name} phải được parser nhận là hàm`,
    );
    assert.notEqual(
      formatValue(evaluateFormula(`=${name}(`)),
      "#NAME?",
      `${name} có trong danh sách thì không được ra #NAME?`,
    );
  }
});

test("không có tham chiếu nào làm treo tab", () => {
  // Dải rất lớn trên lưới nhỏ: phải trả nhanh, và chỉ cộng đúng những ô có
  // thật. B cho 14500, C cho 0+2+4 = 6; A và D toàn chữ nên bị bỏ qua.
  const started = Date.now();
  assert.equal(ev("=SUM(A1:D100)"), "14506");
  assert.ok(Date.now() - started < 500, "phải xong dưới nửa giây");
});
