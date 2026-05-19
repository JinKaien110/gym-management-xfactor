import ucfirst from "../utils/ucfirst.js";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export function emailDailyPassReminder(member, pass) {
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
      <h2 style="margin-top:0;color:#e74c3c;">
        ⚠️ Daily Pass Expiration Notice
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(member.first_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        This is a friendly reminder that your <b>Daily Pass</b> is about to expire in <b>3 days</b>.
      </p>

      <div style="
          background:#fff8e6;
          border:1px solid #ffe0b3;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">
        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Pass Type:</b> Daily Pass
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Expiration Date:</b> ${formatDate(pass.end_date)}
        </p>

        <p style="margin:0;font-size:14px;">
          <b>Status:</b> Active
        </p>
      </div>

      <p style="color:#666;font-size:14px;">
        To continue enjoying our facilities, please consider renewing your pass or upgrading to a membership plan.
      </p>

      <p style="color:#333;font-size:14px;">
        Visit us at the front desk or <a href="https://yourgym.com/renew" style="color:#e74c3c;text-decoration:none;">renew online</a>.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — Gym Capstone Fitness System
      </p>
    </div>
  </div>
  `;
}

export function emailMembershipReminder(member, membership) {
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
      <h2 style="margin-top:0;color:#e74c3c;">
        ⚠️ Membership Expiration Notice
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(member.first_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        This is a friendly reminder that your <b>${membership.label}</b> membership is about to expire in <b>3 days</b>.
      </p>

      <div style="
          background:#fff8e6;
          border:1px solid #ffe0b3;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">
        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Plan:</b> ${membership.label}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Duration:</b> ${membership.duration} (${membership.duration_days} days)
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Expiration Date:</b> ${formatDate(membership.end_date)}
        </p>

        <p style="margin:0;font-size:14px;">
          <b>Status:</b> Active
        </p>
      </div>

      <p style="color:#666;font-size:14px;">
        To continue enjoying our facilities without interruption, please consider renewing your membership or upgrading to a different plan.
      </p>

      <p style="color:#333;font-size:14px;">
        Visit us at the front desk or <a href="https://yourgym.com/renew" style="color:#e74c3c;text-decoration:none;">renew online</a>.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — Gym Capstone Fitness System
      </p>
    </div>
  </div>
  `;
}
