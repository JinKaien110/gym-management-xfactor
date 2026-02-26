import ucfirst from "../../utils/ucfirst.js";

export function trainerAssignedToMemberEmail(data) {

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

      <h2 style="color:#3498db;margin-top:0;">🏋️ Trainer Assigned</h2>

      <p>Hello <b>${ucfirst(data.member_first_name)} ${ucfirst(data.member_last_name)}</b>,</p>

      <p>Great news! A trainer has been assigned to support your fitness journey.</p>

      <div style="background:#eef6ff;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Trainer Name:</b> ${ucfirst(data.trainer_first_name)} ${ucfirst(data.trainer_last_name)}</p>
        <p><b>Email:</b> ${data.trainer_email}</p>
        <p><b>Contact:</b> ${data.trainer_phone || "N/A"}</p>
        <p><b>Assigned On:</b> ${formatDate(data.assignedAt)}</p>
      </div>

      <p>Your trainer will guide you throughout your membership.</p>

      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;">— XFactor Fitness Gym Trece</p>

    </div>
  </div>
  `;
}
