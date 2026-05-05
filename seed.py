"""
Seed script — creates sample data so you can test the API immediately.
Run:  python seed.py
"""

import asyncio

from database import AsyncSessionLocal, Base, engine
from models import Customer, Product, Stock, User
from auth_utils import get_password_hash
from sqlalchemy import text

async def seed() -> None:
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            # Check users
            result = await db.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            if count == 0:
                print("Seeding admin user...")
                admin = User(
                    username="admin",
                    hashed_password=get_password_hash("password")
                )
                db.add(admin)

            # Customers
            customers = [
                Customer(id=1, name="Alice Wonderland"),
                Customer(id=2, name="Bob The Builder"),
            ]
            db.add_all(customers)

            # Products
            products = [
                Product(id=1, name="Laptop Pro 16",  price=1299.99),
                Product(id=2, name="Mechanical Keyboard", price=149.50),
                Product(id=3, name="4K USB-C Monitor",    price=599.00),
            ]
            db.add_all(products)

            # Stock
            stocks = [
                Stock(product_id=1, quantity=10),
                Stock(product_id=2, quantity=50),
                Stock(product_id=3, quantity=5),
            ]
            db.add_all(stocks)

    print("✅  Seed data inserted successfully.")


if __name__ == "__main__":
    asyncio.run(seed())