| table_name          | column_name              | data_type                | is_nullable | column_default                   |
| ------------------- | ------------------------ | ------------------------ | ----------- | -------------------------------- |
| customers           | id                       | bigint                   | NO          | null                             |
| customers           | id                       | bigint                   | NO          | null                             |
| customers           | customer_id              | text                     | YES         | null                             |
| customers           | customer_id              | text                     | YES         | null                             |
| customers           | username                 | text                     | YES         | null                             |
| customers           | username                 | text                     | YES         | null                             |
| customers           | email                    | text                     | YES         | null                             |
| customers           | email                    | text                     | YES         | null                             |
| customers           | whatsapp                 | text                     | YES         | null                             |
| customers           | whatsapp                 | text                     | YES         | null                             |
| customers           | alamat                   | text                     | YES         | null                             |
| customers           | alamat                   | text                     | YES         | null                             |
| customers           | created_at               | timestamp with time zone | YES         | now()                            |
| customers           | created_at               | timestamp with time zone | YES         | now()                            |
| orders              | id                       | bigint                   | NO          | null                             |
| orders              | id                       | bigint                   | NO          | null                             |
| orders              | invoice_id               | text                     | YES         | null                             |
| orders              | invoice_id               | text                     | YES         | null                             |
| orders              | customer_id              | text                     | YES         | null                             |
| orders              | customer_id              | text                     | YES         | null                             |
| orders              | subtotal                 | integer                  | YES         | null                             |
| orders              | total_price              | integer                  | YES         | null                             |
| orders              | subtotal                 | integer                  | YES         | null                             |
| orders              | payment                  | text                     | YES         | null                             |
| orders              | created_at               | timestamp with time zone | YES         | (now() AT TIME ZONE 'utc'::text) |
| orders              | payment                  | text                     | YES         | null                             |
| orders              | status                   | text                     | YES         | null                             |
| orders              | created_at               | timestamp with time zone | YES         | (now() AT TIME ZONE 'utc'::text) |
| orders              | referral_code            | character varying        | YES         | null                             |
| orders              | status                   | text                     | YES         | null                             |
| orders              | referral_discount_amount | numeric                  | YES         | 0                                |
| orders              | points_awarded           | integer                  | YES         | 0                                |
| orders              | referral_code            | character varying        | YES         | null                             |
| orders              | points_used              | integer                  | YES         | 0                                |
| orders              | referral_discount_amount | numeric                  | YES         | 0                                |
| orders              | points_awarded           | integer                  | YES         | 0                                |
| orders              | points_discount_amount   | integer                  | YES         | 0                                |
| orders              | points_used              | integer                  | YES         | 0                                |
| orders              | total_amount             | integer                  | YES         | null                             |
| points_transactions | id                       | bigint                   | NO          | null                             |
| points_transactions | id                       | bigint                   | NO          | null                             |
| points_transactions | customer_id              | text                     | NO          | null                             |
| points_transactions | customer_id              | text                     | NO          | null                             |
| points_transactions | transaction_type         | text                     | NO          | null                             |
| points_transactions | transaction_type         | text                     | NO          | null                             |
| points_transactions | points_change            | integer                  | NO          | null                             |
| points_transactions | points_change            | integer                  | NO          | null                             |
| points_transactions | balance_after            | integer                  | NO          | null                             |
| points_transactions | balance_after            | integer                  | NO          | null                             |
| points_transactions | reference_type           | text                     | NO          | null                             |
| points_transactions | reference_type           | text                     | NO          | null                             |
| points_transactions | reference_id             | text                     | YES         | null                             |
| points_transactions | reference_id             | text                     | YES         | null                             |
| points_transactions | description              | text                     | YES         | null                             |
| points_transactions | description              | text                     | YES         | null                             |
| points_transactions | created_at               | timestamp with time zone | YES         | now()                            |
| points_transactions | created_at               | timestamp with time zone | YES         | now()                            |
| referral_usage      | id                       | bigint                   | NO          | null                             |
| referral_usage      | id                       | bigint                   | NO          | null                             |
| referral_usage      | referral_code            | text                     | NO          | null                             |
| referral_usage      | referral_code            | text                     | NO          | null                             |
| referral_usage      | referrer_customer_id     | text                     | NO          | null                             |
| referral_usage      | referrer_customer_id     | text                     | NO          | null                             |
| referral_usage      | referred_customer_id     | text                     | NO          | null                             |
| referral_usage      | referred_customer_id     | text                     | NO          | null                             |
| referral_usage      | order_invoice_id         | text                     | NO          | null                             |
| referral_usage      | order_invoice_id         | text                     | NO          | null                             |
| referral_usage      | discount_applied         | integer                  | NO          | null                             |
| referral_usage      | discount_applied         | integer                  | NO          | null                             |
| referral_usage      | points_awarded           | integer                  | NO          | null                             |
| referral_usage      | points_awarded           | integer                  | NO          | null                             |
| referral_usage      | used_at                  | timestamp with time zone | YES         | now()                            |
| referral_usage      | used_at                  | timestamp with time zone | YES         | now()                            |
