import ucfirst from "../../utils/ucfirst.js";

export function membershipUpdatedEmail(data) {

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  return `
  <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color:#f39c12;margin-top:0;">🔄 membership Updated</h2>

      <p>Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,</p>

      <p>Your membership details have been updated.</p>

      <div style="background:#fff8e1;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Plan:</b> ${data.plan_name}</p>
        <p><b>Start Date:</b> ${formatDate(data.start_date)}</p>
        <p><b>End Date:</b> ${formatDate(data.end_date)}</p>
        <p><b>Updated On:</b> ${formatDate(data.updatedAt)}</p>
      </div>

      <p>If you did not request this change, please contact the admin.</p>

      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;">— 6Pack Iron City</p>

    </div>
  </div>
  `;
}
