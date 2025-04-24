import nodemailer from "nodemailer";
import { config } from "../config";

// ✅ Tek seferlik transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.GMAIL_USER,
    pass: config.GMAIL_PASS,
  },
});

// ✅ Tip güvenli mail gönderme fonksiyonu
export const sendEmail = async (
  subject: string,
  text: string
): Promise<void> => {
  const mailOptions = {
    from: config.GMAIL_USER,
    to: config.GMAIL_TO,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Mail gönderildi:", info.response);
  } catch (error) {
    console.error("❌ Mail gönderilemedi:", error);
  }
};
