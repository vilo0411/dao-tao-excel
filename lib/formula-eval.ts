/**
 * Bộ tính công thức Excel chạy trong trình duyệt, cho khối `sandbox` của khu
 * /kien-thuc-excel.
 *
 * VÌ SAO TỰ VIẾT. Site xuất tĩnh (`output: "export"`, next.config.ts:19-27) nên
 * không có chỗ nào chạy được Excel thật lúc người đọc gõ công thức. Một thư
 * viện công thức đầy đủ nặng vài trăm KB và mang theo hàng trăm hàm mà site
 * này không dạy — trong khi tập hàm cần hỗ trợ đúng bằng tập hàm đang có trang
 * ở /ham-excel, hiện là 10.
 *
 * PHẠM VI CÓ CHỦ ĐÍCH. Đây KHÔNG phải Excel. Nó không có: tham chiếu tuyệt đối
 * ($A$1), tham chiếu sang sheet khác, ngày tháng dạng serial, mảng động, định
 * dạng số. Khối sandbox phải in rõ giới hạn này ra màn hình — một công cụ giả
 * vờ là Excel rồi trả khác Excel thì tệ hơn là không có công cụ.
 *
 * KHÔNG import FUNCTION_INFO. lib/functions.ts kéo theo lib/templates.ts (dùng
 * node:fs) nên không dùng được ở client. Chiều phụ thuộc vì vậy bị đảo lại:
 * file này khai danh sách hàm nó chạy được, và lib/knowledge.ts kiểm lúc build
 * rằng danh sách đó phủ hết các hàm đang có trang. Hệ quả đúng như mong muốn —
 * mở một trang hàm mới mà chưa cài hàm đó vào đây thì GÃY BUILD, thay vì để
 * sandbox lặng lẽ trả #NAME? cho một hàm mà site vừa dạy xong.
 */

