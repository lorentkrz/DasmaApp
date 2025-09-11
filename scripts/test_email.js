import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  const email = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: "dasmaerp@gmail.com",
    subject: "Test Email from Dasma ERP",
    html: "<h1>It works! ✅</h1><p>This is a test email from Resend.</p>",
  });

  console.log("Email sent:", email);
}

main().catch(console.error);
