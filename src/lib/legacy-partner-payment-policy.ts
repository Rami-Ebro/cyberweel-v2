/** Legacy project records are operational compatibility data, not a payment ledger. */
export function legacyPartnerPaymentError(input: Record<string, unknown>): string | null {
  if (
    (input.paymentStatus != null && input.paymentStatus !== "PENDING")
    || (input.paidAt != null && input.paidAt !== "")
    || input.status === "PAID"
    || input.projectStatus === "PAID"
  ) {
    return "لا يمكن تقرير دفع مستحق الشريك من المسار القديم. يبدأ الإسناد بانتظار الاستحقاق، ويُسجل الدفع من إسناد المرحلة بعد الاعتماد وإرفاق إثبات الدفع.";
  }
  return null;
}
