/**
 * Lightweight transactional email helper (Resend API)
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'otwbayar <notifications@otwbayar.app>',
        to,
        subject,
        html,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false, error: err };
  }
}
