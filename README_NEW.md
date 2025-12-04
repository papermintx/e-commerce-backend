# 🛍️ E-Commerce Backend API - Fashion Store

Backend API untuk aplikasi e-commerce fashion store dengan fitur authentication, product management, dan order processing. Menggunakan **Node.js**, **Express**, **MySQL**, **Prisma ORM**, **JWT Authentication**, dan **Nodemailer**.

## ✨ Fitur Utama

### 🔐 Authentication & Authorization
- ✅ User registration dengan email verification
- ✅ Login/Logout dengan JWT tokens
- ✅ Refresh token mechanism
- ✅ Password reset via email
- ✅ Email verification system
- ✅ Role-based access control (Admin/User)
- ✅ Bcrypt password hashing

### 📧 Email Service
- ✅ Email verification otomatis saat signup
- ✅ Password reset email dengan secure token
- ✅ Welcome email setelah verifikasi
- ✅ HTML email templates yang modern
- ✅ Support multiple SMTP providers (Gmail, Brevo, Mailgun, Ethereal)

### 🖼️ File Upload (Local Storage)
- ✅ Multiple image upload untuk products
- ✅ Image carousel support (max 5 images)
- ✅ Auto-generated unique filenames
- ✅ File validation (type, size)
- ✅ Static file serving

### 📦 Product Management
- ✅ CRUD operations untuk products
- ✅ Category management
- ✅ Product variants (size, color)
- ✅ Stock management
- ✅ Featured products
- ✅ Product images carousel
- ✅ Slug-based URLs

### 🛒 Shopping Features
- ✅ Shopping cart system
- ✅ Wishlist
- ✅ Product reviews & ratings
- ✅ Order management
- ✅ Multiple shipping addresses

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **npm** atau **yarn**
- Email account (Gmail/Brevo/Mailgun untuk production, Ethereal untuk development)

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd e-commerce-backend

# Install dependencies
npm install
```

### 2. Setup Database (MySQL)

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
exit
```

### 3. Environment Variables

```bash
# Copy .env.example ke .env
cp .env.example .env
```

**Generate JWT Secrets (PENTING!):**

```bash
# OPTION 1: Helper Script (RECOMMENDED - Paling Mudah)
node generate-secrets.js

# OPTION 2: Manual dengan Node.js built-in crypto
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

# OPTION 3: Dengan OpenSSL (Linux/Mac/Git Bash)
openssl rand -hex 32
```

**Contoh konfigurasi `.env`:**

```env
# Database
DATABASE_URL="mysql://root:your_password@localhost:3306/ecommerce"

# JWT Secrets (Generate dengan command di atas)
JWT_SECRET="your-generated-secret-here"
JWT_REFRESH_SECRET="your-generated-refresh-secret-here"

# Email (Gmail Example)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Application
APP_NAME="E-Commerce Fashion Store"
APP_URL="http://localhost:3000"
PORT=3000
```

### 4. Generate Prisma Client & Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio untuk melihat database
npx prisma studio
```

### 5. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server akan berjalan di: **http://localhost:3000**

## 📧 Email Configuration

### Option 1: Gmail (Recommended for Testing)

1. Enable 2-Factor Authentication di Google Account
2. Generate App Password:
   - Go to: https://myaccount.google.com/security
   - Select "2-Step Verification"
   - Scroll down and select "App passwords"
   - Generate new app password
3. Use App Password in `.env`:

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-digit-app-password"
```

**Limit:** 500 emails/day (Free)

### Option 2: Brevo (Sendinblue) - Production Ready

1. Sign up: https://www.brevo.com/
2. Get SMTP credentials from Settings > SMTP & API
3. Configure:

```env
EMAIL_HOST="smtp-relay.brevo.com"
EMAIL_PORT=587
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-brevo-smtp-key"
```

**Limit:** 300 emails/day (Free tier)

### Option 3: Ethereal (Development Only)

1. Create account: https://ethereal.email/create
2. Copy credentials:

```env
EMAIL_HOST="smtp.ethereal.email"
EMAIL_PORT=587
EMAIL_USER="generated-username"
EMAIL_PASSWORD="generated-password"
```

**Note:** Email tidak benar-benar terkirim, hanya untuk testing. View emails at: https://ethereal.email

### Option 4: Mailgun (Production)

**Limit:** 5000 emails/month (Free)

```env
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT=587
EMAIL_USER="postmaster@your-domain.mailgun.org"
EMAIL_PASSWORD="your-mailgun-password"
```

## 🗄️ Database Schema

Project ini menggunakan Prisma ORM dengan MySQL. Schema lengkap tersedia di `prisma/schema.prisma`.

### Main Models:
- **Profile** - User profiles dengan authentication
- **Category** - Product categories
- **Product** - Products dengan images, variants, etc
- **Cart & CartItem** - Shopping cart
- **Order & OrderItem** - Order management
- **Address** - Shipping addresses
- **Review** - Product reviews
- **Wishlist** - User wishlists

