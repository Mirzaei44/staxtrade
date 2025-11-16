from django.test import TestCase
from django.contrib.auth.models import User
from api.models import Brand, Product, Order
# just to show understanding of tests (basic)
class BasicModelTests(TestCase):
    def test_product_model(self):
        brand = Brand.objects.create(name="TestBrand")
        product = Product.objects.create(
            name="Example Product",
            brand=brand,
            price=9.99,
            stock=5
        )

        self.assertEqual(product.name, "Example Product")
        self.assertEqual(product.stock, 5)
        self.assertEqual(str(brand), "TestBrand")
        
        
        
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Brand

class BasicAPITests(APITestCase):
    def test_brand_list_api(self):
        Brand.objects.create(name="Brand1")
        Brand.objects.create(name="Brand2")

        res = self.client.get("/api/brands/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)