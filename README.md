# ⚜ NACHIMUTHU NATRAYAN — Billing System v2.0

**Professional Full-Stack Billing Management System** for handling invoices, customers, products, labor work, and billing operations with support for Web, Mobile (Expo), and Desktop (Electron) platforms.

```
Owner   : SABARISH (Proprietor)
Address : 2/206, Bus Stand Near, Selakkarichal, Sulur - 641658
Phone   : 9043695759
```

---

## ✨ Features

### Core Functionality
- ✅ **Invoice Management** - Create, view, update, and delete bills
- ✅ **Customer Management** - Maintain customer database with contact details
- ✅ **Product Catalog** - Manage products with categories and pricing
- ✅ **Labor Management** - Track labor work and rates
- ✅ **Bill Reservations** - Reserve bills for future billing
- ✅ **PDF Export** - Generate professional PDF invoices
- ✅ **Excel Export** - Export billing data to Excel format
- ✅ **Data Sync** - Real-time synchronization across devices
- ✅ **WhatsApp Integration** - Send invoices via WhatsApp
- ✅ **User Authentication** - Secure login and JWT-based authorization
- ✅ **Role-Based Access** - Admin and regular user roles
- ✅ **Search & Filter** - Advanced filtering capabilities
- ✅ **Print-Friendly** - Custom A4 HTML print layout

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Web Frontend** | React 18, Vite, TailwindCSS, React Query, Zustand, React Router, Recharts |
| **Mobile** | React Native, Expo, TailwindCSS, React Navigation |
| **Desktop** | Electron, React |
| **Backend** | Node.js 20+, Express 4.19, MongoDB 8.4 |
| **Authentication** | JWT, bcryptjs |
| **Export** | ExcelJS, PDFKit |
| **File Upload** | Multer |
| **Security** | Helmet, CORS, Rate Limiting |

---

## 📁 Project Structure

```
nn-billing/
├── app/                           # React Native Mobile App (Expo)
│   ├── src/
│   │   ├── app/                   # Screen navigation & layout
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # Custom React hooks (useRole)
│   │   ├── services/              # API services & business logic
│   │   ├── store/                 # Zustand state management
│   │   └── utils/                 # Helper functions
│   ├── app.json                   # Expo configuration
│   └── package.json
│
├── backend/                       # Node.js Express API Server
│   ├── src/
│   │   ├── app.js                 # Express server setup
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── controllers/           # Route handlers & business logic
│   │   │   ├── authController.js
│   │   │   ├── billController.js
│   │   │   ├── customerController.js
│   │   │   ├── productController.js
│   │   │   ├── laborController.js
│   │   │   ├── exportController.js
│   │   │   └── syncController.js
│   │   ├── models/                # MongoDB Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Product.js
│   │   │   ├── Bill.js
│   │   │   └── Labor.js
│   │   ├── routes/                # API route definitions
│   │   │   ├── auth.js
│   │   │   ├── bills.js
│   │   │   ├── customers.js
│   │   │   ├── products.js
│   │   │   ├── labors.js
│   │   │   ├── export.js
│   │   │   ├── billReserve.js
│   │   │   └── sync.js
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.js            # JWT authentication
│   │   │   ├── error.js           # Error handling
│   │   │   ├── validate.js        # Input validation
│   │   │   └── requireAdmin.js    # Admin authorization
│   │   └── utils/                 # Utility functions
│   │       ├── billNumber.js      # Bill numbering system
│   │       ├── numberToWords.js   # Amount in words converter
│   │       ├── migration.js       # Database migrations
│   │       └── seed.js            # Sample data seeding
│   ├── uploads/                   # File storage directory
│   ├── .env.example
│   └── package.json
│
├── frontend/                      # React Web Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── bills/             # Bill-related components
│   │   │   ├── dashboard/         # Dashboard components
│   │   │   ├── layout/            # Layout components
│   │   │   └── ui/                # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   │   ├── BillDetailPage.jsx
│   │   │   ├── BillFormPage.jsx
│   │   │   ├── BillHistoryPage.jsx
│   │   │   ├── CustomersPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LaborsPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/              # API service layer
│   │   ├── store/                 # Zustand state stores
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Helper functions
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── desktop/                       # Electron Desktop Application
│   ├── main.js                    # Electron main process
│   ├── preload.js                 # Preload scripts
│   ├── app-build/                 # Built app output
│   └── package.json
│
├── .gitignore
└── README.md

```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and npm/yarn
- **MongoDB** 8.0+ (Local or MongoDB Atlas)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/sabarish-2005/NN-BILL-.git
cd nn-billing
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/nn_billing
JWT_SECRET=your_super_secret_jwt_key_here_change_this
PORT=5000
NODE_ENV=development
EOF

# Optional: Seed initial data
npm run seed
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Mobile Setup (Optional)
```bash
cd app
npm install
# Download Expo Go app on your phone
```

