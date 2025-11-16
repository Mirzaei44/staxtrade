# StaxTrade – Inventory Intelligence & B2B Ordering Demo

End to end demo of a **modern inventory intelligence platform** built with:

- **Django REST Framework** (backend API)
- **React** (frontend dashboard & customer portal)
- **JWT auth** via `djangorestframework-simplejwt`
- **Analytics & forecasting** for stock, revenue and demand
- **Docker** (backend + frontend containers)

The goal of this project is to show that I can **design, build and ship** a realistic product: from data model and APIs, through business logic and “AI like” insights, to a clean dashboard UI that non technical users can actually work with.

---

## High level overview

The platform has three main faces:

1. **Admin / Ops dashboard (React + Django API)**  
   - Manage products, brands and stock  
   - Auto restock low inventory with one click  
   - See revenue, orders, brand performance, and low stock alerts  
   - Inventory “intelligence” and demand forecasting modules

2. **Customer portal (B2B ordering)**  
   - Logged in customers see a personalized catalogue, per user discount  
   - Add items to cart and place orders  
   - View their own order history

3. **Executive / AI view**  
   - Slide in “AI Executive Assistant” panel on the frontend  
   - Summarises key business signals and roadmap at a glance  
   - Backed by real data (orders + stock), not just static text

Everything is driven by a clean **Django API** (`/api/...`) that the React app talks to.



## Tech stack

**Backend**

- Python 3.11
- Django 5
- Django REST Framework
- django-filter
- djangorestframework-simplejwt
- SQLite for simplicity (easily replaceable with Postgres)
- Dockerised backend container

**Frontend**

- React (Create React App)
- Axios for API calls
- Recharts for charts
- React Router
- React Toastify for notifications
- Bootstrap for layout/styling
- Dockerised frontend container

---

## Project structure

StaxTrade/
├── api/
│   ├── admin.py
│   ├── models.py            # Brand, Product, Order models
│   ├── serializers.py       # DRF serializers
│   ├── urls.py              # /api/... endpoints
│   ├── views.py             # Business logic & analytics endpoints
│   ├── fake_data.py         # realistic seed data generator
│   └── migrations/          # Django migrations
│
├── config/
│   ├── settings.py          # Django settings (JWT, DRF, CORS, etc.)
│   ├── urls.py              # mounts /api/
│   └── __init__.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── public/
│   └── src/
│       ├── api.js               # Axios instance + JWT refresh logic
│       ├── App.jsx              # Routing, layout, protected routes
│       ├── App.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── AIOpsAssistant.jsx
│       │   └── AIOpsAssistant.css   # <— YOU SAID THIS EXISTS (correct placement)
│       └── pages/
│           ├── Dashboard.jsx        # analytics & charts
│           ├── Products.jsx         # CRUD + inline stock control
│           ├── Inventory.jsx        # inventory insights
│           ├── Forecast.jsx         # demand forecasting
│           ├── CustomerCatalog.jsx
│           ├── CustomerOrders.jsx
│           ├── Cart.jsx
│           ├── Login.jsx
│           └── Register.jsx
│
├── Dockerfile                # backend Dockerfile
├── docker-compose.yml
├── manage.py
├── requirements.txt
├── README.md                 # main project README
└── README_DOCKER.md          # docker-only setup guide