# ShopHub - Multi-Vendor eCommerce Platform

ShopHub is a full-stack, multi-vendor e-commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js). It features a robust Role-Based Access Control (RBAC) system, allowing customers to shop, vendors to manage their products and orders, and administrators to oversee the entire marketplace.

## 🚀 Features

### General
* **Authentication & Authorization:** Secure JWT-based authentication with role-based access control.
* **Responsive UI:** Mobile-first design built with Tailwind CSS and Lucide React icons.
* **Email Notifications:** Automated emails for order confirmations, status updates, password resets, and vendor notifications.
* **Search & Filtering:** Advanced product search, category filtering, price range selection, and sorting.

### 👤 Customer Features
* Browse products by category, tags, or search queries.
* Persistent Shopping Cart (Local Storage & Context API).
* Multi-step Checkout Process (Shipping, Review, Payment).
* Order history and tracking.
* Product review and rating system (verified purchases).

### 🏪 Vendor Features
* Dedicated Vendor Dashboard with sales statistics and revenue tracking.
* Product Management (CRUD operations, inventory/stock tracking, image links).
* Order processing (update item statuses for their specific products).
* Public storefront displaying vendor profile and active products.

### 🛡️ Admin Features
* Global dashboard with high-level platform metrics.
* User Management (Enable/disable accounts, change roles).
* Vendor Management (Approve/reject new vendor applications).
* Product Moderation (Feature products, hide listings).
* Order Management (Platform-wide order tracking and status updates).
* Review Moderation (Approve/remove customer reviews).

---

## 🛠️ Tech Stack

**Frontend:**
* React 18 (Vite)
* Tailwind CSS (Styling)
* React Router v6 (Navigation)
* Context API (State Management for Auth & Cart)
* React Hot Toast (Notifications)

**Backend:**
* Node.js & Express.js
* MongoDB (Mongoose ODM)
* JSON Web Tokens (JWT) for Authentication
* Bcrypt.js (Password Hashing)
* Joi (Data Validation)
* Nodemailer (Email Services)

---

## 📂 Project Structure

```text
ApexcifyTechnologys-ecommerce/
├── backend/
│   ├── database/       # Database seeding scripts
│   ├── src/
│   │   ├── config/     # Database connection setup
│   │   ├── middleware/ # Auth, RBAC, and Error Handling
│   │   ├── models/     # Mongoose Schemas (User, Product, Order, etc.)
│   │   ├── routes/     # Express API Routes
│   │   ├── services/   # External services (Email)
│   │   └── index.js    # Express app entry point
├── frontend/
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── components/ # Reusable UI components (Navbar, ProductCard)
│   │   ├── context/    # React Context (Auth, Cart)
│   │   ├── lib/        # API client and utilities
│   │   ├── pages/      # Route components (Home, Dashboards, Checkout)
│   │   ├── App.jsx     # Main application routing
│   │   └── main.jsx    # React entry point
```

## 🏁 Getting Started
### Prerequisites
- Node.js (v16+)

- MongoDB instance (Local or Atlas)

### 1. Installation
Clone the repository and install dependencies for both the frontend and backend.

```Bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend/ directory with the following variables:

```bash
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=shophub

# Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email Services (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="ShopHub" <noreply@shophub.com>
```

### 3. Database Seeding
Populate your database with initial categories, dummy users, products, and reviews to get started quickly.

```Bash
cd backend
node database/seed.js
Seed Credentials:

Admin: admin@shophub.com / Admin@123456

Vendor (TechStore): techstore@shophub.com / Vendor@123456

Customer: customer1@shophub.com / Customer@123
```

### 4. Running the Application
Open two terminal windows to start the backend and frontend servers simultaneously.

Terminal 1 (Backend):

```Bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```Bash
cd frontend
npm run dev
```

The application will be available at http://localhost:5173.

## 📡 API Endpoints
Brief overview of the main API routes:

**Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`

**Products**: `/api/products` (GET, POST, PUT, DELETE)

**Categories**: `/api/categories`

**Orders**: `/api/orders` (Create, List, Update Status)

**Reviews**: `/api/reviews`

**Vendors**: `/api/vendors/dashboard`, `/api/vendors/orders`, `/api/vendors/:id`

**Admin**: `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/vendors`