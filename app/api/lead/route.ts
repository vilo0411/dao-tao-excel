import { NextResponse } from "next/server";
import { z } from "zod";
import { leadSchema } from "@/lib/lead";

/**
 * Nhận lead từ bridge page.
 *
 * Vì không đo được chuyển đổi trên taichinhso.hvsvn.com, đây là điểm duy nhất
 * ta ghi nhận được người dùng thực sự quan tâm khóa học — dữ liệu ở đây là
 * thước đo thật của dự án, không phải lượt click.
 *
 * Đích lưu trữ đặt qua LEAD_WEBHOOK_URL (Google Apps Script, Zapier, Supabase
 * function...). Chưa cấu hình thì vẫn nhận và ghi log để không mất lead.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const lead = { ...parsed.data, submittedAt: new Date().toISOString() };
  const webhook = process.env.LEAD_WEBHOOK_URL;

  if (!webhook) {
    console.warn("[lead] Chưa cấu hình LEAD_WEBHOOK_URL — chỉ ghi log:", lead);
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) throw new Error(`webhook trả về ${response.status}`);
  } catch (error) {
    // Log đủ để khôi phục lead bằng tay — mất một lead đắt hơn nhiều so với
    // một dòng log thừa.
    console.error("[lead] Gửi webhook thất bại:", error, lead);
    return NextResponse.json(
      { error: "Không lưu được thông tin, vui lòng thử lại." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, stored: true });
}
