# E-Commerce Backend API Documentation

> Fashion Store Backend with Admin & User Roles  
> Built with Express.js, Prisma ORM, Supabase PostgreSQL & Storage  
> Version: 1.0.0 | Last Updated: November 25, 2025

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Endpoints](#api-endpoints)
6. [Product Management (Multiple Images/Carousel)](#product-management)
7. [Postman Testing](#postman-testing)
8. [Setup & Installation](#setup--installation)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

Single fashion store e-commerce backend with:
- **Admin**: Manage products, categories, orders
- **User**: Browse products, shopping cart, checkout, reviews

### Key Features
✅ JWT Authentication (Supabase Auth)  
✅ Role-Based Access Control (admin/user)  
✅ Multiple Image Upload for Product Carousel  
✅ Category Management  
✅ Product Management with Stock Control  
✅ Shopping Cart  
✅ Checkout & Order Management  
✅ Product Reviews & Ratings  
✅ Wishlist  
✅ Auto-create User Profile on Signup  

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js v22.19.0 |
| Framework | Express 5.1.0 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma v7.0.0 |
| Authentication | Supabase Auth (JWT) |
| File Storage | Supabase Storage |
| File Upload | Multer |
| Development | Nodemon |

---

## 🗄 Database Schema

### Tables Overview

```
profiles         → User profiles with roles
categories       → Product categories
products         → Products with images array (carousel)
carts            → Shopping carts
cart_items       → Cart items
addresses        → User addresses
orders           → Orders
order_items      → Order items
reviews          → Product reviews
wishlists        → User wishlists
```

### Key Models

#### Profile
```prisma
model Profile {
  id         String   @id @db.Uuid
  email      String   @unique
  full_name  String?
  phone      String?
  role       UserRole @default(user)  // admin | user
  avatar_url String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

enum UserRole {
  admin
  user
}
```

#### Product
```prisma
model Product {
  id             String   @id @db.Uuid
  name           String
  slug           String   @unique
  description    String   @db.Text
  price          Decimal  @db.Decimal(10, 2)
  discount_price Decimal? @db.Decimal(10, 2)
  stock          Int      @default(0)
  category_id    String   @db.Uuid
  sku            String   @unique
  images         Json     @default("[]")  // Array of URLs for carousel
  sizes          Json     @default("[]")  // ["S", "M", "L", "XL"]
  colors         Json     @default("[]")  // ["Red", "Blue", "Black"]
  weight         Decimal? @db.Decimal(5, 2)
  is_featured    Boolean  @default(false)
  is_active      Boolean  @default(true)
  created_by     String   @db.Uuid
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Sign Up** → Supabase Auth creates user → Backend auto-creates profile with role='user'
2. **Sign In** → Supabase returns JWT access token
3. **API Request** → Include `Authorization: Bearer <token>` header
4. **Middleware** → Verify JWT → Query profile from database → Check role

### Middleware Chain

```javascript
// Admin routes
router.use(authenticate);   // Verify JWT token
router.use(requireAdmin);   // Check role = 'admin'
router.post('/products', ...);

// Public routes (no auth)
router.get('/products', ...);
```

### Role System

| Role | Access |
|------|--------|
| **admin** | Full access to all endpoints |
| **user** | Public endpoints + authenticated user endpoints |
| **public** | Only public endpoints (no auth required) |

### Upgrade User to Admin

**Via Supabase Dashboard:**
1. Dashboard → Table Editor → `profiles`
2. Find user by email
3. Edit `role` column: `user` → `admin`
4. Save (no re-login needed!)

**Via SQL:**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### Auto-Create Profile

Profile auto-created in 3 scenarios:
1. **On signup** - `auth.controller.js` creates profile
2. **On first GET /auth/me** - Auto-creates if missing
3. **On admin endpoint access** - `role.middleware.js` creates profile

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}

Response 201:
{
  "success": true,
  "message": "Sign up successful! Please check your email to verify your account.",
  "data": {
    "user": { "id", "email", "fullName", "emailVerified" },
    "session": { "accessToken", "refreshToken", "expiresIn" }
  }
}
```

#### Sign In
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "user": { "id", "email", "fullName", "emailVerified" },
    "session": { "accessToken", "refreshToken", "expiresIn" }
  }
}
```

#### Get Profile
```http
GET /auth/me
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",  // or "admin"
    "phone": null,
    "avatar_url": null,
    "created_at": "2025-11-25T10:00:00.000Z",
    "updated_at": "2025-11-25T10:00:00.000Z"
  }
}
```

#### Other Auth Endpoints
- `POST /auth/signout` - Logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/reset-password` - Request password reset
- `POST /auth/update-password` - Update password
- `POST /auth/resend-verification` - Resend verification email

