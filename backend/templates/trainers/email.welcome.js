import ucfirst from "../../utils/ucfirst.js";

export function welcomeTrainer(data, password) {
 
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
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="margin:0;color:#dc2626;font-size:24px;">
          🏋️ Welcome to 6Pack Iron City Fitness!
        </h2>
      </div>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        Congratulations! Your trainer account has been successfully created. We're excited to have you on our team!
      </p>

      <div style="
          background:#f8f9fc;
          border:1px solid #e3e6f0;
          border-radius:8px;
          padding:15px;
          margin:20px 0;
      ">
        <p style="margin:0;font-size:14px;color:#333;">
          <b>Account Details:</b>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:10px 0;" />
        <p style="margin:5px 0;font-size:14px;">
          <b>Email:</b> ${data.email}
        </p>
        <p style="margin:5px 0;font-size:14px;">
          <b>Phone:</b> ${data.phone || 'N/A'}
        </p>
        <p style="margin:5px 0;font-size:14px;">
          <b>Specialization:</b> ${Array.isArray(data.specialization) ? data.specialization.map(s => ucfirst(s)).join(', ') : 'General Fitness'}
        </p>
        <p style="margin:5px 0;font-size:14px;">
          <b>Hourly Rate:</b> ₱${data.rate || '0'}/hour
        </p>
        <p style="margin:5px 0;font-size:14px;">
          <b>Availability:</b> ${Array.isArray(data.availability?.days) ? data.availability.days.map(d => ucfirst(d)).join(', ') : 'Not set'} (${data.availability?.time_from || '--'} - ${data.availability?.time_to || '--'})
        </p>
      </div>

      <div style="
          background:#fef3cd;
          border:1px solid #ffc107;
          border-radius:8px;
          padding:15px;
          margin:20px 0;
      ">
        <p style="margin:0;font-size:14px;color:#856404;">
          <b>🔑 Temporary Password:</b> <span style="font-size:18px;font-weight:bold;">${password}</span>
        </p>
      </div>

      <p style="color:#dc2626;font-size:14px;font-weight:bold;">
        ⚠️ Important: Please change your password immediately after your first login for security reasons.
      </p>

      <p style="color:#333;font-size:14px;">
        As a trainer, you can:
      </p>
      <ul style="color:#333;font-size:14px;padding-left:20px;">
        <li>Manage your assigned clients' training sessions</li>
        <li>Create and approve workout recommendations</li>
        <li>Track client progress and goals</li>
        <li>View your earnings and schedule</li>
      </ul>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        If you have any questions, please contact the system administrator.
      </p>

      <p style="font-size:12px;color:#888;margin-top:8px;">
        — 6Pack Iron City Fitness System
      </p>
    </div>
  </div>
  `;
}