## 📁 Project Structure

```
e-commerce-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── config/
│   │   ├── email.js          # Email configuration (Nodemailer)
│   │   ├── jwt.js            # JWT configuration
│   │   └── prisma.js         # Prisma client
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── admin/
│   │       ├── category.controller.js
│   │       └── product.controller.js
│   ├── dto/                   # Data validation
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verification
│   │   └── role.middleware.js  # Role-based access
│   ├── routes/
│   ├── services/
│   │   └── upload.service.js  # Local file upload
│   └── utils/
├── uploads/                   # Uploaded files (auto-created)
│   ├── products/
│   ├── categories/
│   └── avatars/
├── app.js                     # Express app
├── package.json
└── .env.example              # Environment template
```

## 🔑 API Endpoints

### Authentication

```http
POST   /auth/signup              # Register user baru
POST   /auth/signin              # Login
POST   /auth/signout             # Logout (Protected)
POST   /auth/refresh             # Refresh access token
GET    /auth/me                  # Get current user (Protected)
POST   /auth/reset-password      # Request password reset
POST   /auth/update-password     # Update password dengan token
POST   /auth/resend-verification # Resend verification email
POST   /auth/verify-email/callback # Verify email (Internal)
GET    /auth/verify-email        # Email verification page
GET    /auth/reset-password-confirm # Password reset page
```

### Admin - Categories (Protected, Admin Only)

```http
GET    /api/admin/categories        # Get all categories
GET    /api/admin/categories/:id    # Get category by ID
POST   /api/admin/categories        # Create category
PUT    /api/admin/categories/:id    # Update category
DELETE /api/admin/categories/:id    # Delete category
```

### Admin - Products (Protected, Admin Only)

```http
GET    /api/admin/products          # Get all products
GET    /api/admin/products/:id      # Get product by ID
POST   /api/admin/products          # Create product (with images)
PUT    /api/admin/products/:id      # Update product
DELETE /api/admin/products/:id      # Delete product
PATCH  /api/admin/products/:id/stock    # Update stock
PATCH  /api/admin/products/:id/featured # Toggle featured
```

### Public - Products

```http
GET    /api/public/products         # Browse all products
GET    /api/public/products/featured # Featured products
GET    /api/public/products/:slug   # Product detail by slug
GET    /api/public/products/:slug/related # Related products
```

### Static Files

```http
GET    /uploads/:folder/:filename   # Access uploaded images
```

## 🧪 Testing dengan Postman

1. Import collection: `E-Commerce API.postman_collection.json`
2. Import environment: `E-Commerce API.postman_environment.json`
3. Jalankan requests sesuai urutan di folder "Auth"

## 🔒 Security Features

- ✅ Password hashing dengan bcrypt (10 rounds)
- ✅ JWT-based authentication
- ✅ Refresh token rotation
- ✅ Email verification required
- ✅ Secure password reset with expiring tokens
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection protection (Prisma ORM)
- ✅ CORS configuration

## 🐛 Troubleshooting

### Email tidak terkirim

1. **Gmail**: Pastikan menggunakan App Password, bukan password biasa
2. **Check SMTP credentials**: Verifikasi EMAIL_HOST, PORT, USER, PASSWORD
3. **Firewall**: Pastikan port 587 tidak diblock
4. **Test dengan Ethereal**: Gunakan Ethereal.email untuk development

### Database Connection Error

```bash
# Check MySQL is running
mysql -u root -p

# Verify DATABASE_URL format
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# Regenerate Prisma Client
npx prisma generate
```

### Prisma Migration Issues

```bash
# Reset database (WARNING: Data akan hilang!)
npx prisma migrate reset

# Create fresh migration
npx prisma migrate dev --name init
```

### Upload tidak berfungsi

```bash
# Pastikan folder uploads ada
mkdir -p uploads/products uploads/categories uploads/avatars

# Check permissions (Linux/Mac)
chmod 755 uploads
```

## 📝 Environment Variables Lengkap

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | - | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | ✅ |
| `JWT_EXPIRES_IN` | Access token expiry | 15m | ❌ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d | ❌ |
| `EMAIL_HOST` | SMTP host | smtp.gmail.com | ✅ |
| `EMAIL_PORT` | SMTP port | 587 | ✅ |
| `EMAIL_USER` | SMTP username | - | ✅ |
| `EMAIL_PASSWORD` | SMTP password | - | ✅ |
| `EMAIL_FROM` | From email address | EMAIL_USER | ❌ |
| `APP_NAME` | Application name | E-Commerce Fashion Store | ❌ |
| `APP_URL` | Application URL | http://localhost:3000 | ✅ |
| `PORT` | Server port | 3000 | ❌ |
| `NODE_ENV` | Environment | development | ❌ |

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Developer

Developed with ❤️ for modern e-commerce applications.

---

**Happy Coding! 🚀**