/** Mã lỗi Excel mà bộ tính này sinh ra. Đúng chuỗi Excel hiển thị. */
export const ERROR_CODES = [
  "#DIV/0!",
  "#VALUE!",
  "#NAME?",
  "#REF!",
  "#NUM!",
  "#N/A",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * Lỗi là một GIÁ TRỊ, không phải một exception thoát ra ngoài.
 *
 * Excel lan truyền lỗi qua công thức: =A1+1 với A1 là #VALUE! cho ra #VALUE!.
 * Mô hình bằng exception thì mỗi phép toán phải bọc try/catch; mô hình bằng
 * giá trị thì chỉ cần một lần kiểm ở đầu mỗi toán tử. IFERROR cũng vì thế mà
 * viết được tự nhiên thay vì phải bắt exception.
 */
export class FormulaError {
  // Khai trường rồi gán trong thân hàm, KHÔNG dùng parameter property
  // (`constructor(readonly code)`). Node chạy các file lib/ này qua
  // --experimental-strip-types, chế độ chỉ xoá kiểu chứ không biên dịch, và
  // parameter property là cú pháp cần sinh code nên nó ném ngay lúc nạp.
  readonly code: ErrorCode;
  constructor(code: ErrorCode) {
    this.code = code;
  }
  toString(): string {
    return this.code;
  }
}

const DIV0 = new FormulaError("#DIV/0!");
const VALUE = new FormulaError("#VALUE!");
const NAME = new FormulaError("#NAME?");
const REF = new FormulaError("#REF!");
const NUM = new FormulaError("#NUM!");

export function isError(v: unknown): v is FormulaError {
  return v instanceof FormulaError;
}

/** Giá trị một ô. `null` là ô trống — khác với chuỗi rỗng, xem coerceNumber. */
export type CellValue = number | string | boolean | null | FormulaError;

/** Lưới dữ liệu, `grid[hàng][cột]`, gốc ở A1. */
export type Grid = readonly (readonly CellValue[])[];

/** Kết quả trung gian: một ô, hoặc một dải đã trải phẳng. */
type Operand = CellValue | CellValue[];

// ---------------------------------------------------------------------------
// Ép kiểu
// ---------------------------------------------------------------------------

/**
 * Ép về số theo luật Excel, dùng cho toán tử số học và cho đối số vô hướng.
 *
 * Chuỗi trông giống số thì ép được: ="5"+1 ra 6 trong Excel. Đây không phải
 * chi tiết vụn — nó chính là lý do bài "số lưu dạng văn bản" tồn tại: cộng
 * bằng toán tử thì ra đúng, cộng bằng SUM thì ra 0, và người dùng không hiểu
 * vì sao. Bộ tính phải tái hiện đúng cả hai vế thì bài mới chứng minh được.
 */
function coerceNumber(v: CellValue): number | FormulaError {
  if (isError(v)) return v;
  if (v === null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const trimmed = v.trim();
  if (trimmed === "") return VALUE;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : VALUE;
}

function coerceText(v: CellValue): string | FormulaError {
  if (isError(v)) return v;
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

function coerceBoolean(v: CellValue): boolean | FormulaError {
  if (isError(v)) return v;
  if (v === null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const upper = v.trim().toUpperCase();
  if (upper === "TRUE") return true;
  if (upper === "FALSE") return false;
  return VALUE;
}

/**
 * Rút một giá trị đơn từ một toán hạng.
 *
 * Dải trong ngữ cảnh vô hướng trả #VALUE!. Excel thật làm "implicit
 * intersection" (=A1:A5 ở dòng 3 cho ra A3), một hành vi mà gần như không ai
 * cố ý dùng và giải thích được cho người mới. Trả lỗi là câu trả lời trung
 * thực hơn cho một công cụ dạy học.
 */
function single(op: Operand): CellValue {
  return Array.isArray(op) ? VALUE : op;
}

// ---------------------------------------------------------------------------
// Phân tích từ vựng
// ---------------------------------------------------------------------------

type TokenType =
  | "number"
  | "string"
  | "ref"
  | "name"
  | "op"
  | "("
  | ")"
  | ","
  | ":";

type Token = { type: TokenType; value: string };

const CELL_REF = /^[A-Z]{1,3}[0-9]{1,5}$/;

function tokenize(src: string): Token[] | FormulaError {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }

    if (c === '"') {
      let j = i + 1;
      let out = "";
      while (j < src.length) {
        // Excel thoát dấu nháy kép bằng cách nhân đôi: "he said ""hi"""
        if (src[j] === '"' && src[j + 1] === '"') {
          out += '"';
          j += 2;
          continue;
        }
        if (src[j] === '"') break;
        out += src[j];
        j++;
      }
      if (j >= src.length) return VALUE; // chuỗi không đóng
      tokens.push({ type: "string", value: out });
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const raw = src.slice(i, j);
      if (!Number.isFinite(Number(raw))) return VALUE;
      tokens.push({ type: "number", value: raw });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
      const raw = src.slice(i, j);
      const upper = raw.toUpperCase();
      tokens.push({
        type: CELL_REF.test(upper) ? "ref" : "name",
        value: upper,
      });
      i = j;
      continue;
    }

    if (c === "(" || c === ")" || c === "," || c === ":") {
      tokens.push({ type: c, value: c });
      i++;
      continue;
    }

    // Toán tử hai ký tự phải thử trước toán tử một ký tự.
    const two = src.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>") {
      tokens.push({ type: "op", value: two });
      i += 2;
      continue;
    }

    if ("+-*/^&=<>".includes(c)) {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }

    // Ký tự lạ: $ (tham chiếu tuyệt đối), ! (sheet khác), { } (mảng)...
    // Đều là thứ bộ tính này cố ý không hỗ trợ, và #NAME? là mã Excel dùng cho
    // "tôi không đọc được cái tên này".
    return NAME;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Cây cú pháp
// ---------------------------------------------------------------------------

type Node =
  | { kind: "lit"; value: CellValue }
  | { kind: "ref"; col: number; row: number }
  | { kind: "range"; c1: number; r1: number; c2: number; r2: number }
  | { kind: "unary"; op: string; arg: Node }
  | { kind: "binary"; op: string; left: Node; right: Node }
  | { kind: "call"; name: string; args: Node[] };

/** "A1" → {col:0, row:0}. "AA10" → {col:26, row:9}. */
function parseRef(raw: string): { col: number; row: number } {
  const m = /^([A-Z]+)([0-9]+)$/.exec(raw)!;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: Number(m[2]) - 1 };
}

/**
 * Thứ tự ưu tiên của toán tử hai ngôi, số lớn buộc chặt hơn.
 * Giống Excel: so sánh lỏng nhất, rồi nối chuỗi, rồi cộng trừ, nhân chia, luỹ thừa.
 */
const BINARY_PRECEDENCE: Record<string, number> = {
  "=": 1,
  "<>": 1,
  "<": 1,
  ">": 1,
  "<=": 1,
  ">=": 1,
  "&": 2,
  "+": 3,
  "-": 3,
  "*": 4,
  "/": 4,
  "^": 5,
};

class Parser {
  private pos = 0;
  private readonly tokens: Token[];
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parse(): Node | FormulaError {
    const node = this.parseExpr(0);
    if (isError(node)) return node;
    // Còn token thừa nghĩa là công thức sai cú pháp, ví dụ "=1 2".
    if (this.pos !== this.tokens.length) return VALUE;
    return node;
  }

  private parseExpr(minPrec: number): Node | FormulaError {
    let left = this.parseUnary();
    if (isError(left)) return left;

    for (;;) {
      const t = this.peek();
      if (!t || t.type !== "op") break;
      const prec = BINARY_PRECEDENCE[t.value];
      if (prec === undefined || prec < minPrec) break;
      this.next();
      // ^ kết hợp phải trong Excel; các toán tử còn lại kết hợp trái.
      const right = this.parseExpr(t.value === "^" ? prec : prec + 1);
      if (isError(right)) return right;
      left = { kind: "binary", op: t.value, left, right };
    }

    return left;
  }

  private parseUnary(): Node | FormulaError {
    const t = this.peek();
    if (t?.type === "op" && (t.value === "-" || t.value === "+")) {
      this.next();
      const arg = this.parseUnary();
      if (isError(arg)) return arg;
      return { kind: "unary", op: t.value, arg };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node | FormulaError {
    const t = this.next();
    if (!t) return VALUE;

    if (t.type === "number") {
      return { kind: "lit", value: Number(t.value) };
    }

    if (t.type === "string") {
      return { kind: "lit", value: t.value };
    }

    if (t.type === "(") {
      const inner = this.parseExpr(0);
      if (isError(inner)) return inner;
      if (this.next()?.type !== ")") return VALUE;
      return inner;
    }

    if (t.type === "ref") {
      const a = parseRef(t.value);
      if (this.peek()?.type === ":") {
        this.next();
        const end = this.next();
        if (!end || end.type !== "ref") return VALUE;
        const b = parseRef(end.value);
        return {
          kind: "range",
          c1: Math.min(a.col, b.col),
          r1: Math.min(a.row, b.row),
          c2: Math.max(a.col, b.col),
          r2: Math.max(a.row, b.row),
        };
      }
      return { kind: "ref", ...a };
    }

    if (t.type === "name") {
      if (t.value === "TRUE") return { kind: "lit", value: true };
      if (t.value === "FALSE") return { kind: "lit", value: false };

      // Một tên không đi kèm "(" là tên vùng hoặc lỗi gõ — cả hai đều #NAME?.
      if (this.peek()?.type !== "(") return NAME;
      this.next();

      const args: Node[] = [];
      if (this.peek()?.type === ")") {
        this.next();
      } else {
        for (;;) {
          const arg = this.parseExpr(0);
          if (isError(arg)) return arg;
          args.push(arg);
          const sep = this.next();
          if (sep?.type === ")") break;
          if (sep?.type !== ",") return VALUE;
        }
      }
      return { kind: "call", name: t.value, args };
    }

    return VALUE;
  }
}

// ---------------------------------------------------------------------------
// Hàm
// ---------------------------------------------------------------------------

/**
 * Đối số chưa tính, để hàm tự quyết định có tính hay không.
 *
 * IF và IFERROR bắt buộc phải lười: =IF(A1=0, "chia 0", B1/A1) mà tính sẵn cả
 * hai nhánh thì nhánh sai vẫn sinh #DIV/0! rồi lan ra ngoài, đúng cái bẫy mà
 * bài "lỗi #DIV/0!" đang dạy cách tránh.
 */
type LazyArg = () => Operand;

type FnImpl = {
  minArgs: number;
  maxArgs: number;
  call: (args: LazyArg[]) => Operand;
};

/**
 * Gom số theo luật "hàm thống kê" của Excel: trong một DẢI, chuỗi và giá trị
 * logic bị bỏ qua; là ĐỐI SỐ VÔ HƯỚNG thì chúng được ép kiểu.
 *
 * Đây là chỗ dễ cài sai nhất và cũng là chỗ đáng cài đúng nhất: chính sự khác
 * biệt này làm =SUM(A1:A5) ra 0 trong khi =A1+A2+A3+A4+A5 ra đúng, khi cột A
 * chứa số lưu dạng văn bản.
 */
function collectNumbers(args: LazyArg[]): number[] | FormulaError {
  const out: number[] = [];
  for (const a of args) {
    const v = a();
    if (Array.isArray(v)) {
      for (const cell of v) {
        if (isError(cell)) return cell;
        if (typeof cell === "number") out.push(cell);
        // chuỗi, boolean, ô trống trong dải: bỏ qua, đúng như Excel
      }
    } else {
      if (isError(v)) return v;
      if (v === null) continue;
      const n = coerceNumber(v);
      if (isError(n)) return n;
      out.push(n);
    }
  }
  return out;
}

function collectBooleans(args: LazyArg[]): boolean[] | FormulaError {
  const out: boolean[] = [];
  for (const a of args) {
    const v = a();
    const cells = Array.isArray(v) ? v : [v];
    for (const cell of cells) {
      if (isError(cell)) return cell;
      if (cell === null) continue;
      if (typeof cell === "string" && Array.isArray(v)) continue; // chuỗi trong dải: bỏ qua
      const b = coerceBoolean(cell);
      if (isError(b)) return b;
      out.push(b);
    }
  }
  return out;
}

/**
 * Các hàm sandbox chạy được. Phải luôn PHỦ HẾT tập hàm có trang ở /ham-excel —
 * lib/knowledge.ts kiểm điều đó lúc build và ném lỗi nếu thiếu.
 */
export const SUPPORTED_FUNCTIONS: Record<string, FnImpl> = {
  SUM: {
    minArgs: 1,
    maxArgs: 255,
    call: (args) => {
      const nums = collectNumbers(args);
      if (isError(nums)) return nums;
      return nums.reduce((a, b) => a + b, 0);
    },
  },

  MAX: {
    minArgs: 1,
    maxArgs: 255,
    call: (args) => {
      const nums = collectNumbers(args);
      if (isError(nums)) return nums;
      // Excel trả 0 cho MAX của một dải không có số nào, không phải lỗi.
      return nums.length === 0 ? 0 : Math.max(...nums);
    },
  },

  MIN: {
    minArgs: 1,
    maxArgs: 255,
    call: (args) => {
      const nums = collectNumbers(args);
      if (isError(nums)) return nums;
      return nums.length === 0 ? 0 : Math.min(...nums);
    },
  },

  ROUND: {
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const n = coerceNumber(single(args[0]()));
      if (isError(n)) return n;
      const d = coerceNumber(single(args[1]()));
      if (isError(d)) return d;
      const digits = Math.trunc(d);
      const f = Math.pow(10, digits);
      // Excel làm tròn nửa ra xa số 0; Math.round làm tròn nửa lên trên, nên
      // -2.5 sẽ ra -2 thay vì -3 nếu dùng thẳng.
      const scaled = n * f;
      const rounded =
        scaled < 0 ? -Math.round(-scaled) : Math.round(scaled);
      const result = rounded / f;
      return Number.isFinite(result) ? result : NUM;
    },
  },

  N: {
    minArgs: 1,
    maxArgs: 1,
    call: (args) => {
      const v = single(args[0]());
      if (isError(v)) return v;
      if (typeof v === "number") return v;
      if (typeof v === "boolean") return v ? 1 : 0;
      // Điểm mấu chốt: CHỮ ra 0, không phải lỗi. Đây là lý do các cột luỹ kế
      // trong template bọc N() quanh ô dòng trên — chạm lên dòng tiêu đề thì
      // ra 0 thay vì #VALUE!. Xem lib/schema.ts:26-32.
      return 0;
    },
  },

  IF: {
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const cond = coerceBoolean(single(args[0]()));
      if (isError(cond)) return cond;
      if (cond) return args[1]();
      return args[2] ? args[2]() : false;
    },
  },

  IFERROR: {
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const v = args[0]();
      const scalar = Array.isArray(v) ? v[0] ?? null : v;
      return isError(scalar) ? args[1]() : v;
    },
  },

  AND: {
    minArgs: 1,
    maxArgs: 255,
    call: (args) => {
      const bools = collectBooleans(args);
      if (isError(bools)) return bools;
      if (bools.length === 0) return VALUE;
      return bools.every(Boolean);
    },
  },

  OR: {
    minArgs: 1,
    maxArgs: 255,
    call: (args) => {
      const bools = collectBooleans(args);
      if (isError(bools)) return bools;
      if (bools.length === 0) return VALUE;
      return bools.some(Boolean);
    },
  },

  REPT: {
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const text = coerceText(single(args[0]()));
      if (isError(text)) return text;
      const n = coerceNumber(single(args[1]()));
      if (isError(n)) return n;
      const times = Math.trunc(n);
      if (times < 0) return VALUE;
      // Excel dừng ở 32767 ký tự; vượt là #VALUE!. Trần này cũng chặn luôn
      // chuyện một công thức trong sandbox treo tab của người đọc.
      if (text.length * times > 32767) return VALUE;
      return text.repeat(times);
    },
  },
};

