# ======================
# IMPORTS (trying to keep things tidy)
# ======================

from datetime import timedelta
from django.utils.timezone import now
from django.contrib.auth.models import User
from django.db.models import Count, Sum, F
from django.db.models.functions import TruncMonth, TruncDay

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Product, Brand, Order
from .serializers import ProductSerializer, BrandSerializer, OrderSerializer


# ======================
# BRAND VIEWSET
# ======================
class BrandViewSet(viewsets.ModelViewSet):
    # Keep brands sorted newest-first
    queryset = Brand.objects.all().order_by("-id")
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # Simple search/filter support (helps frontend UX)
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name"]


# ======================
# PRODUCT VIEWSET
# ======================
class ProductViewSet(viewsets.ModelViewSet):
    # Showing newest products first
    queryset = Product.objects.all().order_by("-id")
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # Allow frontend to search, sort, and filter the catalog
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["brand"]
    search_fields = ["name", "brand__name"]
    ordering_fields = ["name", "price", "stock"]

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def adjust_stock(self, request, pk=None):
        # Quick endpoint admins can hit to bump stock up/down
        product = self.get_object()
        amount = request.data.get("amount")

        try:
            amount = int(amount)
        except (TypeError, ValueError):
            return Response({"error": "Amount must be integer"}, status=400)

        # Never let stock drop below zero
        product.stock = max(0, product.stock + amount)
        product.save()
        return Response({"stock": product.stock})


# ======================
# ORDER VIEWSET
# ======================
class OrderViewSet(viewsets.ModelViewSet):
    # Newest orders on top (makes sense for admin)
    queryset = Order.objects.all().order_by("-id")
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


# ======================
# REGISTER NEW USER
# ======================
@api_view(["POST"])
def register_user(request):
    # Bare-bones registration; enough for test/demo flows
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "User already exists"}, status=400)

    User.objects.create_user(username=username, password=password)
    return Response({"message": "User created successfully"}, status=201)


# ======================
# LOGIN (wrapped to give cleaner error messages)
# ======================
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomLoginView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Just overriding error handling to avoid ugly JWT exceptions
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({"detail": "Invalid username or password"}, status=401)
        return Response(serializer.validated_data, status=200)


# ======================
# BASIC DASHBOARD SUMMARY
# ======================
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def summary(request):
    # A quick stats snapshot the frontend uses for dashboard cards
    products_count = Product.objects.count()
    brands_count = Brand.objects.count()
    orders_count = Order.objects.count()

    # Count how many products each brand has
    by_brand_qs = (
        Product.objects.values("brand__name")
        .annotate(count=Count("id"))
        .order_by("brand__name")
    )

    by_brand = [
        {"name": r["brand__name"] or "Unknown", "count": r["count"]}
        for r in by_brand_qs
    ]

    return Response({
        "products": products_count,
        "brands": brands_count,
        "orders": orders_count,
        "by_brand": by_brand,
    })


# ======================
# INVENTORY INSIGHTS (basic analytics for stock decisions)
# ======================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_insights(request):
    # Little helper to keep parsing cleaner
    def _int(name, default):
        try:
            v = int(request.query_params.get(name, default))
            return max(1, v)
        except:
            return default

    # User can play with these from UI
    window_days = _int("window", 30)
    horizon_days = _int("horizon", 30)
    limit = _int("limit", 50)

    since = now() - timedelta(days=window_days)

    # Pull sales per SKU over the selected window
    orders_qs = (
        Order.objects.filter(created_at__gte=since)
        .values(
            "product_id", "product__name", "product__brand__name",
            "product__stock", "product__price"
        )
        .annotate(total_qty=Sum("quantity"), revenue=Sum("total_price"))
    )

    items = []
    total_daily_units = 0

    # Crunch numbers for each SKU
    for row in orders_qs:
        stock = row["product__stock"] or 0
        total_qty = row["total_qty"] or 0
        price = float(row["product__price"])
        revenue = float(row["revenue"] or 0)

        daily_rate = total_qty / window_days
        total_daily_units += daily_rate

        if daily_rate > 0:
            days_to_oos = stock / daily_rate if stock > 0 else 0
            recommended = max(0, round(horizon_days * daily_rate - stock))
        else:
            days_to_oos = None
            recommended = 0

        items.append({
            "product_id": row["product_id"],
            "name": row["product__name"],
            "brand": row["product__brand__name"],
            "stock": stock,
            "price": price,
            "daily_rate": round(daily_rate, 2),
            "days_to_oos": round(days_to_oos, 1) if days_to_oos else None,
            "recommended_restock": recommended,
        })

    # Sort by "who will run out first"
    items_sorted = sorted(items, key=lambda x: (x["days_to_oos"] is None, x["days_to_oos"] or 99999))

    return Response({
        "window_days": window_days,
        "horizon_days": horizon_days,
        "summary": {
            "total_skus": Product.objects.count(),
            "tracked_skus": len(items),
        },
        "items": items_sorted[:limit],
    })


