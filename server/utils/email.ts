// server/utils/email.ts
import nodemailer from 'nodemailer';

// Configuración básica usando Gmail SMTP (placeholder). Reemplaza los valores con credenciales reales.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'xxxxxx', // TODO: reemplazar con el email del remitente
    pass: 'xxxxxx', // TODO: reemplazar con la contraseña o app password
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: 'xxxxxx',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
