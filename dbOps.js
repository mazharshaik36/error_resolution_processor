


class ErrorRepository {
  constructor(client) {
    this.client = client;
  }

  async fetchPending() {
    const res = await this.client.query(
      `SELECT id, error_code, error_message, error_description, request_payload, retry_count, max_retries
       FROM api_error_resolution_queue
       WHERE status = 'PENDING' AND retry_count < max_retries
       ORDER BY created_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );
    return res.rows && res.rows.length ? res.rows[0] : null;
  }

  async markResolved(id, resolutionText, rawResponse, emailSent = false, emailSentAt = null) {
    await this.client.query(
      `UPDATE api_error_resolution_queue
       SET resolution = $1, status = 'RESOLUTION_PROVIDED', retry_count = retry_count + 1,
           llm_provider = 'gemini-2.5-flash', llm_response = $2, email_sent = $4,
           email_sent_at = $5, resolved_at = NOW()
       WHERE id = $3`,
      [resolutionText, rawResponse, id, emailSent, emailSentAt]
    );
  }

  async incrementRetry(id) {
    await this.client.query(
      `UPDATE api_error_resolution_queue
       SET retry_count = retry_count + 1
       WHERE id = $1`,
      [id]
    );
  }
}

export default ErrorRepository;