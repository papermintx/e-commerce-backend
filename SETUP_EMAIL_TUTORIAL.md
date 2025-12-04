# 📧 Tutorial Setup Email Service

## 🎯 Pilihan Email Service

Berikut pilihan email service yang bisa Anda gunakan:

| Service | Free Tier | Cocok Untuk | Tingkat Kesulitan |
|---------|-----------|-------------|-------------------|
| **Gmail** | 500 email/hari | Development & Production | ⭐ Mudah |
| **Ethereal** | Unlimited (fake) | Development Only | ⭐ Sangat Mudah |
| **Brevo** | 300 email/hari | Production | ⭐⭐ Sedang |
| **Mailgun** | 5000 email/bulan | Production | ⭐⭐⭐ Advanced |

---

## 1️⃣ Gmail SMTP (Recommended untuk Testing)

### Setup Gmail App Password

#### Step 1: Enable 2-Factor Authentication

1. Buka: https://myaccount.google.com/security
2. Klik **"2-Step Verification"**
3. Ikuti langkah-langkah untuk mengaktifkan 2FA

#### Step 2: Generate App Password

1. Masih di halaman Security
2. Scroll ke bawah, klik **"App passwords"**
   - Jika tidak muncul, pastikan 2FA sudah aktif
3. Select App: **"Mail"**
4. Select Device: **"Other (Custom name)"**
5. Ketik: **"E-Commerce Backend"**
6. Klik **"Generate"**
7. **COPY** 16-digit password yang muncul (contoh: `abcd efgh ijkl mnop`)

#### Step 3: Configure .env

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="abcd efgh ijkl mnop"  # App password (tanpa spasi)
EMAIL_FROM="your-email@gmail.com"
```

#### ⚠️ Important Notes:

- ✅ Gunakan **App Password**, BUKAN password Gmail biasa
- ✅ Hapus semua spasi dari App Password
- ✅ Limit: **500 emails per hari**
- ✅ Cocok untuk development dan production kecil-menengah

#### Testing:

```bash
# Start server
npm run dev

# Server akan otomatis verify email configuration
# Jika berhasil: ✅ Email server is ready to send messages
# Jika gagal: ❌ Email server connection failed
```

---

## 2️⃣ Ethereal Email (Development Only)

**PALING MUDAH** - Tanpa registrasi, instant setup!

### Setup Ethereal

#### Step 1: Generate Credentials

Buka terminal dan jalankan:

```bash
node -e "
const nodemailer = require('nodemailer');
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed:', err);
    return;
  }
  console.log('Copy konfigurasi ini ke .env:\\n');
  console.log('EMAIL_HOST=\"' + account.smtp.host + '\"');
  console.log('EMAIL_PORT=' + account.smtp.port);
  console.log('EMAIL_SECURE=' + account.smtp.secure);
  console.log('EMAIL_USER=\"' + account.user + '\"');
  console.log('EMAIL_PASSWORD=\"' + account.pass + '\"');
  console.log('EMAIL_FROM=\"' + account.user + '\"');
  console.log('\\n📧 View emails at: https://ethereal.email/messages');
});
"
```

ATAU manual di: https://ethereal.email/create

#### Step 2: Configure .env

```env
EMAIL_HOST="smtp.ethereal.email"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="generated-username@ethereal.email"
EMAIL_PASSWORD="generated-password"
EMAIL_FROM="generated-username@ethereal.email"
```

#### Step 3: View Emails

1. Buka: https://ethereal.email/login
2. Login dengan credentials yang sama
3. Semua email akan muncul di inbox Ethereal

#### ⚠️ Important Notes:

- ✅ **TIDAK** mengirim email sungguhan
- ✅ Unlimited emails
- ✅ Perfect untuk development/testing
- ❌ **JANGAN** gunakan untuk production!

---

## 3️⃣ Brevo (Sendinblue) - Production Ready

### Setup Brevo

#### Step 1: Create Account

1. Sign up: https://www.brevo.com/
2. Verify email address
3. Complete onboarding

#### Step 2: Get SMTP Credentials

1. Login ke Brevo dashboard
2. Go to: **Settings > SMTP & API**
3. Click **"Show My SMTP Credentials"**
4. Copy:
   - SMTP Server
   - Port
   - Login (your email)
   - SMTP Key (password)

#### Step 3: Configure .env

```env
EMAIL_HOST="smtp-relay.brevo.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-brevo-smtp-key"
EMAIL_FROM="your-email@example.com"
```

#### ⚠️ Important Notes:

- ✅ **300 emails per hari** (Free tier)
- ✅ Production-ready
- ✅ Good deliverability
- ✅ Real-time analytics
- ⚠️ Perlu verify sender email

---

## 4️⃣ Mailgun - High Volume

### Setup Mailgun

#### Step 1: Create Account

1. Sign up: https://www.mailgun.com/
2. Verify email
3. Add domain atau gunakan sandbox domain

#### Step 2: Get SMTP Credentials

1. Go to: **Sending > Domain Settings**
2. Select your domain
3. Click **"SMTP credentials"**
4. Copy credentials

#### Step 3: Configure .env

```env
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="postmaster@your-domain.mailgun.org"
EMAIL_PASSWORD="your-mailgun-smtp-password"
EMAIL_FROM="noreply@your-domain.mailgun.org"
```

#### ⚠️ Important Notes:

- ✅ **5000 emails per bulan** (Free tier)
- ✅ Enterprise-grade
- ✅ Advanced features
- ⚠️ Perlu setup custom domain untuk production
- ⚠️ Sandbox domain: hanya bisa kirim ke verified emails

---

## 🧪 Testing Email Configuration

### Test 1: Server Startup

```bash
npm run dev

