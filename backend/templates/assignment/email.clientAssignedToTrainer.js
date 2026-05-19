export function clientAssignedToTrainerEmail(data) {

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

      <h2 style="color:#2c3e50;margin-top:0;">👤 New client Assigned</h2>

      <p>Hello <b>${ucfirst(data.trainer_first_name)} ${ucfirst(data.trainer_last_name)}</b>,</p>

      <p>A new client has been assigned to you.</p>

      <div style="background:#f8f9fc;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>client:</b> ${ucfirst(data.client_first_name)} ${ucfirst(data.client_last_name)}</p>
        <p><b>Email:</b> ${data.client_email}</p>
        <p><b>Assigned On:</b> ${formatDate(data.assignedAt)}</p>
      </div>

      <p>Please coordinate with your new client accordingly.</p>

      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;">— 6Pack Iron City</p>

    </div>
  </div>
  `;
}
