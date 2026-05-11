import nodemailer from "nodemailer";

/**
 * Configure SMTP Transporter
 * For production, use service like Resend, SendGrid, or Gmail App Password.
 * For development, you can use Mailtrap or ethereal.email.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * sendVerificationEmail
 * @param {string} to - Recipient email
 * @param {string} code - OTP code
 */
export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: `"Maison Atelier" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Verify your email - Maison Atelier",
    text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Thank you for signing up at Maison Atelier. Use the code below to verify your account:</p>
        <div style="font-size: 24px; font-weight: bold; padding: 20px; background: #f4f4f4; text-align: center; letter-spacing: 5px;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">If you did not sign up for this account, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`▸ Email sent to ${to}`);
  } catch (error) {
    console.error("▸ SMTP Error:", error.message);
    throw new Error("Failed to send verification email");
  }
};