# Output yang diharapkan:
# ==================================================
# 🚀 E-Commerce API Server
# 📍 Running on: http://localhost:3000
# ✅ Email server is ready to send messages
# ==================================================
```

### Test 2: Sign Up & Email Verification

```bash
# Gunakan Postman atau curl:
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Response:
# {
#   "success": true,
#   "message": "Sign up successful! Please check your email..."
# }
```

**Check Your Email:**
- Gmail: Check inbox
- Ethereal: Login ke https://ethereal.email
- Brevo: Check email atau dashboard > Logs

### Test 3: Password Reset

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## 🔍 Troubleshooting

### ❌ Error: "Invalid login"

**Penyebab:**
- Email atau password salah
- Gmail: menggunakan password biasa, bukan App Password

**Solusi:**
1. Gmail: Generate App Password baru
2. Ethereal: Generate credentials baru
3. Double-check EMAIL_USER dan EMAIL_PASSWORD

### ❌ Error: "Connection timeout"

**Penyebab:**
- Port diblock oleh firewall
- ISP memblock SMTP port

**Solusi:**
```env
# Try port 2525 (alternative SMTP port)
EMAIL_PORT=2525

# Atau gunakan SSL (port 465)
EMAIL_PORT=465
EMAIL_SECURE=true
```

### ❌ Error: "self signed certificate"

**Solusi:**
```env
# Disable SSL verification (development only!)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

⚠️ **JANGAN** gunakan ini di production!

### ❌ Email masuk ke Spam

**Solusi:**
1. Verify sender domain di email provider
2. Add SPF/DKIM records
3. Gunakan reputable email service (Brevo/Mailgun)
4. Test dengan https://www.mail-tester.com/

---

## 📊 Comparison Table

| Fitur | Gmail | Ethereal | Brevo | Mailgun |
|-------|-------|----------|-------|---------|
| Setup Time | 5 min | 1 min | 10 min | 15 min |
| Free Limit | 500/day | Unlimited | 300/day | 5000/month |
| Real Delivery | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Production Ready | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ | ✅ Required |
| Deliverability | ⭐⭐⭐ | N/A | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Rekomendasi

### Untuk Development:
1. **Ethereal** - Paling mudah, instant
2. **Gmail** - Jika perlu email sungguhan

### Untuk Production:
1. **Brevo** - Balanced (free tier bagus)
2. **Mailgun** - High volume, advanced features
3. **Gmail** - Small business, simple setup

---

## 📝 Complete .env Example

```env
# ==============================================
# EMAIL CONFIGURATION
# ==============================================

# OPTION 1: GMAIL (Development/Small Production)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-digit-app-password"
EMAIL_FROM="Your Store <your-email@gmail.com>"

# OPTION 2: ETHEREAL (Development Only)
# EMAIL_HOST="smtp.ethereal.email"
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER="generated-username@ethereal.email"
# EMAIL_PASSWORD="generated-password"
# EMAIL_FROM="generated-username@ethereal.email"

# OPTION 3: BREVO (Production)
# EMAIL_HOST="smtp-relay.brevo.com"
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER="your-email@example.com"
# EMAIL_PASSWORD="your-brevo-smtp-key"
# EMAIL_FROM="Your Store <noreply@yourdomain.com>"

# OPTION 4: MAILGUN (Production, High Volume)
# EMAIL_HOST="smtp.mailgun.org"
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER="postmaster@your-domain.mailgun.org"
# EMAIL_PASSWORD="your-mailgun-password"
# EMAIL_FROM="Your Store <noreply@yourdomain.com>"

# Application Info (used in emails)
APP_NAME="E-Commerce Fashion Store"
APP_URL="http://localhost:3000"
```

---

## ✅ Checklist

Sebelum production, pastikan:

- [ ] Email provider dipilih dan configured
- [ ] Test signup & verification email
- [ ] Test password reset email
- [ ] Email tidak masuk spam
- [ ] Sender name dan email correct
- [ ] APP_NAME dan APP_URL updated
- [ ] Email templates reviewed
- [ ] Backup credentials disimpan aman

---

**Selamat! Email service Anda siap digunakan! 🎉**

Jika ada pertanyaan, check troubleshooting section atau buka issue di repository.