---

## 📦 Product Management

### Admin Endpoints

#### Create Product with Multiple Images
```http
POST /api/admin/products
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Form Data:
- name: "Classic White T-Shirt"
- description: "Premium cotton t-shirt"
- price: 199000
- discount_price: 149000 (optional)
- stock: 100
- category_id: "uuid-category"
- sku: "TSH-WHT-001" (unique)
- sizes: ["S", "M", "L", "XL"]  // JSON string
- colors: ["White", "Black", "Grey"]  // JSON string
- weight: 0.2 (optional, in kg)
- is_featured: true
- is_active: true
- images: [File, File, File]  // Max 5 images for carousel

Response 201:
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "Classic White T-Shirt",
    "slug": "classic-white-t-shirt",
    "images": [
      "https://storage.supabase.co/.../img1.jpg",
      "https://storage.supabase.co/.../img2.jpg",
      "https://storage.supabase.co/.../img3.jpg"
    ],
    "price": 199000,
    "discount_price": 149000,
    "stock": 100,
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["White", "Black", "Grey"],
    "category": { "id", "name", "slug" }
  }
}
```

#### Get All Products (Admin)
```http
GET /api/admin/products?page=1&limit=10&search=shirt&category_id=uuid&is_featured=true
Authorization: Bearer <accessToken>

Query Parameters:
- page: 1 (default)
- limit: 10 (default)
- search: search in name, description, SKU
- category_id: filter by category
- is_featured: true/false
- is_active: true/false
- min_price: 100000
- max_price: 500000
- in_stock: true (only products with stock > 0)

Response 200:
{
  "success": true,
  "data": [ /* array of products */ ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Update Product
```http
PUT /api/admin/products/:id
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Form Data (all optional):
- name: "Updated Name"
- price: 249000
- stock: 150
- images: [File, File]  // Add new images
- remove_images: ["url1", "url2"]  // Remove existing images (JSON array)

Response 200:
{
  "success": true,
  "message": "Product updated successfully",
  "data": { /* updated product */ }
}
```

#### Update Stock
```http
PATCH /api/admin/products/:id/stock
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "stock": 200
}

Response 200:
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "stock": 200
  }
}
```

#### Toggle Featured
```http
PATCH /api/admin/products/:id/featured
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "message": "Product featured successfully",
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "is_featured": true
  }
}
```

#### Delete Product
```http
DELETE /api/admin/products/:id
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "message": "Product deleted successfully"
}

Note: Cannot delete if product has orders
      All product images will be deleted from storage
```

### Category Management (Admin)

```http
POST   /api/admin/categories        # Create category
GET    /api/admin/categories        # Get all categories
GET    /api/admin/categories/:id    # Get category by ID
PUT    /api/admin/categories/:id    # Update category
DELETE /api/admin/categories/:id    # Delete category
```

---

## 🌍 Public Endpoints (No Authentication)

### Get All Products (Shop Page)
```http
GET /api/public/products?page=1&limit=12&search=shirt&category_slug=fashion

