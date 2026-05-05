class CustomerNotFoundError(Exception):
    def __init__(self, customer_id: int):
        super().__init__(f"Customer with id={customer_id} does not exist.")
        self.customer_id = customer_id


class ProductNotFoundError(Exception):
    def __init__(self, product_id: int):
        super().__init__(f"Product with id={product_id} does not exist.")
        self.product_id = product_id


class InsufficientStockError(Exception):
    def __init__(self, product_id: int, requested: int, available: int):
        super().__init__(
            f"Insufficient stock for product_id={product_id}: "
            f"requested={requested}, available={available}."
        )
        self.product_id = product_id
        self.requested  = requested
        self.available  = available