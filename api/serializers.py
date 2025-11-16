from rest_framework import serializers
from .models import Product, Brand, Order
from django.contrib.auth.models import User


# -----------------------------
# Brand: simple CRUD serializer
# -----------------------------
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'


# ----------------------------------------------------
# Product serializer
# - exposes brand_name for easier frontend consumption
# ----------------------------------------------------
class ProductSerializer(serializers.ModelSerializer):
    # read-only helper field so the frontend doesn’t need to look up the brand
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


# ---------------------------------------------------------
# Order serializer
# - includes product_name as a convenience field for UI use
# ---------------------------------------------------------
class OrderSerializer(serializers.ModelSerializer):
    # makes it easier for the frontend to display the order's product label
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


# ------------------------------------------------------
# Basic user serializer (used where simple user info is
# enough and full auth details are not needed)
# ------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']