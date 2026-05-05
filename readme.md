# 🏭 Mini ERP — FastAPI + PostgreSQL

A production-ready order management backend built with **FastAPI**, **SQLAlchemy (async)**, and **PostgreSQL**.

---

## Project Structure

```
mini_erp/
├── main.py                   # FastAPI app factory & startup
├── database.py               # Async engine, session, Base
├── models.py                 # SQLAlchemy ORM models
├── schemas.py                # Pydantic request/response schemas
├── exceptions.py             # Domain-specific exceptions
├── seed.py                   # Sample data loader
│
├── repositories/             # Data Access Layer
│   ├── customer_repo.py
│   ├── product_repo.py
│   ├── stock_repo.py         # SELECT FOR UPDATE (row locking)
│   ├── order_repo.py
│   └── invoice_repo.py
│
├── services/                 # Business Logic Layer
│   └── order_service.py      # Full order flow + transaction
│
└── routers/                  # HTTP Layer
    └── orders.py             # POST /orders
```

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+

### 2. Setup

```bash
# Clone & navigate
cd mini_erp

# Create virtualenv
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env → set your DATABASE_URL
```

### 3. Create the database

```sql
CREATE DATABASE mini_erp;
```

### 4. Run seed data

```bash
python seed.py
```

### 5. Start the server

```bash
uvicorn main:app --reload --port 8000
```

Interactive docs → http://localhost:8000/docs

---

## API Reference

### `POST /orders`

Creates an order atomically (validates customer, checks/deducts stock, creates order + items + invoice).

**Request**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "qty": 2 },
    { "product_id": 2, "qty": 1 }
  ]
}
```

**Response `201`**
```json
{
  "order_id": 1,
  "invoice_id": 1,
  "total_amount": 2749.48,
  "order_status": "CONFIRMED"
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| `404`  | Customer or product not found |
| `409`  | Insufficient stock |
| `422`  | Invalid request payload (Pydantic) |
| `500`  | Unexpected server error |

---

## Architecture

```
HTTP Request
    │
    ▼
Router (routers/orders.py)
    │  maps HTTP errors ↔ domain exceptions
    ▼
OrderService (services/order_service.py)
    │  orchestrates the full transaction:
    │  validate → lock stock → deduct → create order → invoice → commit
    ▼
Repositories (repositories/*.py)
    │  thin wrappers around SQLAlchemy queries
    ▼
PostgreSQL
```

### Transaction & Concurrency Safety

- The entire order flow runs inside **one** `async with db.begin()` block.
- Stock rows are locked with **`SELECT FOR UPDATE`** — two simultaneous orders for the same product will queue on the DB level, preventing over-selling.
- Any exception (domain or DB) triggers an automatic **rollback**.

---

## Database Schema

```
Customer ──< Order ──< OrderItem >── Product
                │                       │
             Invoice                  Stock
```

---

## Running Tests (optional)

```bash
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```