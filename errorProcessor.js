import ErrorRepository from './dbOps.js';
import { EmailService } from './sendEmail.js';

class ErrorProcessor {
  constructor(pool, aiClient, logger = console) {
    this.pool = pool;
    this.aiClient = aiClient;
    this.logger = logger;
  }

  async processOne() {
    const client = await this.pool.connect();
    const repo = new ErrorRepository(client);

    try {
      await client.query('BEGIN');

      const row = await repo.fetchPending();
      if (!row) {
        await client.query('COMMIT');
        this.logger.log('No pending error records found.');
        return;
      }

      this.logger.log('Fetched error record:', row);

      const prompt = `The payload passed is: ${JSON.stringify(row.request_payload)}, the error code: ${row.error_code}, message: ${row.error_message}, description: ${row.error_description}. Provide a resolution or a generic suggestion if unrecognized.`;

      const resolution = await this.aiClient(prompt);
      const resolutionText = resolution?.text ?? resolution;

      if (!resolutionText) {
        await repo.incrementRetry(row.id);
        await client.query('COMMIT');
        return;
      }

      this.logger.log('Resolution received');
      const raw = typeof resolution === 'object' ? JSON.stringify(resolution) : String(resolution);

      // send email and persist status in DB; ensure DB update reflects email result
      const to = process.env.NOTIFY_EMAIL;
      const from = process.env.FROM_EMAIL;
      const subject = `Error ${row.error_code} resolution`;
      let emailSent = false;
      let emailSentAt = null;
      try {
        const emailService = new EmailService();
        // remove unwanted fields before sending in email
        const { error_code, error_message, error_description } = row;
        const emailStatus = await emailService.sendResolution({ from, to, subject, resolution: resolutionText, row: { error_code, error_message, error_description } });
        emailSent = Array.isArray(emailStatus?.accepted) && emailStatus.accepted.length > 0;
        if (emailSent) emailSentAt = new Date().toISOString();
        this.logger.log('Notification sent to', to);
      } catch (e) {
        this.logger.error('Failed to send notification', e);
      }

      // persist resolution and email status in same transaction
      await repo.markResolved(row.id, resolutionText, raw, emailSent, emailSentAt);

      await client.query('COMMIT');
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (e) {
        this.logger.error('Rollback error', e);
      }
      this.logger.error('Error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default ErrorProcessor;