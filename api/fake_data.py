import random
import datetime
from django.contrib.auth.models import User
from django.utils.timezone import make_aware
from .models import Brand, Product, Order


# Small helper that gives us a random date from the past X months.
# Makes the order history look more natural instead of everything happening today.
def random_date_within_months(months_back=12):
    today = datetime.date.today()
    start = today - datetime.timedelta(days=30 * months_back)
    rand_days = random.randint(0, (today - start).days)
    d = start + datetime.timedelta(days=rand_days)
    return make_aware(datetime.datetime(d.year, d.month, d.day))


def seed_data():
    print("\n🔥 Clearing old data so we start from a fresh slate...")
    Brand.objects.all().delete()
    Product.objects.all().delete()
    Order.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()

    # Create a few basic users so we have people placing orders.
    users = []
    for i in range(1, 6):
        users.append(User.objects.create_user(username=f"user{i}", password="123456"))
    print("👤 Created sample users")

    # Some well-known brands. Just enough variation so the dashboard looks good.
    brand_names = [
        "Stanley", "DeWalt", "Bosch", "Makita", "Black+Decker",
        "Duracell", "Philips", "Yale", "WD-40", "3M"
    ]
    brands = [Brand.objects.create(name=b) for b in brand_names]
    print("🏷 Added 10 brands")

    # Generate around 1500 products.
    # They won't all sell at the same rate — some fast, some slow, some expensive.
    # This gives the forecasting and insights pages something interesting to work with.
    products = []

    for _ in range(1500):
        brand = random.choice(brands)

        name = f"{brand.name} {random.choice(['Pro','Max','Ultra','X','Lite','Industrial','Compact'])} {random.randint(100,9999)}"

        # Give the price a bit of “product personality”
        base_price = random.uniform(5, 600)
        if "Pro" in name: base_price *= 1.2
        if "Ultra" in name: base_price *= 1.4
        if "Industrial" in name: base_price *= 1.7

        price = round(base_price, 2)

        # Give stocks some spread. Some items should be almost sold out,
        # others should look like warehouse bulk items.
        stock = random.choice([
            random.randint(0, 2),      # 10% extremely low
            random.randint(5, 40),     # 40% medium range
            random.randint(100, 500)   # 50% well-stocked
        ])

        products.append(Product(
            name=name,
            brand=brand,
            price=price,
            stock=stock
        ))

    Product.objects.bulk_create(products)
    products = list(Product.objects.all())
    print("📦 Added 1500 products")

    # Create a big set of orders so the analytics feel “alive”.
    # The idea is to mix:
    # - fast-selling items
    # - random seasonality
    # - a few low-traffic products
    print("🧾 Adding 20,000 orders...")

    orders = []

    for _ in range(20000):
        p = random.choice(products)
        u = random.choice(users)

        # Let the “Pro” and “Ultra” lines sell a bit more — feels natural.
        qty = random.randint(1, 5)
        if "Pro" in p.name or "Ultra" in p.name:
            qty += random.randint(0, 5)

        # Spread order dates nicely across the past year.
        order_date = random_date_within_months(12)

        # Some items should barely sell.
        if random.random() < 0.25:
            qty = 1

        total = round(p.price * qty, 2)

        orders.append(Order(
            user=u,
            product=p,
            quantity=qty,
            total_price=total,
            created_at=order_date
        ))

    Order.objects.bulk_create(orders)
    print("🧾 20,000 orders created with realistic variation")

    print("\n🎉 Seeding complete — database now has natural, messy, human-looking data!\n")