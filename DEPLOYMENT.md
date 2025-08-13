# Recipe App Deployment Guide

## ✅ Ready for Deployment!

Your recipe management app is now fully migrated to Supabase and ready for hosting on any modern platform.

## 🚀 Recommended Deployment Platforms

### **1. Vercel (Recommended)**
- **Best for**: Next.js apps (built by Next.js team)
- **Deploy**: Connect GitHub repo → Auto-deploy
- **Cost**: Free tier available

### **2. Netlify** 
- **Best for**: Static sites and serverless functions
- **Deploy**: Drag & drop or GitHub integration
- **Cost**: Free tier available

### **3. Railway**
- **Best for**: Full-stack apps with databases
- **Deploy**: GitHub integration
- **Cost**: Affordable hosting

## 📋 Pre-Deployment Checklist

### Environment Variables
Make sure to set these in your hosting platform:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# NextAuth
NEXTAUTH_SECRET="production-secret-key-here"
NEXTAUTH_URL="https://your-app-domain.com"

# OpenAI (for chat feature)
OPENAI_API_KEY="your_openai_api_key"
```

### Build Test
```bash
npm run build
```

## 🎯 Quick Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select your repository
   - Add environment variables
   - Deploy!

## 🔧 Configuration Notes

### Supabase Setup
- ✅ Database schema already created
- ✅ Row Level Security enabled
- ✅ All tables and relationships configured

### NextAuth Configuration
- Update `NEXTAUTH_URL` to your production domain
- Generate new `NEXTAUTH_SECRET` for production:
  ```bash
  openssl rand -base64 32
  ```

### Domain Setup
- Update CORS settings in Supabase dashboard
- Add your domain to allowed origins

## 🎉 Post-Deployment

### Test Functionality
1. ✅ User registration/login
2. ✅ Recipe creation/editing
3. ✅ Tag system and filtering
4. ✅ Search functionality  
5. ✅ AI chat assistant

### Performance Optimization
- Enable Edge Runtime for API routes
- Configure CDN for static assets
- Set up monitoring and analytics

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard for database connectivity
2. Verify all environment variables are set
3. Check deployment logs for errors
4. Test locally with production environment variables

Your app is production-ready! 🚀