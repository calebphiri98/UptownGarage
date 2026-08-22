# Uptown Garage — Backend (PHP + Neon Postgres)

Plain PHP REST API (no framework, no Composer dependency required) using PDO to
talk to a Neon Postgres database.

## 1. Requirements
- PHP 8.0+ with the `pdo_pgsql` extension enabled
- A free Neon project: https://neon.tech

## 2. Set up the database
1. Create a project in Neon and open the SQL editor (or use `psql`).
2. Run the contents of `schema.sql` against your Neon database:
   ```
   psql "postgresql://<user>:<password>@<host>/<db>?sslmode=require" -f schema.sql
   ```

## 3. Configure the connection
```
cp .env.example .env
```
Fill in `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` from your Neon connection
string (Neon dashboard → Connection Details).

## 4. Run the API locally
```
php -S localhost:8000
```
Test it:
```
curl http://localhost:8000/index.php
curl http://localhost:8000/api/dashboard.php
```

## 5. Endpoints
All endpoints return JSON and accept/return `id` via `?id=` query param.

| File | Methods | Notes |
|---|---|---|
| api/auth.php?action=login | POST | customer login |
| api/customers.php | GET/POST/PUT/DELETE | POST registers a customer |
| api/vehicles.php | GET/POST/PUT/DELETE | `?customer_id=` to filter |
| api/mechanics.php | GET/POST/PUT/DELETE | |
| api/appointments.php | GET/POST/PUT/DELETE | PUT changes status (Confirmed/Cancelled/etc.) |
| api/jobs.php | GET/POST/PUT | PUT changes lifecycle status; `?action=issue-part` POST issues a part |
| api/parts.php | GET/POST/PUT/DELETE | `?action=low-stock`, `?action=stock-in`, `?action=adjust` |
| api/orders.php | GET/POST/PUT/DELETE | `?action=confirm` / `?action=reject` |
| api/invoices.php | GET/POST/PUT | POST generates from a job/order |
| api/payments.php | GET/POST | POST records a payment against an invoice |
| api/dashboard.php | GET | summary counts for the manager dashboard |

## 6. Deploy
Any standard PHP host works (shared hosting, Render, Railway, a VPS with Apache/Nginx).
Just make sure the `pdo_pgsql` extension is enabled and `.env` is present on the server
(never commit real credentials — `.env` is for local/server config only).
