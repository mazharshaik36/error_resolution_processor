# Error Resolution Processor

This project connects to a PostgreSQL database, retrieves one record at a time from the `api_error_resolution_queue`, uses an AI model to find a resolution for the error, sends that resolution to the user by email, and updates the same database record with the resolution, email status, and timestamp.

## Features

- Connects to PostgreSQL
- Fetches a single queued record from `api_error_resolution_queue`
- Uses AI to generate a resolution for `error_code`, `error`, and `error_description`
- Sends the resolution to the user via email
- Updates the record with the resolution and email sent status

## Setup

1. Install dependencies.
2. Configure PostgreSQL connection settings.
3. Configure email service credentials.
4. Configure AI model API credentials.

## Workflow

1. Query `api_error_resolution_queue` for the next pending record.
2. Extract the error details from the record:
   - `error_code`
   - `error`
   - `error_description`
3. Call the AI model to generate a resolution.
4. Send the resolution to the user by email.
5. Update the fetched database record with:
   - generated resolution text
   - email send status

## Database

The primary table used is `api_error_resolution_queue`. Each record should store the error details and fields for:

- error code
- error message
- error description
- resolution text
- email status
- processed timestamp

## Database initialization (db.sql)

This project includes a db.sql file that creates the required table, indexes and inserts sample error records to kick-start the processor.

Typical contents of db.sql:

- CREATE TABLE api_error_resolution_queue (...columns for error_code, error, error_description, resolution, email_status, processed_at...);
- Indexes for efficient querying (e.g. on email_status or processed_at)
- INSERT statements adding sample error records to the table

How to apply the SQL file:

- Using psql: psql -h <host> -U <user> -d <database> -f db.sql
- Or from a GUI database tool: open and run the db.sql script against the target database

Ensure you review and update any placeholder values (schemas, column types, or sample data) in db.sql before running it in production.

## Notes

- Ensure the PostgreSQL connection is secure and credentials are stored safely.
- Ensure email service credentials are valid and tested.
- Ensure the AI model API is configured and accessible.