---

## ⚡ Running the Application

### Option 1: Development Mode (All Services)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Terminal 3 - Mobile (Optional):**
```bash
cd app
npm run dev
# Scan QR code with Expo Go app on your phone
```

### Option 2: Production Build

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview  # Preview the production build
```

### Option 3: Individual Services

```bash
# Backend only (with nodemon auto-reload)
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Desktop app
cd desktop && npm start

# Mobile app
cd app && npm run dev
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup        - Register new user
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
```

### Bills
```
GET    /api/bills              - Get all bills
GET    /api/bills/:id          - Get single bill
POST   /api/bills              - Create new bill
PUT    /api/bills/:id          - Update bill
DELETE /api/bills/:id          - Delete bill
POST   /api/billReserve        - Reserve bill
```

### Customers
```
GET    /api/customers          - Get all customers
GET    /api/customers/:id      - Get single customer
POST   /api/customers          - Create customer
PUT    /api/customers/:id      - Update customer
DELETE /api/customers/:id      - Delete customer
```

### Products
```
GET    /api/products           - Get all products
GET    /api/products/:id       - Get single product
POST   /api/products           - Create product
PUT    /api/products/:id       - Update product
DELETE /api/products/:id       - Delete (deactivate) product
```

### Labor
```
GET    /api/labors             - Get all labor entries
POST   /api/labors             - Create labor entry
PUT    /api/labors/:id         - Update labor entry
DELETE /api/labors/:id         - Delete labor entry
```

### Export
```
GET    /api/export/pdf/:billId - Export bill as PDF
POST   /api/export/excel       - Export bills as Excel
```

### Sync
```
POST   /api/sync/bills         - Synchronize bills data
```

---

## 💾 Database Schema

### User Collection
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String (admin/user),
  createdAt: Date
}
```

### Customer Collection
```javascript
{
  name: String (required),
  phone: String,
  email: String,
  address: String,
  gstNumber: String,
  contactPerson: String,
  createdBy: ObjectId (ref: User),
  isActive: Boolean
}
```

### Product Collection
```javascript
{
  name: String (required),
  category: String,
  price: Number,
  unit: String,
  description: String,
  createdBy: ObjectId (ref: User),
  isActive: Boolean
}
```

### Bill Collection
```javascript
{
  billNumber: String (unique),
  date: Date,
  customer: ObjectId (ref: Customer),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  totalAmount: Number,
  taxAmount: Number,
  paymentStatus: String (pending/paid),
  notes: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

---

## 🔐 Authentication & Security

- **JWT Tokens** - Stateless authentication with expiring tokens
- **Password Hashing** - bcryptjs for secure password storage
- **CORS Protection** - Cross-origin requests configured safely
- **Helmet Security Headers** - Protection against common vulnerabilities
- **Rate Limiting** - Prevent API abuse with request rate limiting
- **Input Validation** - Express validator middleware
- **Role-Based Access Control** - Admin vs. Regular user permissions

---

## 📦 Scripts

### Backend
```bash
npm run dev              # Development with nodemon
npm run start            # Production server
npm run seed             # Seed database with sample data
```

### Frontend
```bash
npm run dev              # Development server with HMR
npm run build            # Build for production
npm run preview          # Preview production build
```

### Mobile
```bash
npm run dev              # Start Expo dev server
npm run build            # Build APK/IPA
```

---

## 🐛 Common Issues & Solutions

### MongoDB Connection Error
**Solution:** Ensure MongoDB is running locally or update `MONGODB_URI` in `.env` with your Atlas connection string.

```bash
# Check MongoDB status
mongosh

# Or use MongoDB Atlas connection:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/nn_billing
```

### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation

- [Backend API Documentation](./backend/README.md) - Detailed API specs
- [Frontend Setup Guide](./frontend/README.md) - React + Vite setup
- [Mobile App Guide](./app/README.md) - Expo/React Native setup
- [Database Schema](./backend/src/models/README.md) - MongoDB collections

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sabarish** - [GitHub Profile](https://github.com/sabarish-2005)

---

## 📞 Support & Contact

- **Email:** For support, open an issue on GitHub
- **Phone:** 9043695759
- **Location:** Sulur, Tamil Nadu, India

---

## 🙏 Acknowledgments

- Built with modern web technologies (React, Node.js, MongoDB)
- Inspired by real-world billing system requirements
- Community-driven improvements and contributions

---

## 🎯 Roadmap

- [ ] Mobile app offline support
- [ ] Advanced analytics dashboard
- [ ] Inventory management
- [ ] Multi-currency support
- [ ] API rate limiting improvements
- [ ] Docker containerization
- [ ] CI/CD pipeline with GitHub Actions

---

**Made with ❤️ by the NN Billing Team**

**Last Updated:** 2026-06-21 | **Version:** 2.0.0
