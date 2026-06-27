import ErrorRepository from './dbOps.js';
import { EmailService } from './sendEmail.js';

class ErrorProcessor {
  static MAX_RETRIES = 5;

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
      let emailSent = false;
      let emailSentAt = null;

      if (!resolutionText) {
        const nextRetryCount = (row.retry_count ?? 0) + 1;
        if (nextRetryCount >= ErrorProcessor.MAX_RETRIES) {
          try {
            const emailService = new EmailService();
            const to = process.env.NOTIFY_EMAIL;
            const from = process.env.FROM_EMAIL;
            const subject = `Manual review required for error ${row.error_code}`;
            const body = `Error ${row.error_code} has reached ${nextRetryCount} retry attempts. Please investigate manually. Payload: ${JSON.stringify(row.request_payload)}`;
            const emailStatus = await emailService.sendResolution({ from, to, subject, resolution: body, row: { error_code: row.error_code, error_message: row.error_message, error_description: row.error_description } });
            emailSent = Array.isArray(emailStatus?.accepted) && emailStatus.accepted.length > 0;
            if (emailSent) emailSentAt = new Date().toISOString();
            this.logger.log('Manual review notification sent to', to);
          } catch (e) {
            this.logger.error('Failed to send manual review notification', e);
          }
        }
        await repo.incrementRetry(row.id, emailSent, emailSentAt);
        await client.query('COMMIT');
        return;
      }

      this.logger.log('Resolution received');
      const raw = typeof resolution === 'object' ? JSON.stringify(resolution) : String(resolution);

      // send email and persist status in DB; ensure DB update reflects email result
      const to = process.env.NOTIFY_EMAIL;
      const from = process.env.FROM_EMAIL;
      const subject = `Error ${row.error_code} resolution`;
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