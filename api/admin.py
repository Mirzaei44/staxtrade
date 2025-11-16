from django.contrib import admin
from .models import Brand, Product, Order

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "brand", "price", "stock", "created_at")
    list_filter = ("brand",)
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "product", "quantity", "total_price", "created_at")
    list_filter = ("product", "user")
    search_fields = ("product__name", "user__username")
    ordering = ("-created_at",)