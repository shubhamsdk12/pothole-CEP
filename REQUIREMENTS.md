# 📋 Technical Requirements - Pothole Detection & Reporting Portal

## 🖥️ System Requirements

### Minimum System Specifications
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or Bun/pnpm equivalent)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for development
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Technology Stack

### Frontend Framework
- **React**: 18.3.1
- **TypeScript**: Latest stable
- **Vite**: Build tool and dev server
- **React Router**: 6.30.1 for routing

### UI Framework & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library with Radix UI primitives
- **Lucide React**: Icon library (0.462.0)
- **next-themes**: Dark/light mode support (0.3.0)

### Backend & Database
- **Supabase**: Backend-as-a-Service (2.57.4)
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - File storage
- **Supabase Client**: JavaScript client library

### State Management & Data Fetching
- **TanStack React Query**: 5.83.0 for server state management
- **React Hook Form**: 7.61.1 for form handling
- **Zod**: 3.25.76 for schema validation

### Development Tools
- **ESLint**: Code linting
- **Lovable Tagger**: Development component tagging

## 📦 Dependencies

### Core Dependencies
```json
{
  "@supabase/supabase-js": "^2.57.4",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "typescript": "latest"
}
```

### UI & Form Libraries
```json
{
  "@radix-ui/react-*": "Various versions",
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0",
  "zod": "^3.25.76",
  "lucide-react": "^0.462.0",
  "next-themes": "^0.3.0"
}
```

### Utility Libraries
```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "date-fns": "^3.6.0",
  "sonner": "^1.7.4"
}
```

## 🔧 Environment Setup

### Required Environment Variables
Create a `.env` file in the project root:

```env
# Supabase Configuration (Auto-generated)
VITE_SUPABASE_URL=https://diymkvqsfwkpksllxerk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Development Configuration
NODE_ENV=development
```

### Database Requirements

#### Supabase Tables
1. **profiles**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `full_name` (TEXT)
   - `avatar_url` (TEXT, Optional)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **pothole_reports**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `title` (TEXT)
   - `description` (TEXT, Optional)
   - `severity` (TEXT: 'low', 'medium', 'high', 'critical')
   - `status` (TEXT: 'reported', 'in_progress', 'completed')
   - `latitude` (NUMERIC)
   - `longitude` (NUMERIC)
   - `address` (TEXT, Optional)
   - `photo_url` (TEXT, Optional)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

#### Storage Buckets
- **pothole-photos**: For storing uploaded images
  - Public read access
  - User-specific upload permissions

#### Row Level Security (RLS)
- All tables must have RLS enabled
- Users can only access their own data
- Public read access for aggregated data (optional)

## 🚀 Installation & Setup

### 1. Clone & Install
```bash
git clone <repository-url>
cd pothole-detection-portal
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Update .env with your Supabase credentials
```

### 3. Database Setup
```bash
# Run Supabase migrations (if using local development)
supabase db reset
supabase db push
```

### 4. Start Development Server
```bash
npm run dev
```

## 🌐 Deployment Requirements

### Production Environment
- **Node.js**: 18.0.0+ production runtime
- **SSL Certificate**: Required for geolocation features
- **Domain**: Custom domain recommended
- **CDN**: For optimal image delivery

### Hosting Platforms (Recommended)
- **Frontend**: Vercel, Netlify, or Lovable Cloud
- **Backend**: Supabase (managed service)
- **Images**: Supabase Storage or Cloudinary

### Environment Variables (Production)
```env
VITE_SUPABASE_URL=<production-supabase-url>
VITE_SUPABASE_ANON_KEY=<production-anon-key>
NODE_ENV=production
```

## 🔒 Security Requirements

### Authentication
- Email/password authentication via Supabase Auth
- Session persistence in localStorage
- Auto token refresh enabled

### Data Protection
- Row Level Security (RLS) on all tables
- User data isolation
- Secure file upload validation

### Privacy Compliance
- Location data consent
- Photo upload permissions
- Data retention policies

## 📱 Feature Requirements

### Core Features
- ✅ User registration and authentication
- ✅ Photo capture with camera/file upload
- ✅ GPS location detection
- ✅ Pothole severity classification
- ✅ Report submission and tracking
- ✅ User dashboard with report history

### Browser Permissions Required
- **Camera Access**: For photo capture
- **Location Access**: For GPS coordinates
- **Storage Access**: For offline functionality (future)

## 🧪 Testing Requirements

### Testing Framework (Future Implementation)
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright or Cypress
- **Component Tests**: Storybook (recommended)

### Performance Requirements
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 3 seconds
- **Mobile Performance**: Lighthouse score > 90

## 📊 Monitoring & Analytics

### Recommended Integrations
- **Error Tracking**: Sentry or LogRocket
- **Analytics**: Google Analytics 4 or Mixpanel
- **Performance**: Vercel Analytics or Web Vitals
- **Uptime**: Pingdom or UptimeRobot

## 🔄 Version Control

### Git Workflow
- **Main Branch**: Production-ready code
- **Development**: Feature integration
- **Feature Branches**: Individual feature development

### Commit Standards
- Conventional Commits format
- Automated changelog generation
- Semantic versioning

---

*Last Updated: 2024-09-29*
*Version: 1.0.0*