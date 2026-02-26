export function paymentSuccessEmail(data) {

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP"
    }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

  return `
  <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color:#27ae60;margin-top:0;">💳 Payment Successful</h2>

      <p>Hello <b>${data.first_name} ${data.last_name}</b>,</p>

      <p>Your payment has been successfully processed.</p>

      <div style="background:#eafaf1;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Amount Paid:</b> ${formatCurrency(data.amount)}</p>
        <p><b>Payment Method:</b> ${data.payment_method.toUpperCase()}</p>
        <p><b>Transaction ID:</b> ${data.external_id}</p>
        <p><b>Paid On:</b> ${formatDate(data.createdAt)}</p>
      </div>

      <p>Your membership will now proceed for activation.</p>

      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;">Powered by Xendit — XFactor Fitness Gym Trece</p>

    </div>
  </div>
  `;
}
