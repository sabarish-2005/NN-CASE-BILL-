# ⚜ NACHIMUTHU NATRAYAN — Billing System v2.0
### Full-Stack (React + Node.js + MongoDB)

Professional billing system for **Grow Bag & Open Top Cover Cutting Industrial Job Work**

```
Owner   : SABARISH (Proprietor)
Address : 2/206, Bus Stand Near, Selakkarichal, Sulur - 641658
Phone   : 9043695759
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Query, Zustand, React Router, Recharts |
| **Backend**  | Node.js, Express, MongoDB, Mongoose, JWT Auth |
| **Export**   | ExcelJS (server-side .xlsx generation) |
| **Print**    | Custom A4 HTML print layout (Ctrl+P → Save as PDF) |

---

## 📁 Project Structure

```
nn-billing/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express entry point
│   │   ├── config/db.js           # MongoDB connection
│   │   ├── models/                # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Product.js
│   │   │   └── Bill.js
│   │   ├── controllers/           # Business logic
│   │   │   ├── authController.js
│   │   │   ├── billController.js
│   │   │   ├── customerController.js
│   │   │   ├── productController.js
│   │   │   └── exportController.js
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Auth + error handling
│   │   └── utils/                 # Helpers (numberToWords, billNumber, seed)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/             # Sidebar, TopBar, Layout
    │   │   ├── ui/                 # Badge, Modal, Spinner, etc.
    │   │   └── bills/               # BillForm, BillPreview, PrintBill
    │   ├── pages/                  # Route pages
    │   ├── store/                  # Zustand stores (auth, ui)
    │   ├── services/                # API service layer
    │   ├── utils/                  # Calculations, formatting, constants
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+ — https://nodejs.org
- **MongoDB** — Local install OR free MongoDB Atlas cluster (https://mongodb.com/atlas)

---

### 1️⃣ Backend Setup

```bash
cd backend
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nn_billing
# OR Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/nn_billing
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Seed the database (creates default admin user + sample customers/products):
```bash
npm run seed
```
> Default login: **sabarish@nn.com** / **sabarish123**

Start the backend server:
```bash
npm run dev
```
✅ API running at `http://localhost:5000`

---

### 2️⃣ Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```
✅ App running at `http://localhost:5173`

The Vite dev server proxies `/api` requests to the backend automatically (configured in `vite.config.js`).

---

### 3️⃣ Login

1. Open `http://localhost:5173`
2. Login with:
   - Email: `sabarish@nn.com`
   - Password: `sabarish123`
3. You'll land on the **Dashboard** with sample data already loaded!

---

## 🧾 Features

### Bill Types
| Code | Type |
|---|---|
| DC | Delivery Challan |
| CB | Cash Bill |
| CR | Credit Bill |
| GST | GST Invoice (with CGST/SGST) |
| JW | Job Work Bill |

### Core Capabilities
- ✅ **Auto bill numbering** — `NN/DC/2025-26/0001` format, resets per financial year
- ✅ **Auto calculations** — Qty × Rate, GST split, round-off, amount in words
- ✅ **Customer & Product** management with search/autocomplete
- ✅ **Dashboard** — Revenue charts, monthly trends, bill type breakdown
- ✅ **Bill History** — Search, filter by type, sort, pagination
- ✅ **Print / PDF** — Professional A4 layout matching your brand (green + gold)
- ✅ **WhatsApp Share** — One-click formatted message
- ✅ **Excel Export** — Full bills + items breakdown (ExcelJS)
- ✅ **Dark Mode** — Persisted preference
- ✅ **Logo & Signature Upload** — Appears on every printed bill
- ✅ **JWT Authentication** — Secure multi-user support
- ✅ **Responsive** — Works on mobile, tablet, desktop

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET  | `/auth/me` | Get current user |
| PUT  | `/auth/settings` | Update logo/signature/GSTIN |
| PUT  | `/auth/password` | Change password |

### Bills
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/bills` | List bills (search, filter, paginate) |
| GET    | `/bills/:id` | Get single bill |
| POST   | `/bills` | Create bill |
| PUT    | `/bills/:id` | Update bill |
| DELETE | `/bills/:id` | Delete bill |
| POST   | `/bills/:id/duplicate` | Duplicate bill |
| GET    | `/bills/stats/summary` | Dashboard stats |
| GET    | `/bills/next-number/:type` | Get next auto bill number |

### Customers / Products
| Method | Endpoint |
|---|---|
| GET/POST | `/customers`, `/products` |
| GET/PUT/DELETE | `/customers/:id`, `/products/:id` |

### Export
| Method | Endpoint | Description |
|---|---|---|
| GET | `/export/excel` | Download .xlsx of all bills |

All endpoints (except `/auth/login`, `/auth/register`) require:
```
Authorization: Bearer <jwt_token>
```

---

## 🖨️ Printing Bills

1. Open any bill → click **Print / PDF**
2. Browser print dialog opens with the bill rendered in A4 format
3. Choose **"Save as PDF"** as destination, or select your printer
4. Set margins to **None/Minimum** for best results

The print layout includes:
- ⚜ Vel logo (or your uploaded logo) in green-gold header
- Company name, address, phone, GSTIN
- Bill No, Date, Transport details
- Customer details box
- Items table with HSN, Qty, Rate, GST%, Amount
- Amount in words + totals breakdown
- "Thank You" branded footer bar
- Signature section

---

## 🌐 Production Deployment

### Backend (e.g. Render, Railway, VPS)
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```
Set environment variables in your hosting dashboard (MONGODB_URI, JWT_SECRET, FRONTEND_URL).

### Frontend (e.g. Vercel, Netlify)
```bash
cd frontend
npm run build
```
Deploy the `dist/` folder. Set `VITE_API_URL` if your backend isn't on the same domain, and update `vite.config.js` proxy or use an env-based API base URL in `src/services/api.js`.

---

## 🛠️ Customization

- **Brand colors**: Edit `tailwind.config.js` → `colors.brand` (green) and `colors.gold`
- **Bill types**: Edit `BILL_TYPES` in `frontend/src/utils/index.js`
- **Company info**: Edit `CO` object in `frontend/src/utils/index.js` and `backend/src/controllers/exportController.js`
- **Print layout**: Edit `frontend/src/components/bills/PrintBill.jsx`

---

## 📞 Support

```
NACHIMUTHU NATRAYAN — SABARISH JOB WORKS
2/206, Bus Stand Near, Selakkarichal, Sulur - 641658
Phone: 9043695759
```

*Expert Cutting · Perfect Finish · Timely Delivery · Industrial Job Work Services*
