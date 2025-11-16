from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import demand_forecast
from .views import (
    ProductViewSet,
    BrandViewSet,
    OrderViewSet,
    register_user,
    CustomLoginView,

    # dashboard + analytics
    summary,
    top_products,
    monthly_revenue,
    daily_orders,
    brand_revenue,
    low_stock,
    inventory_insights,

    # customer portal
    customer_catalog,
    customer_orders,

    # short executive-style AI summary
    ai_decision_summary,
)

# DRF router keeps all the CRUD endpoints clean and consistent
router = DefaultRouter()
router.register(r"products", ProductViewSet)
router.register(r"brands", BrandViewSet)
router.register(r"orders", OrderViewSet)


urlpatterns = [

    # --- Management / executive tools ---
    path("ai-summary/", ai_decision_summary, name="ai_decision_summary"),

    # --- Standard CRUD routes (auto-generated via router) ---
    path("", include(router.urls)),

    # --- Authentication ---
    path("register/", register_user, name="register"),
    path("login/", CustomLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # --- Main dashboard summary ---
    path("summary/", summary, name="summary"),

    # --- Dashboard analytics (used by charts) ---
    path("analytics/top-products/", top_products, name="top_products"),
    path("analytics/monthly-revenue/", monthly_revenue, name="monthly_revenue"),
    path("analytics/daily-orders/", daily_orders, name="daily_orders"),
    path("analytics/brand-revenue/", brand_revenue, name="brand_revenue"),
    path("analytics/low-stock/", low_stock, name="low_stock"),

    # --- Inventory analysis / replenishment suggestions ---
    path("inventory-insights/", inventory_insights, name="inventory_insights"),

    # --- Customer section (catalog + order history) ---
    path("customer/catalog/", customer_catalog, name="customer_catalog"),
    path("customer/orders/", customer_orders, name="customer_orders"),

    # --- Simple demand forecasting endpoint ---
    path("analytics/demand-forecast/", demand_forecast, name="demand_forecast"),
]