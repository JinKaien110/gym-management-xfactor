import ucfirst from "../../utils/ucfirst.js";

export function membershipFrozenEmail(data) {

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  return `
  <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color:#e67e22;margin-top:0;">❄️ membership Frozen</h2>

      <p>Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,</p>

      <p>Your membership has been temporarily frozen.</p>

      <div style="background:#fdf6e3;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Plan:</b> ${data.plan_name}</p>
        <p><b>Frozen From:</b> ${formatDate(data.frozen_from)}</p>
        <p><b>Frozen Until:</b> ${formatDate(data.frozen_til)}</p>
        <p><b>Processed By:</b> ${data.frozenBy}</p>
      </div>

      <p>Your membership will automatically resume after the freeze period.</p>

      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;">— 6Pack Iron City</p>

    </div>
  </div>
  `;
}
