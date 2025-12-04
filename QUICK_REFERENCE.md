# ⚡ Quick Reference Commands

## 🚀 Setup Project

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

## 🔐 Generate JWT Secrets

```bash
# OPTION 1: Helper Script (RECOMMENDED - Paling Mudah)
node generate-secrets.js

# OPTION 2: Manual dengan Node.js built-in crypto
node -e "console.log('JWT_SECRET=\"' + require('node:crypto').randomBytes(32).toString('hex') + '\"')"
node -e "console.log('JWT_REFRESH_SECRET=\"' + require('node:crypto').randomBytes(32).toString('hex') + '\"')"

# OPTION 3: Dengan OpenSSL (Linux/Mac/Git Bash)
echo "JWT_SECRET=\"$(openssl rand -hex 32)\""
echo "JWT_REFRESH_SECRET=\"$(openssl rand -hex 32)\""
```

## 📧 Generate Ethereal Email Credentials

```bash
node -e "const nodemailer = require('nodemailer'); nodemailer.createTestAccount((err, account) => { if (err) { console.error(err); return; } console.log('EMAIL_HOST=\"' + account.smtp.host + '\"'); console.log('EMAIL_PORT=' + account.smtp.port); console.log('EMAIL_USER=\"' + account.user + '\"'); console.log('EMAIL_PASSWORD=\"' + account.pass + '\"'); console.log('View at: https://ethereal.email/messages'); });"
```

## 🗄️ Database Commands

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# Push schema without migration
npx prisma db push

# Pull schema from database
npx prisma db pull

# Seed database
npx prisma db seed
```

## 🧪 Test API Endpoints

### Health Check
```bash
curl http://localhost:3000
```

### Sign Up
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (Protected)
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Reset Password Request
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Resend Verification
```bash
curl -X POST http://localhost:3000/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## 📦 Create Admin User

```bash
# Via Prisma Studio:
npx prisma studio
# Navigate to Profile table > Add record
# Set role = "admin"

# Or via SQL:
mysql -u root -p ecommerce
```

```sql
-- Create admin user
INSERT INTO profiles (id, email, password, full_name, role, email_verified)
VALUES (
  UUID(),
  'admin@example.com',
  '$2a$10$...',  -- Generate with: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10, (e,h) => console.log(h));"
  'Admin User',
  'admin',
  true
);
```

## 🔍 Debug Commands

### Check MySQL Connection
```bash
mysql -u root -p -e "SELECT 1;"
```

### Check Database
```bash
mysql -u root -p -e "SHOW DATABASES;"
mysql -u root -p ecommerce -e "SHOW TABLES;"
```

### Check Prisma Schema
```bash
npx prisma validate
```

### Check Node Version
```bash
node --version
npm --version
```

### Clear Node Modules
```bash
# Windows
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Linux/Mac
rm -rf node_modules package-lock.json
npm install
```

## 📂 Create Upload Directories

```bash
# Windows PowerShell
New-Item -ItemType Directory -Force -Path uploads\products
New-Item -ItemType Directory -Force -Path uploads\categories
New-Item -ItemType Directory -Force -Path uploads\avatars

# Linux/Mac
mkdir -p uploads/{products,categories,avatars}
```

## 🔐 Generate Bcrypt Password Hash

```bash
# Generate hash for password
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10, (err, hash) => { if (err) throw err; console.log(hash); });"
```

## 🧹 Cleanup Commands

```bash
# Clear uploads folder
# Windows
Remove-Item -Recurse -Force uploads\*

# Linux/Mac
rm -rf uploads/*

# Reset database
npx prisma migrate reset

# Clear Prisma cache
Remove-Item -Recurse -Force node_modules\.prisma
npx prisma generate
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### MySQL Not Running
```bash
# Windows (XAMPP)
# Start XAMPP Control Panel > Start MySQL

# Linux
sudo service mysql start

# Mac
brew services start mysql
```

### Prisma Client Not Generated
```bash
npx prisma generate
# Restart VS Code if using TypeScript
```

## 📊 Useful SQL Queries

```sql
-- Count users
SELECT COUNT(*) FROM profiles;

-- List users by role
SELECT email, role, email_verified FROM profiles;

-- Find user by email
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Update user role
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Verify email
UPDATE profiles 
SET email_verified = true, email_verify_token = NULL 
WHERE email = 'test@example.com';

-- Count products
SELECT COUNT(*) FROM products;

-- List products with categories
SELECT p.name, c.name as category 
FROM products p 
JOIN categories c ON p.category_id = c.id;
```

## 🚀 Production Deployment

```bash
# Build for production
npm install --production

# Run migrations
npx prisma migrate deploy

# Start server
NODE_ENV=production node app.js

# Or use PM2
npm install -g pm2
pm2 start app.js --name "ecommerce-api"
pm2 logs
pm2 restart ecommerce-api
pm2 stop ecommerce-api
```

## 📝 Environment Variables Quick Copy

```env
DATABASE_URL="mysql://root:password@localhost:3306/ecommerce"
JWT_SECRET="generate-with-crypto"
JWT_REFRESH_SECRET="generate-with-crypto"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
APP_NAME="E-Commerce Fashion Store"
APP_URL="http://localhost:3000"
PORT=3000
NODE_ENV="development"
```

## 🎯 Common Tasks

### Add New Product Category
```bash
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirts",
    "description": "Comfortable cotton t-shirts",
    "is_active": true
  }'
```

### Upload Product with Images
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=Classic White T-Shirt" \
  -F "description=100% Cotton" \
  -F "price=25.00" \
  -F "stock=100" \
  -F "category_id=CATEGORY_UUID" \
  -F "sku=TSH-001" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

---

**Quick Links:**
- 📖 Full Documentation: `README_NEW.md`
- 📧 Email Setup: `SETUP_EMAIL_TUTORIAL.md`
- 🔄 Migration Guide: `MIGRATION_GUIDE.md`
- 📮 API Testing: Import `E-Commerce API.postman_collection.json`

**Need Help?** Check troubleshooting sections in the full documentation!
