import nodemailer from 'nodemailer';
import { config } from '../config/env';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `SportReserve UPTC <${config.email.user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  firstName: string
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a73e8; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">SportReserve UPTC</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2>Restablecer Contraseña</h2>
        <p>Hola <strong>${firstName}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el botón a continuación para crear una nueva contraseña. Este enlace expirará en <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #1a73e8; color: white; padding: 14px 28px; border-radius: 6px;
                    text-decoration: none; font-size: 16px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
        <p>Si no solicitaste esto, ignora este correo. Tu contraseña permanecerá sin cambios.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">
          Si el botón no funciona, copia este enlace en tu navegador:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'SportReserve UPTC - Restablecer Contraseña',
    html,
    text: `Restablece tu contraseña visitando: ${resetUrl}`,
  });
};

export const sendReservationConfirmationEmail = async (
  email: string,
  firstName: string,
  details: {
    fieldName: string;
    date: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
  }
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a73e8; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">SportReserve UPTC</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2>Reserva Confirmada</h2>
        <p>Hola <strong>${firstName}</strong>,</p>
        <p>Tu reserva ha sido confirmada exitosamente.</p>
        <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #1a73e8; margin: 20px 0;">
          <p><strong>Campo:</strong> ${details.fieldName}</p>
          <p><strong>Fecha:</strong> ${details.date}</p>
          <p><strong>Horario:</strong> ${details.startTime} - ${details.endTime}</p>
          <p><strong>Total:</strong> $${details.totalPrice.toLocaleString()} COP</p>
        </div>
        <p>¡Que disfrutes tu deporte!</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'SportReserve UPTC - Reserva Confirmada',
    html,
  });
};
