# Salon Management Portal - Backend API

A comprehensive REST API backend built with **Express.js** and **MongoDB** for the Salon Management Portal frontend project.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs

## Quick Start

### Prerequisites

- Node.js (v16+)
- MongoDB (running locally or a cloud instance)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (edit .env as needed)
cp .env.example .env

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

The server will start on `http://localhost:5000`

## Swagger UI Documentation

Interactive API docs are available at:

**http://localhost:5000/api-docs**

- Click **Authorize** and paste a JWT from `/api/auth/login` to try protected endpoints
- OpenAPI JSON is also available at `/api-docs.json`

## Login Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@salon.com | admin123 |
| Barber | marcus@salon.com | barber123 |
| Barber | sarah@salon.com | barber123 |
| Barber | david@salon.com | barber123 |
| Receptionist | emily@salon.com | recep123 |
| Customer | alex@example.com | customer123 |
| Customer | jessica@example.com | customer123 |
| Customer | ryan@example.com | customer123 |

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/users` | Get all users | Yes | Admin, Receptionist |
| GET | `/api/users/barbers` | Get all barbers | Yes | All |
| GET | `/api/users/:id` | Get user by ID | Yes | All |
| PUT | `/api/users/:id` | Update user | Yes | Admin |
| DELETE | `/api/users/:id` | Delete user | Yes | Admin |

### Services (`/api/services`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/services` | Get all services (with filters) | No | - |
| GET | `/api/services/categories` | Get all categories | No | - |
| GET | `/api/services/:id` | Get service by ID | No | - |
| POST | `/api/services` | Create service | Yes | Admin |
| PUT | `/api/services/:id` | Update service | Yes | Admin |
| DELETE | `/api/services/:id` | Delete service | Yes | Admin |

**Query Filters**: `category`, `minPrice`, `maxPrice`, `minDuration`, `maxDuration`, `search`

### Appointments (`/api/appointments`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/appointments` | Get all appointments | Yes | Admin, Receptionist |
| GET | `/api/appointments/my` | Get my appointments | Yes | All |
| GET | `/api/appointments/barber` | Get barber's appointments | Yes | Barber |
| GET | `/api/appointments/available-slots` | Get available time slots | Yes | All |
| GET | `/api/appointments/:id` | Get appointment by ID | Yes | All |
| POST | `/api/appointments` | Create appointment (booking) | Yes | All |
| PUT | `/api/appointments/:id/status` | Update appointment status | Yes | Admin, Receptionist, Barber |
| PUT | `/api/appointments/:id/cancel` | Cancel appointment | Yes | All |
| PUT | `/api/appointments/:id/reschedule` | Reschedule appointment | Yes | All |
| PUT | `/api/appointments/:id/assign` | Assign barber | Yes | Admin, Receptionist |

**Available Slots Query**: `barberId`, `date`

### Staff Management (`/api/staff`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/staff` | Get all staff | Yes | Admin, Receptionist |
| GET | `/api/staff/availability` | Get staff availability | Yes | All |
| GET | `/api/staff/time-off` | Get all time-off requests | Yes | Admin, Receptionist |
| GET | `/api/staff/my-time-off` | Get my time-off requests | Yes | Barber |
| GET | `/api/staff/:id` | Get staff detail with stats | Yes | All |
| POST | `/api/staff` | Create staff member | Yes | Admin |
| POST | `/api/staff/time-off` | Request time off | Yes | Barber |
| PUT | `/api/staff/:id` | Update staff member | Yes | Admin |
| PUT | `/api/staff/:id/shift` | Update shift hours | Yes | Admin, Receptionist |
| PUT | `/api/staff/time-off/:id` | Approve/reject time off | Yes | Admin, Receptionist |
| DELETE | `/api/staff/:id` | Delete staff member | Yes | Admin |

