export function memberRegisteredEmail(member) {
    return `
    <div style="font-family:Arial;padding:20px">
      <h2>Welcome to X-Factor Fitness 💪</h2>

      <p>Hello <b>${member.first_name}</b>,</p>

      <p>Your account has been successfully created.</p>

      <p>
        Status: <b>Pending approval</b><br/>
        We will notify you once a trainer approves your membership.
      </p>

      <br/>
      <p>Thank you for choosing X-Factor Fitness.</p>
    </div>
    `;
}