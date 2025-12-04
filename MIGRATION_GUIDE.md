# 🔄 Migration Guide: Supabase → MySQL + JWT

Panduan lengkap migrasi dari Supabase (PostgreSQL + Supabase Auth) ke MySQL + JWT Authentication.

## 📋 Summary Perubahan

### Apa yang Berubah?

| Component | Sebelum (Supabase) | Sesudah (MySQL + JWT) |
|-----------|-------------------|----------------------|
| **Database** | PostgreSQL (Supabase) | MySQL |
| **Authentication** | Supabase Auth | JWT + bcrypt |
| **Storage** | Supabase Storage | Local file system |
| **Email** | Supabase Email | Nodemailer (SMTP) |
| **Dependencies** | `@supabase/supabase-js`, `pg` | `jsonwebtoken`, `bcryptjs`, `mysql2`, `nodemailer` |

### Apa yang Sama?

- ✅ **Express.js** server structure
- ✅ **Prisma ORM** untuk database access
- ✅ **API endpoints** (minimal changes)
- ✅ **Validation** logic
- ✅ **Middleware** architecture
- ✅ **Controller** pattern

---

## 🚀 Step-by-Step Migration

### Step 1: Backup Data (IMPORTANT!)

```bash
# Export data dari Supabase PostgreSQL
pg_dump -h your-supabase-host \
        -U postgres \
        -d postgres \
        --schema=public \
        --data-only \
        --inserts \
        -f backup.sql

# Atau gunakan Supabase dashboard:
# Database > Backups > Create backup
```

### Step 2: Setup MySQL

```bash
# Install MySQL (Windows)
# Download dari: https://dev.mysql.com/downloads/installer/

# Atau gunakan XAMPP/WAMP

# Login MySQL
mysql -u root -p

# Buat database
CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Update Dependencies

**File sudah diupdate!** Tapi jika Anda perlu install dari scratch:

```bash
# Uninstall Supabase dependencies
npm uninstall @supabase/supabase-js @prisma/adapter-pg pg

# Install new dependencies
npm install jsonwebtoken bcryptjs mysql2 nodemailer

# Reinstall Prisma
npm install @prisma/client prisma
```

### Step 4: Update Environment Variables

**OLD `.env` (Supabase):**
```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

**NEW `.env` (MySQL + JWT):**
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/ecommerce"

# JWT
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# App
APP_NAME="E-Commerce Fashion Store"
APP_URL="http://localhost:3000"
PORT=3000
```

**Generate JWT Secrets:**
```bash
# OPTION 1: Gunakan helper script (RECOMMENDED)
node generate-secrets.js

# OPTION 2: Manual dengan Node.js built-in crypto
node -e "console.log('JWT_SECRET=' + require('node:crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('node:crypto').randomBytes(32).toString('hex'))"

# OPTION 3: Dengan OpenSSL (Linux/Mac/Git Bash)
openssl rand -hex 32
```

### Step 5: Update Prisma Schema

Schema sudah diupdate! Changes:

```prisma
// OLD: PostgreSQL
datasource db {
  provider = "postgresql"
}

model Profile {
  id String @id @db.Uuid
  // ...
}

// NEW: MySQL
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Profile {
  id                    String    @id @default(uuid()) @db.Char(36)
  password              String    // NEW: Hashed password
  email_verified        Boolean   @default(false)
  email_verify_token    String?   @unique @db.Char(64)
  password_reset_token  String?   @unique @db.Char(64)
  refresh_token         String?   @db.Text
  // ...
}
```

### Step 6: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Check migration
npx prisma studio
```

### Step 7: Setup Email Service

Lihat: `SETUP_EMAIL_TUTORIAL.md` untuk panduan lengkap.

**Quick setup (Gmail):**

1. Enable 2-Factor Authentication
2. Generate App Password
3. Update `.env`:

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-digit-app-password"
```

### Step 8: Migrate Existing Data (Optional)

Jika Anda punya data di Supabase yang ingin dimigrate:

#### Export Users dari Supabase:

```sql
-- Di Supabase SQL Editor
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  updated_at
FROM auth.users;

-- Export to CSV
```

#### Import ke MySQL:

```javascript
// migrate-users.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUsers() {
  const users = [
    // Copy data dari Supabase
    { email: 'user1@example.com', fullName: 'User 1' },
    { email: 'user2@example.com', fullName: 'User 2' },
  ];

  for (const user of users) {
    // Generate random password (user perlu reset)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.profile.create({
      data: {
        email: user.email,
        password: hashedPassword,
        full_name: user.fullName,
        role: 'user',
        email_verified: false, // User perlu verify ulang
      },
    });

    console.log(`Migrated: ${user.email} (temp password: ${tempPassword})`);
  }
}

migrateUsers()
  .then(() => console.log('Migration complete!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run:
```bash
node migrate-users.js
```

### Step 9: Update Storage (Images)

#### Migrate dari Supabase Storage:

```javascript
// migrate-images.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

async function downloadImages() {
  const { data: files } = await supabase.storage
    .from('products')
    .list();

  for (const file of files) {
    const { data } = await supabase.storage
      .from('products')
      .download(file.name);

    const blob = await data.arrayBuffer();
    const buffer = Buffer.from(blob);

    const localPath = path.join(__dirname, 'uploads', 'products', file.name);
    fs.writeFileSync(localPath, buffer);

    console.log(`Downloaded: ${file.name}`);
  }
}

downloadImages();
```

#### Update Image URLs di Database:

```javascript
// update-image-urls.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateImageUrls() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const oldImages = JSON.parse(product.images);
    
    // Replace Supabase URLs dengan local URLs
    const newImages = oldImages.map(url => {
      const filename = url.split('/').pop();
      return `http://localhost:3000/uploads/products/${filename}`;
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { images: JSON.stringify(newImages) },
    });

    console.log(`Updated product: ${product.name}`);
  }
}

