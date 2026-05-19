import ucfirst from "../../utils/ucfirst.js";

export function clientDiscountRequestEmail(data) {

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
        🏷️ Discount Request Submitted
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        We have successfully received your discount request. 
        It is now <b>under review</b>.
      </p>

      <div style="
          background:#f8f9fc;
          border:1px solid #e3e6f0;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">


        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Status:</b> Pending Review
        </p>

        ${
          data.requested_at
            ? `<p style="margin:0;font-size:14px;">
                <b>Submitted On:</b> ${formatDate(data.requested_at)}
              </p>`
            : ""
        }

      </div>

      <p style="color:#333;font-size:14px;">
        Our team will review your request and notify you once a decision has been made.
      </p>

      <p style="color:#333;font-size:14px;">
        Thank you for choosing 6Pack Iron City 💪
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — 6Pack Iron City
      </p>

    </div>
  </div>
  `;
}
