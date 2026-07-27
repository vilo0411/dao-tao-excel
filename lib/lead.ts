import { z } from "zod";

/** Mục đích học — dùng để phân luồng tư vấn sang đúng khóa bên HVS. */
export const LEAD_GOALS = [
  { value: "nhan-su", label: "Làm nhân sự: chấm công, tính lương, báo cáo HR" },
  { value: "ke-toan", label: "Làm kế toán, tài chính" },
  { value: "van-phong", label: "Công việc văn phòng nói chung" },
  { value: "sinh-vien", label: "Sinh viên, chuẩn bị đi làm" },
] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(100),
  email: z.email("Email không hợp lệ"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0")
    .optional()
    .or(z.literal("")),
  goal: z.enum(LEAD_GOALS.map((g) => g.value) as [string, ...string[]], {
    error: "Vui lòng chọn mục đích học",
  }),
  /** Trang mà người dùng đang xem khi điền form. */
  source: z.string().max(200).optional(),
});

export type Lead = z.infer<typeof leadSchema>;
