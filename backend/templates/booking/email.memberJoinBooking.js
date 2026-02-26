import ucfirst from "../../utils/ucfirst.js";

export function memberJoinBookingEmail(data) {

  const formatDateTime = (date) => {
    const d = new Date(date);

    const formattedDate = d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formattedTime = d.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return `${formattedDate} at ${formattedTime}`;
};


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
        📅 Class Booking Confirmed
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        You have successfully joined a class. Here are your booking details:
      </p>

      <div style="
          background:#f8f9fc;
          border:1px solid #e3e6f0;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Class Name:</b> ${data.name}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Trainer:</b> ${ucfirst(data.trainer_first_name)} ${ucfirst(data.trainer_last_name)}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Start Date:</b> ${formatDateTime(data.start_at)}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Location:</b> ${data.location}
        </p>

        ${
          data.notes
            ? `<p style="margin:0 0 8px 0;font-size:14px;">
                <b>Notes:</b> ${data.notes}
              </p>`
            : ""
        }

        <p style="margin:0;font-size:14px;">
          <b>Status:</b> Confirmed
        </p>

      </div>

      <p style="color:#333;font-size:14px;">
        Please arrive at least 10–15 minutes before the class starts.
      </p>

      <p style="color:#333;font-size:14px;">
        We look forward to seeing you 💪
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — XFactor Fitness Gym Trece
      </p>

    </div>
  </div>
  `;
}