updateImageUrls()
  .then(() => console.log('Image URLs updated!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 10: Test Everything

```bash
# Start server
npm run dev

# Test endpoints:
# 1. Health check
curl http://localhost:3000

# 2. Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","fullName":"Test User"}'

# 3. Sign in
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Get profile (use token from signin)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔧 Code Changes Summary

### 1. Authentication Flow Changes

**OLD (Supabase):**
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({ email, password });

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Get user
const { data: { user } } = await supabase.auth.getUser(token);
```

**NEW (JWT):**
```javascript
// Sign up
const hashedPassword = await bcrypt.hash(password, 10);
const user = await prisma.profile.create({ data: { email, password: hashedPassword } });

// Sign in
const isValid = await bcrypt.compare(password, user.password);
const { accessToken, refreshToken } = generateTokens(user);

// Verify token
const decoded = verifyAccessToken(token);
const user = await prisma.profile.findUnique({ where: { id: decoded.id } });
```

### 2. Middleware Changes

**OLD:**
```javascript
const { data: { user }, error } = await supabase.auth.getUser(token);
req.user = user;
```

**NEW:**
```javascript
const decoded = verifyAccessToken(token);
const user = await prisma.profile.findUnique({ where: { id: decoded.id } });
req.user = user;
```

### 3. Upload Service Changes

**OLD:**
```javascript
await supabaseAdmin.storage.from('bucket').upload(path, buffer);
const { data: { publicUrl } } = supabaseAdmin.storage.from('bucket').getPublicUrl(path);
```

**NEW:**
```javascript
// Multer handles upload automatically
const result = formatUploadResult(req.file, 'products');
// result.publicUrl = "http://localhost:3000/uploads/products/image.jpg"
```

---

## 📊 API Response Changes

### Sign Up Response

**OLD (Supabase):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "..." },
    "session": {
      "access_token": "supabase-jwt",
      "refresh_token": "supabase-refresh"
    }
  }
}
```

**NEW (JWT):**
```json
{
  "success": true,
  "message": "Please check your email to verify your account",
  "data": {
    "user": {
      "id": "uuid",
      "email": "...",
      "emailVerified": false
    }
  }
}
```

### Sign In Response

**OLD:**
```json
{
  "data": {
    "session": {
      "access_token": "...",
      "expires_in": 3600
    }
  }
}
```

**NEW:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "session": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-jwt",
      "expiresIn": 900
    }
  }
}
```

---

## ⚠️ Breaking Changes

### 1. Email Verification Required

**NEW behavior:** Users MUST verify email before full access.

**Migration strategy:**
- Set existing users as verified: 
  ```sql
  UPDATE profiles SET email_verified = true WHERE created_at < NOW();
  ```

### 2. Password Reset Flow

**OLD:** Supabase sends magic link
**NEW:** Backend sends email with token

**Update frontend:**
```javascript
// OLD
const { error } = await supabase.auth.resetPasswordForEmail(email);

// NEW
await fetch('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ email })
});
```

### 3. Token Format

**OLD:** Supabase JWT format
**NEW:** Standard JWT with custom claims

**Update frontend token handling:**
```javascript
// Token structure sama, tapi payload berbeda
// Decode untuk debug: jwt.decode(token)
```

### 4. Image URLs

**OLD:** `https://xxx.supabase.co/storage/v1/object/public/...`
**NEW:** `http://localhost:3000/uploads/products/...`

**Update frontend:**
```javascript
// OLD
<img src={product.image} />

// NEW (no change needed if using relative paths)
<img src={product.image} />
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Database connection failed"

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify DATABASE_URL
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# Test connection
npx prisma db push
```

### Issue 2: "Email not sending"

**Solution:** Check `SETUP_EMAIL_TUTORIAL.md`

Quick fix:
```env
# Use Ethereal for testing
EMAIL_HOST="smtp.ethereal.email"
EMAIL_PORT=587
EMAIL_USER="generated-user@ethereal.email"
EMAIL_PASSWORD="generated-password"
```

### Issue 3: "Invalid JWT secret"

**Solution:**
```bash
# Generate new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
JWT_SECRET="new-secret-here"
JWT_REFRESH_SECRET="new-refresh-secret-here"

# Restart server
```

### Issue 4: "Prisma migration error"

**Solution:**
```bash
# Reset and recreate
npx prisma migrate reset
npx prisma migrate dev --name init

# Or force push (dev only!)
npx prisma db push --force-reset
```

---

## ✅ Post-Migration Checklist

- [ ] MySQL database created and accessible
- [ ] All environment variables configured
- [ ] Prisma migrations run successfully
- [ ] Email service tested and working
- [ ] JWT authentication tested (signup/signin)
- [ ] Email verification flow tested
- [ ] Password reset flow tested
- [ ] File upload tested
- [ ] Existing data migrated (if applicable)
- [ ] Image URLs updated (if applicable)
- [ ] All API endpoints tested
- [ ] Error handling verified
- [ ] Postman collection updated

---

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Prisma with MySQL](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [JWT.io](https://jwt.io/) - Decode & verify tokens
- [Nodemailer Documentation](https://nodemailer.com/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

## 🎉 Congratulations!

Anda telah berhasil migrate dari Supabase ke MySQL + JWT!

### Next Steps:

1. Test semua fitur thoroughly
2. Update frontend untuk compatibility
3. Deploy ke production
4. Monitor email deliverability
5. Setup backup & recovery

**Happy coding! 🚀**