Query Parameters:
- page: 1
- limit: 12 (recommended for grid)
- search: "shirt"
- category_slug: "fashion" (or category_id)
- min_price: 100000
- max_price: 500000
- is_featured: true
- sort: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest"

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Classic White T-Shirt",
      "slug": "classic-white-t-shirt",
      "images": ["url1", "url2", "url3"],  // Carousel images
      "price": 199000,
      "discount_price": 149000,
      "stock": 100,
      "average_rating": 4.5,
      "review_count": 10,
      "category": { "id", "name", "slug" }
    }
  ],
  "pagination": { /* pagination meta */ }
}
```

### Get Featured Products (Homepage)
```http
GET /api/public/products/featured?limit=8

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Featured Product",
      "images": ["url1", "url2", "url3"],  // For homepage carousel
      "price": 199000,
      "average_rating": 4.8,
      "review_count": 25
    }
  ]
}
```

### Get Product Detail by Slug
```http
GET /api/public/products/:slug
Example: /api/public/products/classic-white-t-shirt

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Classic White T-Shirt",
    "slug": "classic-white-t-shirt",
    "description": "Premium cotton t-shirt with comfortable fit",
    "images": [  // Full carousel images
      "https://storage-url/img1.jpg",
      "https://storage-url/img2.jpg",
      "https://storage-url/img3.jpg"
    ],
    "price": 199000,
    "discount_price": 149000,
    "stock": 100,
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["White", "Black", "Grey"],
    "weight": 0.2,
    "average_rating": 4.5,
    "review_count": 10,
    "category": { /* category info */ },
    "reviews": [  // Latest 10 reviews
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Great product!",
        "created_at": "2025-11-25",
        "profile": {
          "full_name": "John Doe",
          "avatar_url": "url"
        }
      }
    ]
  }
}
```

### Get Related Products
```http
GET /api/public/products/:slug/related?limit=4

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Similar Product",
      "slug": "similar-product",
      "images": ["url1", "url2"],
      "price": 179000
    }
  ]
}
```

---

## 🧪 Postman Testing

### Import Collection

1. **Files to Import:**
   - `E-Commerce API.postman_collection.json`
   - `E-Commerce API.postman_environment.json`

2. **Import Steps:**
   - Open Postman
   - Click "Import" button
   - Drag & drop JSON files or select files
   - Collections & Environment imported!

### Postman Folders

#### 1. Auth (7 endpoints)
- Sign Up (auto-save tokens)
- Sign In (auto-save tokens)
- Get Profile
- Refresh Token
- Reset Password Request
- Resend Verification Email
- Sign Out

#### 2. Admin - Categories (5 endpoints)
- Create Category (auto-save categoryId)
- Get All Categories
- Get Category by ID
- Update Category
- Delete Category

#### 3. Admin - Products (7 endpoints)
- **Create Product with Images** (auto-save productId)
- Get All Products
- Get Product by ID
- Update Product
- Update Stock
- Toggle Featured
- Delete Product

#### 4. Public - Products (4 endpoints)
- Get All Products (Public)
- Get Featured Products
- Get Product by Slug
- Get Related Products

### Environment Variables

Auto-saved variables:
```
baseUrl: http://localhost:3000
accessToken: (saved after login)
refreshToken: (saved after login)
userId: (saved after login)
categoryId: (saved after create category)
productId: (saved after create product)
```

### Testing Flow

#### Step 1: Create User & Login
```
1. POST Sign Up
   - Email, password, fullName
   - ✅ Tokens saved automatically
   
2. POST Sign In
   - Email, password
   - ✅ Tokens refreshed
   
3. GET Get Profile
   - ✅ Check role (should be 'user')
```

#### Step 2: Upgrade to Admin
```
Go to Supabase Dashboard:
- Table Editor → profiles
- Find your email
- Edit role: 'user' → 'admin'
- Save

No need to re-login! Backend checks role from database.
```

#### Step 3: Test Admin Endpoints
```
1. POST Create Category
   - Name, description
   - ✅ categoryId saved
   
2. POST Create Product with Images
   - All product fields
   - Upload 3-5 images
   - Use {{categoryId}}
   - ✅ productId saved
   
3. GET All Products
   - Test filters
   
4. PATCH Update Stock
   - Change stock value
   
5. PATCH Toggle Featured
   - Make product featured
```

#### Step 4: Test Public Endpoints (No Auth!)
```
1. GET All Products (Public)
   - No Authorization header needed
   - ✅ See carousel images
   
2. GET Featured Products
   - For homepage
   
3. GET Product by Slug
   - Full product details
   - Full carousel
   
4. GET Related Products
   - Same category products
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v22.19.0 or higher
- PostgreSQL database (Supabase account)
- Supabase Storage bucket

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/papermintx/e-commerce-backend.git
cd e-commerce-backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Variables**

Create `.env` file:
```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:password@host:port/database?pgbouncer=true

# Storage Buckets
SUPABASE_STORAGE_BUCKET_PRODUCTS=products
SUPABASE_STORAGE_BUCKET_REVIEWS=reviews
SUPABASE_STORAGE_BUCKET_PAYMENTS=payments

# App
APP_URL=http://localhost:3000
```

4. **Setup Database**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

5. **Create Storage Buckets**

Go to Supabase Dashboard → Storage → Create buckets:
- `products` (public)
- `reviews` (public)
- `payments` (private)

Set bucket policy for public access:
```sql
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'products');
```

6. **Start Server**
```bash
# Development
npm run dev

# Production
npm start
```

Server running at: `http://localhost:3000`

---

## 🔧 Troubleshooting

### Problem: Table profiles is empty after signup

**Solution:**
Backend now auto-creates profile! Just hit:
```http
GET /auth/me
Authorization: Bearer <token>
```
Profile will be created automatically with role='user'.

Or run SQL to fix all users:
```sql
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  'user',
  NOW(),
  NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id);
```

### Problem: "Access denied. Required role: admin"

**Cause:** User role is still 'user', not 'admin'

