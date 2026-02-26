import ucfirst from "../../utils/ucfirst.js";

export function emailRequestMembership(member, request) {

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  return `
  <div style="
      font-family: Arial, sans-serif;
      background-color:#f4f6f9;
      padding:30px;
  ">
    <div style="
        max-width:600px;
        margin:0 auto;
        background:#ffffff;
        border-radius:12px;
        padding:30px;
        box-shadow:0 4px 12px rgba(0,0,0,0.08);
    ">
      <h2 style="margin-top:0;color:#2c3e50;">
        📩 Membership Request Received
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(member.first_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        We have successfully received your membership request.
      </p>

      <div style="
          background:#f8f9fc;
          border:1px solid #e3e6f0;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">
        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Plan:</b> ${request.label}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Category:</b> ${ucfirst(request.member_type)}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Amount:</b> ${formatCurrency(request.price)}
        </p>

        <p style="margin:0;font-size:14px;">
          <b>Status:</b> Active
        </p>
      </div>

      <p style="color:#333;font-size:14px;">
        ${
          request.member_type !== "regular"
            ? "Your discount request is currently under review. You will be notified once it is approved or rejected."
            : "You may proceed with the payment to activate your membership."
        }
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — X-Factor Fitness System
      </p>
    </div>
  </div>
  `;
}
