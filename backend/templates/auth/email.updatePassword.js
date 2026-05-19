import ucfirst from "../../utils/ucfirst.js";

export function emailUpdateAdminPassword(data, password) {
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
        🔐 Password Updated
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(data.first_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        Your admin account password has been updated by a <b>Super Administrator</b>.
      </p>

      <div style="
          background:#f8f9fc;
          border:1px solid #e3e6f0;
          border-radius:8px;
          padding:15px;
          margin:20px 0;
      ">
        <p style="margin:0;font-size:14px;">
          <b>Email:</b> ${data.email}
        </p>
        <p style="margin:5px 0 0 0;font-size:14px;">
          <b>Temporary Password:</b> ${password}
        </p>
      </div>

      <p style="color:#333;font-size:14px;">
        For security reasons, please log in and change your password immediately.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        If you did not expect this change, please contact the system administrator immediately.
      </p>

      <p style="font-size:12px;color:#888;margin-top:8px;">
        — 6Pack Iron City Fitness System
      </p>
    </div>
  </div>
  `;
}