### Wage Management (`/api/wages`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/wages` | Get all wage records | Yes | Admin |
| GET | `/api/wages/my-earnings` | Get my earnings | Yes | Barber |
| GET | `/api/wages/monthly-summary` | Get monthly summary | Yes | Admin, Barber |
| GET | `/api/wages/barber/:barberId` | Get barber earnings | Yes | Admin |
| POST | `/api/wages` | Create wage record | Yes | Admin |
| PUT | `/api/wages/:id/status` | Update wage status | Yes | Admin |
| PUT | `/api/wages/commission/:barberId` | Update commission rate | Yes | Admin |

### Inventory (`/api/inventory`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/inventory` | Get all inventory items | Yes | Admin |
| GET | `/api/inventory/low-stock` | Get low stock alerts | Yes | Admin |
| GET | `/api/inventory/categories` | Get inventory categories | Yes | Admin |
| GET | `/api/inventory/:id` | Get item by ID | Yes | Admin |
| POST | `/api/inventory` | Create inventory item | Yes | Admin |
| PUT | `/api/inventory/:id` | Update inventory item | Yes | Admin |
| PUT | `/api/inventory/:id/restock` | Restock item | Yes | Admin |
| DELETE | `/api/inventory/:id` | Delete inventory item | Yes | Admin |

### Products (`/api/products`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/products` | Get all products (with filters) | No | - |
| GET | `/api/products/categories` | Get product categories | No | - |
| GET | `/api/products/search` | Search products | No | - |
| GET | `/api/products/:id` | Get product by ID | No | - |
| POST | `/api/products` | Create product | Yes | Admin |
| PUT | `/api/products/:id` | Update product | Yes | Admin |
| DELETE | `/api/products/:id` | Delete product | Yes | Admin |

**Query Filters**: `category`, `minPrice`, `maxPrice`, `brand`, `sort` (price_asc, price_desc, name, rating)

### Orders (`/api/orders`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/orders` | Get all orders | Yes | Admin |
| GET | `/api/orders/my` | Get my orders | Yes | All |
| GET | `/api/orders/:id` | Get order by ID | Yes | All |
| POST | `/api/orders` | Create order (checkout) | Yes | All |
| PUT | `/api/orders/:id/status` | Update order status | Yes | Admin |
| PUT | `/api/orders/:id/cancel` | Cancel order | Yes | All |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/analytics/overview` | Get overview stats | Yes | Admin |
| GET | `/api/analytics/revenue` | Get revenue analytics | Yes | Admin |
| GET | `/api/analytics/user-growth` | Get user growth data | Yes | Admin |
| GET | `/api/analytics/service-popularity` | Get service popularity | Yes | Admin |
| GET | `/api/analytics/staff-performance` | Get staff performance | Yes | Admin |
| GET | `/api/analytics/monthly-appointments` | Get monthly appointment data | Yes | Admin |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/dashboard/customer` | Customer dashboard data | Yes | Customer |
| GET | `/api/dashboard/barber` | Barber dashboard data | Yes | Barber |
| GET | `/api/dashboard/receptionist` | Receptionist dashboard data | Yes | Receptionist |

## Request/Response Format

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Project Structure

```
src/
├── config/
│   ├── db.js              # Database connection
│   └── swagger.js         # OpenAPI / Swagger specification
├── controllers/
│   ├── analytics.controller.js
│   ├── appointment.controller.js
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   ├── inventory.controller.js
│   ├── order.controller.js
│   ├── product.controller.js
│   ├── service.controller.js
│   ├── staff.controller.js
│   ├── user.controller.js
│   └── wage.controller.js
├── middleware/
│   ├── auth.js            # JWT authentication & role authorization
│   └── validate.js        # Request validation
├── models/
│   ├── Appointment.js
│   ├── Inventory.js
│   ├── Order.js
│   ├── Product.js
│   ├── Service.js
│   ├── TimeOff.js
│   ├── User.js
│   └── Wage.js
├── routes/
│   ├── analytics.routes.js
│   ├── appointment.routes.js
│   ├── auth.routes.js
│   ├── dashboard.routes.js
│   ├── inventory.routes.js
│   ├── order.routes.js
│   ├── product.routes.js
│   ├── service.routes.js
│   ├── staff.routes.js
│   ├── user.routes.js
│   └── wage.routes.js
├── seed.js                # Database seeding script
└── server.js              # Express app entry point
```
