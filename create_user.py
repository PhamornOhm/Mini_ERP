import asyncio
from database import AsyncSessionLocal
from models import User
from auth_utils import get_password_hash
from sqlalchemy import select

async def main():
    print("=== สร้างบัญชีผู้ดูแลระบบ / พนักงาน ===")
    username = input("ใส่ Username ที่ต้องการ: ").strip()
    password = input("ใส่ Password ที่ต้องการ: ").strip()
    role = input("ใส่ Role (Admin, Sales, Warehouse, Accounting) [ค่าเริ่มต้น Admin]: ").strip() or "Admin"

    if not username or not password:
        print("❌ กรุณากรอกข้อมูลให้ครบถ้วน")
        return

    async with AsyncSessionLocal() as db:
        async with db.begin():
            # เช็คว่ามีซ้ำไหม
            result = await db.execute(select(User).where(User.username == username))
            if result.scalar_one_or_none():
                print(f"❌ มีชื่อผู้ใช้ '{username}' ในระบบแล้ว!")
                return

            # สร้าง User ใหม่
            new_user = User(
                username=username,
                hashed_password=get_password_hash(password),
                role=role
            )
            db.add(new_user)
            print(f"✅ สำเร็จ! สร้างบัญชี '{username}' (Role: {role}) เรียบร้อยแล้ว")

if __name__ == "__main__":
    asyncio.run(main())
