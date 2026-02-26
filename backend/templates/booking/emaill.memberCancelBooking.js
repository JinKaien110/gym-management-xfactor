import ucfirst from "../../utils/ucfirst.js";

export function memberCancelBookingEmail(data) {

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

      <h2 style="margin-top:0;color:#c0392b;">
        ❌ Booking Cancelled
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        Your booking for the class below has been successfully cancelled.
      </p>

      <div style="
          background:#fff5f5;
          border:1px solid #f5c6cb;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Class Name:</b> ${data.name}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Status:</b> Cancelled
        </p>

        ${
          data.reason
            ? `<p style="margin:0;font-size:14px;">
                <b>Reason:</b> ${data.reason}
              </p>`
            : ""
        }

      </div>

      <p style="color:#333;font-size:14px;">
        If this was a mistake, you may book the class again through your account.
      </p>

      <p style="color:#333;font-size:14px;">
        We hope to see you in another session soon 💪
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — XFactor Fitness Gym Trece
      </p>

    </div>
  </div>
  `;
}