export const SUPPORTED_FUNCTION_NAMES = Object.keys(SUPPORTED_FUNCTIONS);

// ---------------------------------------------------------------------------
// Tính
// ---------------------------------------------------------------------------

function cellAt(grid: Grid, row: number, col: number): CellValue {
  const r = grid[row];
  if (!r) return null;
  const v = r[col];
  return v === undefined ? null : v;
}

function compare(op: string, l: CellValue, r: CellValue): CellValue {
  // Excel so sánh số với số, chữ với chữ; số luôn nhỏ hơn chữ khi lệch kiểu.
  const bothNumeric = typeof l === "number" && typeof r === "number";
  let cmp: number;
  if (bothNumeric) {
    cmp = l < r ? -1 : l > r ? 1 : 0;
  } else {
    const ls = coerceText(l ?? "");
    const rs = coerceText(r ?? "");
    if (isError(ls)) return ls;
    if (isError(rs)) return rs;
    // So sánh chữ trong Excel không phân biệt hoa thường.
    const a = ls.toUpperCase();
    const b = rs.toUpperCase();
    cmp = a < b ? -1 : a > b ? 1 : 0;
  }
  switch (op) {
    case "=":
      return cmp === 0;
    case "<>":
      return cmp !== 0;
    case "<":
      return cmp < 0;
    case ">":
      return cmp > 0;
    case "<=":
      return cmp <= 0;
    case ">=":
      return cmp >= 0;
    default:
      return VALUE;
  }
}

