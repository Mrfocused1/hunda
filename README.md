# 1 HUNDRED - Premium Streetwear E-commerce

A modern, responsive e-commerce website for 1 HUNDRED streetwear brand, built with HTML, CSS, JavaScript, and Supabase.

![1 HUNDRED](hero-image.png)

## 🚀 Live Demo

**Website URL:** [https://www.1hundredornothing.co.uk](https://www.1hundredornothing.co.uk) *(Update with your Vercel URL)*

## ✨ Features

### E-commerce Functionality
- 🛍️ Product catalog with categories (Hoodies, Hats, Tops)
- 🛒 Shopping cart with persistent storage
- 💳 Checkout flow with shipping & payment steps
- ❤️ Wishlist functionality
- 🔍 Product search & filtering
- 📱 Quick view product modal

### Admin Panel
- 📊 Dashboard with sales analytics
- 📝 Product CRUD (Create, Read, Update, Delete)
- 📦 Order management
- 👥 Customer management
- 🖼️ Image upload to cloud storage
- 📧 Email automation settings

### Technical Features
- ☁️ **Supabase Backend** - PostgreSQL database + Storage
- 🔒 **Security** - XSS protection, input sanitization
- 📈 **SEO Optimized** - Meta tags, Open Graph, Twitter Cards
- ♿ **Accessibility** - ARIA labels, semantic HTML
- 📱 **Responsive** - Mobile-first design
- ⚡ **Performance** - Lazy loading, CDN images
- 🔄 **Error Handling** - Global error recovery, toast notifications

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure & semantics |
| Tailwind CSS | Utility-first styling |
| Vanilla JavaScript | Interactivity |
| Supabase | Database & Storage |
| Lucide Icons | Icon library |
| GSAP | Animations (homepage) |
| Vercel | Hosting & Deployment |

## 📁 Project Structure

```
├── index.html          # Homepage
├── shop.html           # Product listing
├── product.html        # Product detail
├── cart.html           # Shopping cart
├── checkout.html       # Checkout flow
├── about.html          # About page
├── login.html          # User login
├── signup.html         # User registration
├── account.html        # User account
├── wishlist.html       # Saved items
├── admin.html          # Admin dashboard
├── admin-login.html    # Admin authentication
├── main.js             # Core functionality
├── admin.js            # Admin panel logic
├── auth.js             # Authentication
├── supabase.js         # Supabase integration
├── styles.css          # Custom styles
└── vercel.json         # Vercel routing rules
```

## 🗄️ Database Schema

### Products Table
```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    price FLOAT NOT NULL,
    category TEXT,
    images TEXT[],
    image TEXT,
    stock INTEGER DEFAULT 0,
    description TEXT,
    sizes TEXT[],
    colors TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 Getting Started

### Prerequisites
- Node.js (for local development)
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/1hundred.git
   cd 1hundred
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run the schema in SQL Editor:
   ```bash
   # Copy contents of supabase_schema.sql into Supabase SQL Editor
   ```

3. Create Storage bucket:
   - Go to Storage → New bucket
   - Name: `product-images`
   - Public: ✅ Enabled

4. Update `supabase.js` with your credentials:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

## 📝 Environment Variables

For local development, create a `.env` file:

```env
# Not required for static hosting, but useful for scripts
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_PASSWORD=your-db-password
```

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Framework preset: **Other**
3. Build command: *(leave empty)*
4. Output directory: *(leave empty)*
5. Click Deploy

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 👤 Admin Access

**Default Admin Credentials:**
- Email: `admin@1hundredornothing.co.uk`
- Password: `admin123`

> ⚠️ **Change these credentials in production!**

## 🔐 Security Features

- ✅ XSS Protection - Input sanitization
- ✅ CSRF Protection - Row Level Security
- ✅ Secure Storage - Images hosted on Supabase CDN
- ✅ HTTPS Only - Enforced on Vercel

## 📊 Performance

- Lighthouse Score: 90+ (Performance)
- Image Optimization: WebP support, lazy loading
- CDN: Supabase Storage + Vercel Edge Network
- Caching: Browser + CDN caching configured

## 🐛 Troubleshooting

### Products not loading?
- Check browser console for errors
- Verify Supabase project is active (not paused)
- Check RLS policies are configured

### Images not uploading?
- Verify `product-images` bucket exists
- Check bucket is public
- Check file size < 5MB
- Check file type (PNG, JPEG, WebP)

### Cart not working?
- Ensure localStorage is enabled
- Check for JavaScript errors in console

## 📄 License

Private - All rights reserved © 2026 1 HUNDRED

## 🤝 Support

For support, email contact@1hundredornothing.co.uk or open an issue.

---

**Built with ❤️ by the 1 HUNDRED team**

*No half measures.*