# ======================
# ANALYTICS ENDPOINTS (small helpers for dashboard charts)
# ======================
@api_view(["GET"])
def top_products(request):
    # Top sellers by quantity
    data = (
        Order.objects.values("product__name")
        .annotate(total=Sum("quantity"))
        .order_by("-total")[:50]
    )
    return Response(data)


@api_view(["GET"])
def monthly_revenue(request):
    # Revenue grouped by month
    data = (
        Order.objects.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(revenue=Sum("total_price"))
        .order_by("month")
    )
    return Response(data)


@api_view(["GET"])
def daily_orders(request):
    # Orders counted per day (for charts)
    data = (
        Order.objects.annotate(day=TruncDay("created_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    return Response(data)


@api_view(["GET"])
def brand_revenue(request):
    # Simple brand revenue leaderboard
    data = (
        Order.objects.values(name=F("product__brand__name"))
        .annotate(revenue=Sum("total_price"))
        .order_by("-revenue")
    )
    return Response(data)


@api_view(["GET"])
def low_stock(request):
    # Everything nearly sold out (<=5)
    low = Product.objects.filter(stock__lte=5).select_related("brand")
    data = [
        {
            "id": p.id,
            "name": p.name,
            "brand": p.brand.name if p.brand else "Unknown",
            "stock": p.stock,
        }
        for p in low
    ]
    return Response(data)


# ======================
# CUSTOMER CATALOG (with small loyalty discount)
# ======================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_catalog(request):
    user = request.user

    # Basic loyalty system: older customers get small discount
    age_days = (now() - user.date_joined).days
    if age_days > 90:
        discount = 0.10
    elif age_days > 30:
        discount = 0.05
    else:
        discount = 0.0

    products = Product.objects.select_related("brand").order_by("name")

    data = []
    for p in products:
        base = float(p.price)
        final = round(base * (1 - discount), 2)
        data.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand.name if p.brand else "Unknown",
            "price": base,
            "effective_price": final,
            "discount_percent": int(discount * 100),
            "stock": p.stock
        })

    return Response({"results": data})


# ======================
# CUSTOMER ORDERS (view + create)
# ======================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def customer_orders(request):

    user = request.user

    if request.method == "GET":
        # Returning user's order history
        orders = (
            Order.objects.filter(user=user)
            .select_related("product", "product__brand")
            .order_by("-created_at")
        )
        data = [{
            "id": o.id,
            "product": o.product.name,
            "brand": o.product.brand.name if o.product.brand else "Unknown",
            "quantity": o.quantity,
            "total_price": float(o.total_price),
            "created_at": o.created_at
        } for o in orders]

        return Response(data)

    # POST → user creates one (or multiple) new orders
    lines = request.data.get("lines", [])
    if not isinstance(lines, list) or not lines:
        return Response({"error": "Provide 'lines': [ {product_id, quantity} ]"}, status=400)

    created_ids = []

    for item in lines:
        try:
            pid = int(item.get("product_id"))
            qty = int(item.get("quantity"))
        except:
            continue

        if qty <= 0:
            continue

        try:
            product = Product.objects.get(id=pid)
        except Product.DoesNotExist:
            continue

        total = product.price * qty

        order = Order.objects.create(
            user=user,
            product=product,
            quantity=qty,
            total_price=total
        )
        created_ids.append(order.id)

        # Reduce stock after purchase
        product.stock = max(0, product.stock - qty)
        product.save()

    return Response({"created_order_ids": created_ids}, status=201)


# ======================
# DEMAND FORECAST (lightweight + heuristic)
# ======================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def demand_forecast(request):
    """
    Basic demand forecast using:
    - total sales in the last N days
    - recent vs previous week trend
    - simple projected demand for the next horizon
    """

    # Quick helper for reading int params safely
    def _int_param(name, default):
        try:
            v = int(request.query_params.get(name, default))
            return max(1, v)
        except (TypeError, ValueError):
            return default

    window_days = _int_param("window", 30)
    horizon_days = _int_param("horizon", 30)

    now_ts = now()
    window_since = now_ts - timedelta(days=window_days)
    recent_since = now_ts - timedelta(days=7)
    prev_since = now_ts - timedelta(days=14)

    base_qs = Order.objects.filter(created_at__gte=window_since)

    # If there's no recent order data, just return an empty forecast
    if not base_qs.exists():
        return Response({
            "window_days": window_days,
            "horizon_days": horizon_days,
            "generated_at": now_ts,
            "summary": {
                "total_skus": Product.objects.count(),
                "tracked_skus": 0,
                "avg_daily_units": 0.0,
                "high_risk": 0,
                "medium_risk": 0,
            },
            "items": [],
        })

    # 1) total units sold during window
    agg_window = (
        base_qs
        .values(
            "product_id",
            "product__name",
            "product__brand__name",
            "product__stock",
        )
        .annotate(total_qty=Sum("quantity"))
    )

    # 2) last 7 days sales
    agg_recent = (
        Order.objects.filter(created_at__gte=recent_since)
        .values("product_id")
        .annotate(qty7=Sum("quantity"))
    )
    recent_map = {row["product_id"]: row["qty7"] or 0 for row in agg_recent}

    # 3) 7 days prior to that (day 8–14)
    agg_prev = (
        Order.objects
        .filter(created_at__gte=prev_since, created_at__lt=recent_since)
        .values("product_id")
        .annotate(qty7=Sum("quantity"))
    )
    prev_map = {row["product_id"]: row["qty7"] or 0 for row in agg_prev}

    items = []
    total_daily_units = 0.0
    high_risk = 0
    medium_risk = 0

    # Loop all SKUs and produce their forecast
    for row in agg_window:
        pid = row["product_id"]
        name = row["product__name"]
        brand = row["product__brand__name"] or "Unknown"
        stock = row["product__stock"] or 0
        total_qty = row["total_qty"] or 0

        daily_rate = total_qty / float(window_days) if window_days else 0.0
        total_daily_units += daily_rate

        # Compare recent week vs previous week
        recent = float(recent_map.get(pid, 0))
        prev = float(prev_map.get(pid, 0))

        if prev > 0:
            raw_trend = (recent - prev) / prev
        elif recent > 0:
            raw_trend = 0.5  # picking up new demand
        else:
            raw_trend = 0.0

        # Keep trend from getting too crazy
        trend = max(-0.8, min(raw_trend, 1.5))

        # Simple future estimate
        forecast_qty = max(
            0,
            int(round(daily_rate * horizon_days * (1 + 0.5 * trend)))
        )

        # Days until stock-out (if relevant)
        if daily_rate > 0:
            days_to_oos = stock / daily_rate if stock > 0 else 0
        else:
            days_to_oos = None

        # classify into risk buckets
        if days_to_oos is None:
            risk = "none"
        elif days_to_oos <= 7:
            risk = "high"
            high_risk += 1
        elif days_to_oos <= 30:
            risk = "medium"
            medium_risk += 1
        else:
            risk = "low"

        items.append({
            "product_id": pid,
            "name": name,
            "brand": brand,
            "stock": stock,
            "daily_rate": round(daily_rate, 2),
            "trend": round(trend, 2),
            "forecast_qty": forecast_qty,
            "days_to_oos": round(days_to_oos, 1) if days_to_oos is not None else None,
            "risk": risk,
        })

    # Sort by urgency
    items_sorted = sorted(
        items,
        key=lambda x: (
            x["days_to_oos"] is None,
            x["days_to_oos"] if x["days_to_oos"] is not None else 999999
        ),
    )

    data = {
        "window_days": window_days,
        "horizon_days": horizon_days,
        "generated_at": now_ts,
        "summary": {
            "total_skus": Product.objects.count(),
            "tracked_skus": len(items),
            "avg_daily_units": round(total_daily_units, 1),
            "high_risk": high_risk,
            "medium_risk": medium_risk,
        },
        "items": items_sorted,
    }

    return Response(data)


# ======================
# AI DECISION SUMMARY (manager-level overview)
# ======================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def ai_decision_summary(request):
    """
    Short summary aimed at managers — something readable,
    not a wall of raw numbers.
    """

    # Fixed window for now; easy to expose later if needed
    window_days = 30
    horizon_days = 30
    since = now() - timedelta(days=window_days)

    # Basic counts
    products_count = Product.objects.count()
    brands_count = Product.objects.values("brand_id").distinct().count()
    orders_count = Order.objects.filter(created_at__gte=since).count()

    # Pull window sales
    orders_qs = (
        Order.objects.filter(created_at__gte=since)
        .values(
            "product_id",
            "product__name",
            "product__brand__name",
            "product__stock",
        )
        .annotate(
            total_qty=Sum("quantity"),
            revenue=Sum("total_price"),
        )
    )

    at_risk_7 = 0
    at_risk_30 = 0
    total_recommended = 0
    pressure_brands = set()

    # Loop SKUs and build high-level insights
    for row in orders_qs:
        stock = row["product__stock"] or 0
        total_qty = row["total_qty"] or 0

        if window_days == 0:
            continue

        daily_rate = total_qty / float(window_days)
        if daily_rate <= 0:
            continue

        days_to_oos = stock / daily_rate if stock > 0 else 0
        recommended = max(0, int(round(horizon_days * daily_rate - stock)))

        if days_to_oos <= 7:
            at_risk_7 += 1
        if days_to_oos <= 30:
            at_risk_30 += 1

        if recommended > 0:
            total_recommended += recommended
            brand_name = row["product__brand__name"] or "Unknown"
            pressure_brands.add(brand_name)

    # Turn the info into short bullet points
    bullets = []

    bullets.append(
        f"{products_count} products active across {brands_count} brands – "
        f"{orders_count} orders placed in the last {window_days} days."
    )

    if at_risk_7 > 0:
        bullets.append(
            f"{at_risk_7} SKUs may run out within a week "
            f"({at_risk_30} within 30 days)."
        )
    else:
        bullets.append(
            "No SKUs expected to run out within the next 7 days."
        )

    if total_recommended > 0:
        bullets.append(
            f"Suggested replenishment for the next {horizon_days} days: "
            f"around {total_recommended} total units."
        )

    if pressure_brands:
        top_brands = ", ".join(sorted(pressure_brands)[:3])
        bullets.append(
            f"Supply may tighten for: {top_brands}."
        )

    return Response(
        {
            "window_days": window_days,
            "horizon_days": horizon_days,
            "bullets": bullets,
            "meta": {
                "products": products_count,
                "brands": brands_count,
                "orders_last_window": orders_count,
                "at_risk_7": at_risk_7,
                "at_risk_30": at_risk_30,
                "recommended_total": total_recommended,
                "pressure_brands": sorted(pressure_brands),
            },
        }
    )