function evalNode(node: Node, grid: Grid): Operand {
  switch (node.kind) {
    case "lit":
      return node.value;

    case "ref": {
      if (node.row < 0 || node.col < 0) return REF;
      return cellAt(grid, node.row, node.col);
    }

    case "range": {
      const out: CellValue[] = [];
      for (let r = node.r1; r <= node.r2; r++) {
        for (let c = node.c1; c <= node.c2; c++) {
          out.push(cellAt(grid, r, c));
        }
      }
      return out;
    }

    case "unary": {
      const v = single(evalNode(node.arg, grid));
      const n = coerceNumber(v);
      if (isError(n)) return n;
      return node.op === "-" ? -n : n;
    }

    case "binary": {
      const l = single(evalNode(node.left, grid));
      if (isError(l)) return l;
      const r = single(evalNode(node.right, grid));
      if (isError(r)) return r;

      if (node.op === "&") {
        const ls = coerceText(l);
        if (isError(ls)) return ls;
        const rs = coerceText(r);
        if (isError(rs)) return rs;
        return ls + rs;
      }

      if (BINARY_PRECEDENCE[node.op] === 1) return compare(node.op, l, r);

      const ln = coerceNumber(l);
      if (isError(ln)) return ln;
      const rn = coerceNumber(r);
      if (isError(rn)) return rn;

      switch (node.op) {
        case "+":
          return ln + rn;
        case "-":
          return ln - rn;
        case "*":
          return ln * rn;
        case "/":
          // Chính là chủ đề của một bài trong cụm. Phải là #DIV/0!, không phải
          // Infinity của JavaScript.
          return rn === 0 ? DIV0 : ln / rn;
        case "^": {
          const p = Math.pow(ln, rn);
          return Number.isFinite(p) ? p : NUM;
        }
        default:
          return VALUE;
      }
    }

    case "call": {
      const fn = SUPPORTED_FUNCTIONS[node.name];
      if (!fn) return NAME;
      if (node.args.length < fn.minArgs || node.args.length > fn.maxArgs) {
        return VALUE;
      }
      const lazy = node.args.map((a) => () => evalNode(a, grid));
      return fn.call(lazy);
    }
  }
}

