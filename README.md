# Youth Organization CMS

A production-ready, fully dynamic content management system for youth organizations with role-based access, dynamic theming, and real-time updates.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + ShadCN UI
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Hosting**: Vercel/Netlify (frontend) + Supabase (backend)

## Features

### Core Functionality
✅ Multi-tenant organization management
✅ Role-based access control (Admin, Organization, Public)
✅ Program management with file attachments
✅ Announcement system with real-time updates
✅ Homepage carousel manager
✅ Dynamic color palette system (77 color variations)
✅ File upload and storage
✅ PDF generation capabilities

### Security
✅ Row Level Security on all database tables
✅ Secure authentication with session management
✅ CORS configuration
✅ Security headers (CSP, XSS protection, etc.)
✅ Input validation and sanitization

### Performance
✅ Code splitting and lazy loading
✅ Optimized bundle size
✅ Loading skeletons for better UX
✅ Error boundaries for graceful error handling
✅ CSS variable-based theming for instant updates

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd youth-organization-cms

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your Supabase credentials
# Get these from: Supabase Dashboard > Settings > API
```

### Environment Variables

Create a `.env` file with:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Youth Organization CMS
VITE_APP_URL=http://localhost:5173
```

### Database Setup

1. Create a Supabase project
2. Run the migration in `supabase/migrations/20251209150958_create_core_schema.sql`
3. Create storage bucket: `public-assets`
4. Upload default color palette to: `public-assets/config/color-palette.json`

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Documentation

### Setup & Architecture
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions and architecture
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete database schema and RLS policies
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Frontend patterns and structure

### Features & Components
- [COMPONENTS_GUIDE.md](./COMPONENTS_GUIDE.md) - Reusable UI components library
- [SUPABASE_OPERATIONS.md](./SUPABASE_OPERATIONS.md) - Data operations and queries
- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - Authentication and authorization flows
- [PALETTE_GUIDE.md](./PALETTE_GUIDE.md) - Dynamic color palette system
- [PALETTE_EXAMPLES.md](./PALETTE_EXAMPLES.md) - Color palette usage examples

### Deployment
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment guide
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── features/       # Feature-specific components
│   ├── layouts/        # Layout components
│   └── ui/             # Base UI components (Button, Input, etc.)
├── contexts/           # React contexts (Auth, Theme, Palette)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Route pages
│   ├── admin/         # Admin-only pages
│   └── organization/  # Organization-user pages
├── services/           # API and business logic
├── store/              # State management
└── types/              # TypeScript type definitions
```

## User Roles

### Admin
- Full system access
- Manage all organizations
- Create/edit/delete any content
- Access admin dashboard
- Manage global color palette

### Organization
- Manage own organization's content
- Create/edit/archive programs
- Create/edit announcements
- Manage homepage carousel
- View organization analytics

### Public
- View public pages
- View approved programs
- Read announcements
- No authentication required

## Deployment

### Vercel

```bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration
# Push to main branch for automatic deployment
```

### Netlify

```bash
# Deploy to Netlify
netlify deploy --prod

# Or use GitHub integration
# Connect repository for automatic deployment
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Project Status

### Completed Sections

✅ **Section 1**: Tech Stack Setup
- React 18 + TypeScript + Vite
- TailwindCSS + ShadCN UI
- Supabase integration

✅ **Section 2**: Database Schema
- Complete PostgreSQL schema
- Row Level Security policies
- Migrations and indexes

✅ **Section 3**: Frontend Architecture
- Component structure
- Routing configuration
- State management patterns

✅ **Section 4**: Reusable UI Components
- Base components (Button, Input, Card, etc.)
- Form components
- Layout components
- Feature components

✅ **Section 5**: Supabase Data Operations
- CRUD operations
- Real-time subscriptions
- File upload/download
- PDF generation

✅ **Section 6**: Authentication & Authorization
- User registration/login
- Role-based access control
- Protected routes
- Session management

✅ **Section 7**: Dynamic Color Palette
- JSON-based color configuration
- 77 color variations (7 colors × 11 shades)
- CSS variable injection
- Admin management interface
- Runtime updates without reload

✅ **Section 8**: Production Deployment
- Deployment configurations
- SEO optimization
- Loading states and skeletons
- Error boundaries
- Security headers
- Performance optimization

## Production Checklist

Before deploying to production:

- [ ] Update environment variables
- [ ] Apply database migrations
- [ ] Configure RLS policies
- [ ] Upload default color palette
- [ ] Test authentication flows
- [ ] Verify role-based access
- [ ] Test all CRUD operations
- [ ] Configure custom domain
- [ ] Enable SSL/HTTPS
- [ ] Set up error monitoring
- [ ] Configure analytics
- [ ] Review security headers
- [ ] Run performance audit
- [ ] Test across browsers
- [ ] Verify mobile responsiveness

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for complete checklist.

## Security

### Best Practices Implemented
- Row Level Security on all tables
- Secure authentication with Supabase Auth
- CORS configuration
- CSP headers
- XSS protection
- CSRF protection
- Input validation
- SQL injection prevention
- Session management
- Secure file uploads

### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content Security Policy (CSP)

## Performance

### Optimizations
- Code splitting with React.lazy
- Route-based lazy loading
- Optimized bundle size
- Image optimization
- CSS variable-based theming
- Efficient database queries
- Connection pooling
- Caching strategies

### Monitoring
- Error tracking ready (Sentry integration available)
- Performance monitoring
- Analytics integration
- Supabase metrics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions:
- Check documentation in the `/docs` folder
- Review troubleshooting section in DEPLOYMENT_GUIDE.md
- Open an issue on GitHub
- Contact: [your-email@domain.com]

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [ShadCN UI](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Ready for Production** 🚀

This project is production-ready with comprehensive security, performance optimizations, and deployment configurations for Vercel and Netlify.
