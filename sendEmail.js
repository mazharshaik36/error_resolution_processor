import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY
  }
};

function createDefaultTransport() {
  return nodemailer.createTransport(SMTP_CONFIG);
}

class EmailService {
  constructor(transporter = createDefaultTransport()) {
    this.transporter = transporter;
  }

  async sendResolution({ from = process.env.FROM_EMAIL, to = process.env.NOTIFY_EMAIL, subject = 'API Error Resolution', resolution, row } = {}) {
    if (!resolution) {
      throw new Error('resolution is required');
    }

    const rowDetails = row
      ? `<p><strong>Error details:</strong><br/>${String(
          typeof row === 'object' ? JSON.stringify(row, null, 2) : row
        ).replace(/\n/g, '<br/>')}</p>`
      : '';

    return this.transporter.sendMail({
      from,
      to,
      subject,
      html: `
        <p>Dear user,</p>
        ${rowDetails}
        <p><p><strong>Resolution:</strong><br/>${String(resolution)}</p>
        <p>Thanks,<br/>Support Team</p>
      `
    });
  }
}

export { EmailService };