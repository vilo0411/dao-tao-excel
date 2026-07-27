"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_GOALS, leadSchema } from "@/lib/lead";

export function LeadForm({ source }: { source?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      goal: String(form.get("goal") ?? ""),
      source,
    };

    // Validate bằng đúng schema mà API dùng, nên thông báo lỗi hai bên không lệch nhau.
    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error("request failed");

      window.gtag?.("event", "generate_lead", { goal: parsed.data.goal });
      router.push("/khoa-hoc-excel/cam-on");
    } catch {
      setServerError(
        "Chưa gửi được thông tin. Vui lòng thử lại hoặc liên hệ trực tiếp HVS.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Họ và tên" name="name" error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="w-full border border-rule bg-paper px-3 py-2"
        />
      </Field>

      <Field label="Email" name="email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full border border-rule bg-paper px-3 py-2"
        />
      </Field>

      <Field
        label="Số điện thoại (không bắt buộc)"
        name="phone"
        error={errors.phone}
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className="w-full border border-rule bg-paper px-3 py-2"
        />
      </Field>

      <Field label="Bạn cần Excel cho việc gì?" name="goal" error={errors.goal}>
        <select
          id="goal"
          name="goal"
          defaultValue={LEAD_GOALS[0].value}
          className="w-full border border-rule bg-paper px-3 py-2"
        >
          {LEAD_GOALS.map((goal) => (
            <option key={goal.value} value={goal.value}>
              {goal.label}
            </option>
          ))}
        </select>
      </Field>

      {serverError && (
        <p role="alert" className="text-flag text-sm">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink px-6 py-3 font-medium text-paper hover:bg-input disabled:opacity-60"
      >
        {submitting ? "Đang gửi..." : "Nhận tư vấn khóa học"}
      </button>

      <p className="text-xs text-ink-soft">
        Thông tin của bạn được chuyển cho HVS Tài Chính Số để tư vấn. Tôi không
        dùng vào việc gì khác và không gửi thư quảng cáo.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-flag mt-1 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
