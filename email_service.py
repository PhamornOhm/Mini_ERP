import logging

logger = logging.getLogger(__name__)

def send_low_stock_email(product_name: str, current_stock: int):
    # This is a mock function that simulates sending an email
    print("\n" + "="*50)
    print("📧 [MOCK EMAIL SENT]")
    print("To: admin@minierp.com")
    print("Subject: ⚠️ แจ้งเตือนสต๊อกสินค้าใกล้หมด!")
    print(f"Body: สินค้า '{product_name}' เหลือสต๊อกเพียง {current_stock} ชิ้น กรุณาเติมสต๊อกด่วน!")
    print("="*50 + "\n")
