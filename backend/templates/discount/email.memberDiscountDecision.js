import ucfirst from "../../utils/ucfirst.js";

export function memberDiscountDecisionEmail(data) {

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const isApproved = data.decision === "approved";

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

      <h2 style="margin-top:0;color:${isApproved ? "#27ae60" : "#c0392b"};">
        ${isApproved ? "✅ Discount Approved" : "❌ Discount Rejected"}
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        Your discount request has been 
        <b>${isApproved ? "approved" : "reviewed and not approved"}</b>.
      </p>

      <div style="
          background:${isApproved ? "#f0fff4" : "#fff5f5"};
          border:1px solid ${isApproved ? "#c6f6d5" : "#f5c6cb"};
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Discount Type:</b> ${data.discount_type}
        </p>

        ${
          data.price
            ? `<p style="margin:0 0 8px 0;font-size:14px;">
                <b>Membership Price:</b> ${formatCurrency(data.price)}
              </p>`
            : ""
        }

        ${
          data.membership_fee
            ? `<p style="margin:0 0 8px 0;font-size:14px;">
                <b>Membership Price:</b> ${formatCurrency(data.membership_fee)}
              </p>`
            : ""
        }

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Member Type:</b> ${data.member_type}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Membership Status:</b> Ready for payment to activate
        </p>

        <p style="margin:0;font-size:14px;">
          <b>Reviewed On:</b> ${formatDate(data.reviewed_at)}
        </p>

      </div>

      ${
        isApproved
          ? `<p style="color:#333;font-size:14px;">
              You may now proceed with your membership payment.
            </p>`
          : `<p style="color:#333;font-size:14px;">
              You may still proceed with regular membership payment.
            </p>`
      }

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — XFactor Fitness Gym Trece
      </p>

    </div>
  </div>
  `;
}
