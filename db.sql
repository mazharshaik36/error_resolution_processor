CREATE TABLE IF NOT EXISTS api_error_resolution_queue (id BIGSERIAL PRIMARY KEY, service_name VARCHAR(100), api_name VARCHAR(200), request_id VARCHAR(255), error_code VARCHAR(100), error_message TEXT NOT NULL, error_description TEXT, stack_trace TEXT, request_payload JSONB, response_payload JSONB, metadata JSONB, status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RESOLUTION_IN_PROGRESS','RESOLUTION_PROVIDED','EMAIL_SENT','CLOSED')), resolution TEXT, llm_provider VARCHAR(50), llm_response JSONB, retry_count INT NOT NULL DEFAULT 0, max_retries INT NOT NULL DEFAULT 5, email_sent BOOLEAN NOT NULL DEFAULT FALSE, email_sent_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP, picked_by VARCHAR(100), picked_at TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_api_error_status ON api_error_resolution_queue(status);

CREATE INDEX IF NOT EXISTS idx_api_error_created_at ON api_error_resolution_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_api_error_code ON api_error_resolution_queue(error_code);

CREATE INDEX IF NOT EXISTS idx_api_error_pending ON api_error_resolution_queue(status, retry_count);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('OrderService', 'CreateOrder', 'REQ-123456', 'DB_CONN_TIMEOUT', 'Connection timeout while connecting to PostgreSQL', 'Database connection pool exhausted', '{"customerId":"123","orderId":"456"}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('PaymentService', 'ProcessPayment', 'REQ-1002', 'PAYMENT_GATEWAY_ERROR', 'Failed to connect to payment gateway', 'Third-party payment provider unavailable', '{"orderId":"O789","amount":499.99}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('InventoryService', 'ReserveStock', 'REQ-1003', 'INSUFFICIENT_STOCK', 'Unable to reserve inventory', 'Requested quantity exceeds available stock', '{"productId":"P123","quantity":50}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('UserService', 'CreateUser', 'REQ-1004', 'DUPLICATE_EMAIL', 'User already exists', 'Email address is already registered', '{"email":"john.doe@example.com"}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('NotificationService', 'SendEmail', 'REQ-1005', 'SMTP_AUTH_FAILED', 'SMTP authentication failed', 'Invalid SMTP credentials configured', '{"recipient":"user@example.com","template":"WELCOME"}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('AuthService', 'ValidateToken', 'REQ-1006', 'JWT_EXPIRED', 'JWT token has expired', 'User session expired and requires re-authentication', '{"userId":"U123"}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('ShippingService', 'GenerateLabel', 'REQ-1007', 'EXTERNAL_API_TIMEOUT', 'Shipping provider API timed out', 'No response received within configured timeout period', '{"shipmentId":"S12345"}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, stack_trace, request_payload) VALUES ('CatalogService', 'GetProduct', 'REQ-1008', 'NULL_POINTER_EXCEPTION', 'Cannot read properties of null', 'Product details object was null', 'TypeError: Cannot read properties of null at ProductController.getProduct()', '{"productId":"P999"}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload, metadata) VALUES ('KafkaConsumer', 'ConsumeOrderEvents', 'REQ-1009', 'KAFKA_DESERIALIZATION_ERROR', 'Failed to deserialize message', 'Unexpected message format received from topic', '{"topic":"order-events"}'::jsonb, '{"partition":2,"offset":12345}'::jsonb);

INSERT INTO api_error_resolution_queue (service_name, api_name, request_id, error_code, error_message, error_description, request_payload) VALUES ('ReportingService', 'GenerateMonthlyReport', 'REQ-1010', 'OUT_OF_MEMORY', 'Java heap space', 'Application ran out of memory while processing report', '{"reportType":"MONTHLY_SALES","month":"2026-05"}'::jsonb);