/**
 * Tính một công thức trên một lưới.
 *
 * `formula` nhận cả dạng có "=" đứng đầu lẫn không — người đọc gõ tay thì hay
 * quên, và bắt bẻ chuyện đó không dạy được gì.
 *
 * Không có tham chiếu vòng ở đây: lưới là dữ liệu tĩnh do bài viết khai, công
 * thức không ghi ngược vào lưới. Bài về lỗi tham chiếu vòng vì vậy minh hoạ
 * bằng chữ và bằng file thật, không bằng sandbox.
 */
export function evaluateFormula(formula: string, grid: Grid = []): CellValue {
  const src = formula.trim().replace(/^=/, "");
  if (src === "") return null;

  const tokens = tokenize(src);
  if (isError(tokens)) return tokens;
  if (tokens.length === 0) return null;

  const ast = new Parser(tokens).parse();
  if (isError(ast)) return ast;

  return single(evalNode(ast, grid));
}

/** Hiển thị kết quả ra chuỗi, dùng chung cho sandbox và cho bản không-JS. */
export function formatValue(v: CellValue): string {
  if (isError(v)) return v.code;
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "#NUM!";
    // Cắt đuôi nhị phân kiểu 0.30000000000000004 mà không đụng tới số nguyên
    // lớn hay số cần nhiều chữ số thập phân thật.
    return String(Number(v.toPrecision(15)));
  }
  return v;
}
