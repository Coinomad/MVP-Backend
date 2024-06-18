import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config();

export const  sendEmail=async(email, code)=> {
  try {
    const smtpEndpoint = "smtp.gmail.com";

    const port = 587 ;

    const service="Gmail";

    const senderAddress = "olaimarnoel@gmail.com";

    var toAddress = email;

    const smtpUsername = process.env.SMTP_USERNAME;

    const smtpPassword = process.env.SMTP_APIKEY;

    var subject = "Verify your email";

    // The body of the email for recipients
    var body_html = `<!DOCTYPE> 
    <html>
      <body>
        <p>Your authentication code is : </p> <b>${code}</b>
      </body>
    </html>`;

    // Create the SMTP transport.
    let transporter = nodemailer.createTransport({
      service,
      host: smtpEndpoint,
      port: port,
      secure: false,  // true for 465, false for other ports
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    // Specify the fields in the email.
    let mailOptions = {
      from: senderAddress,
      to: toAddress,
      subject: subject,
      html: body_html,
    };

    let info = await transporter.sendMail(mailOptions);
    return { error: false };
  } catch (error) {
    console.error("send-email-error", error);
    return {
      error: true,
      message: "Cannot send email",
    };
  }
}