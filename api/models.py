from django.db import models
from django.contrib.auth.models import User


# Brand table
# Nothing complicated here, just storing the brand names.
# Useful for grouping products and filtering them on the frontend.
class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# Product table
# Each product belongs to a brand and has a price + stock.
# Keeping stock directly on the product is fine for a single warehouse setup.
# If this project grows, inventory can be moved into a separate table later.
class Product(models.Model):
    name = models.CharField(max_length=100)
    brand = models.ForeignKey(
        Brand,
        on_delete=models.CASCADE,
        related_name='products'
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# Order table
# A very simple order model: one product per order.
# This keeps the API easy to work with for now.
# Can be expanded into multi line orders in the future if needed.
class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"