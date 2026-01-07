# Freight Management System

A full-stack freight and logistics management application for managing orders, lanes, tracking shipments, and calculating rates.

## 🚀 Features

- **Order Management** - Create, view, and manage freight orders with multiple stops
- **Lane Management** - Track and manage shipping lanes with historical pricing
- **Real-time Tracking** - Monitor shipment progress with stop-level tracking
- **Rate Calculator** - Calculate shipping rates based on lanes and equipment
- **Address Autocomplete** - Smart address input with validation
- **Customer Management** - Manage customer information and relationships
- **Equipment Types** - Support for various freight equipment types
- **Reference Numbers** - Track BOL, PO, and SO numbers
- **Interactive Maps** - Visualize routes and tracking on maps

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **SQLAlchemy** - Async ORM with aiosqlite
- **Alembic** - Database migrations
- **Python 3.9+**

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Leaflet** - Interactive maps

## 📁 Project Structure

```
Work Trial Project/
├── backend/                 # FastAPI backend
│   ├── alembic/            # Database migrations
│   ├── core/               # Core modules (config, logging, exceptions)
│   ├── routes/             # API endpoints
│   ├── service/            # Business logic
│   ├── schemas/            # Database models
│   ├── scripts/            # Seed and test scripts
│   └── main.py             # Application entry point
│
├── frontend/               # Next.js frontend
│   ├── app/
│   │   ├── components/    # React components
│   │   ├── lib/           # API client
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── README.md              # This file
```

## 🚦 Getting Started

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **npm** or **yarn**

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. (Optional) Seed the database with sample data:
```bash
python scripts/seed_expanded_data.py
python scripts/seed_lane_history.py
```

6. Start the backend server:
```bash
./start_backend.sh
# Or manually: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at **http://localhost:8000**

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
./start_frontend.sh
# Or manually: npm run dev
```

The frontend will be available at **http://localhost:3000**

## 📚 API Documentation

Once the backend server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main API Endpoints

#### Orders
- `GET /orders/` - List all orders (with filtering and pagination)
- `GET /orders/{order_id}` - Get order details
- `POST /orders/` - Create new order
- `PUT /orders/{order_id}` - Update order
- `DELETE /orders/{order_id}` - Delete order
- `POST /orders/{order_id}/assign-price` - Assign price to order

#### Lanes
- `GET /lanes/` - List all lanes
- `POST /lanes/calculate` - Calculate lane price
- `GET /lanes/{lane_id}/history` - Get lane pricing history

#### Customers
- `GET /customers/` - List customers
- `POST /customers/` - Create customer
- `GET /customers/{customer_id}` - Get customer details

#### Users
- `GET /users/` - List users
- `POST /users/` - Create user

#### Equipment
- `GET /equipment/types` - List equipment types

#### Tracking
- `POST /tracking/webhook` - Receive tracking updates

## 🧪 Testing

### Backend Tests
Run test scripts from the backend directory:
```bash
python scripts/test_address_improvements.py
python scripts/test_assign_price.py
python scripts/test_lane_data.py
python scripts/test_stop_tracking.py
python scripts/test_tracking_webhook.py
```

## 📖 Additional Documentation

- [Backend README](backend/README.md) - Detailed backend documentation
- [Frontend Setup](frontend/SETUP.md) - Frontend configuration
- [Order Tracking Guide](ORDER_TRACKING_GUIDE.md) - Tracking implementation
- [Testing Guide](TESTING_GUIDE.md) - Testing instructions
- [Migration Guide](backend/MIGRATION_GUIDE.md) - Database migrations

## 🔧 Development

### Adding New Features

1. **Backend**: Create models in `schemas/models.py`, add routes in `routes/`, implement logic in `service/`
2. **Frontend**: Add components in `app/components/`, define types in `app/types/`
3. **Database**: Generate migrations with `alembic revision --autogenerate -m "description"`

### Error Handling

The application uses structured error handling:
- Custom exceptions in `backend/core/exceptions.py`
- Global exception handler in FastAPI
- Try-except blocks throughout the codebase

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

This project is part of a work trial demonstration.

## 🆘 Support

For questions or issues, please refer to the detailed documentation files or contact the development team.