**Solution:**
1. Supabase Dashboard → Table Editor → profiles
2. Find user by email
3. Edit role: 'user' → 'admin'
4. Save (no re-login needed!)

Or via SQL:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Problem: "Failed to upload images"

**Solutions:**
1. ✅ Check bucket exists: Supabase → Storage → `products`
2. ✅ Check bucket is public
3. ✅ Check `.env`: `SUPABASE_STORAGE_BUCKET_PRODUCTS=products`
4. ✅ Check file size < 5MB
5. ✅ Check file type (JPEG, PNG, WebP only)

### Problem: Images not displaying in frontend

**Solutions:**
1. Test image URL in browser (should load)
2. Check bucket policies allow public read
3. Check CORS settings in Supabase
4. Verify image URLs in API response

### Problem: "SKU already exists"

**Cause:** SKU must be unique per product

**Solution:**
Use format: `CAT-COLOR-NUMBER`
- Example: `TSH-WHT-001`, `TSH-BLK-002`, `PNT-BLU-001`

### Problem: Cannot delete product

**Cause:** Product has associated orders

**Solution:**
Instead of deleting, set `is_active = false`:
```http
PUT /api/admin/products/:id
{ "is_active": false }
```
Product will be hidden from users but order history remains.

### Problem: Postman collection import failed

**Solution:**
JSON is now valid! Re-import:
1. Delete old collection in Postman
2. Import fresh `E-Commerce API.postman_collection.json`
3. Import `E-Commerce API.postman_environment.json`
4. Select environment from dropdown

---

## 📚 Additional Resources

### Frontend Integration Examples

#### React Product Card with Carousel
```jsx
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <Swiper
        spaceBetween={10}
        slidesPerView={1}
        pagination={{ clickable: true }}
      >
        {product.images.map((img, index) => (
          <SwiperSlide key={index}>
            <img src={img} alt={product.name} />
          </SwiperSlide>
        ))}
      </Swiper>
      
      <h3>{product.name}</h3>
      
      <div className="prices">
        {product.discount_price ? (
          <>
            <span className="original">Rp {product.price.toLocaleString()}</span>
            <span className="discount">Rp {product.discount_price.toLocaleString()}</span>
          </>
        ) : (
          <span>Rp {product.price.toLocaleString()}</span>
        )}
      </div>
      
      <div className="rating">
        ⭐ {product.average_rating} ({product.review_count} reviews)
      </div>
    </div>
  );
}
```

#### Fetch Products
```javascript
// Get all products
const response = await fetch('http://localhost:3000/api/public/products?limit=12');
const data = await response.json();
const products = data.data;

// Get featured products for homepage
const featured = await fetch('http://localhost:3000/api/public/products/featured?limit=8');
const featuredData = await featured.json();

// Get product detail
const detail = await fetch(`http://localhost:3000/api/public/products/${slug}`);
const productDetail = await detail.json();
```

### Recommended Carousel Libraries

1. **Swiper.js** (https://swiperjs.com)
   - Best for modern React/Next.js
   - Touch/swipe support
   - Auto-play, pagination, navigation

2. **React Slick** (https://react-slick.neostack.com)
   - Classic carousel
   - Responsive
   - Customizable

3. **Embla Carousel** (https://www.embla-carousel.com)
   - Lightweight
   - TypeScript support
   - Framework agnostic

---

## 📊 Project Status

### ✅ Completed Features

- [x] Backend architecture design
- [x] Prisma ORM setup (10 models)
- [x] Database migrations
- [x] Authentication system (Supabase Auth)
- [x] Role-based access control
- [x] Auto-create user profile
- [x] Category management (CRUD)
- [x] Product management with multiple images
- [x] Image upload to Supabase Storage
- [x] Public product endpoints
- [x] Search & filter functionality
- [x] Pagination
- [x] Stock management
- [x] Featured products
- [x] Related products
- [x] Product reviews integration
- [x] Average rating calculation
- [x] Postman collection (updated)

### 🚧 Future Enhancements

- [ ] Shopping cart endpoints
- [ ] Checkout & payment integration
- [ ] Order management
- [ ] Review & rating endpoints
- [ ] Wishlist endpoints
- [ ] User dashboard
- [ ] Admin dashboard analytics
- [ ] Email notifications
- [ ] Inventory management
- [ ] Product variants

---

## 📞 Support

For issues or questions:
- GitHub: https://github.com/papermintx/e-commerce-backend
- Repository: e-commerce-backend
- Branch: master

---

## 📝 License

This project is for educational purposes.

---

**Last Updated:** November 25, 2025  
**Version:** 1.0.0  
**Author:** papermintx

