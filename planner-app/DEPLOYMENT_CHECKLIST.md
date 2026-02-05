# Deployment Checklist

This document provides a comprehensive checklist for deploying Neill Planner to production.

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Create production Firebase project
- [ ] Configure Firebase Authentication (enable Google sign-in)
- [ ] Set up Firestore database with security rules
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Configure Google Calendar API in Google Cloud Console
- [ ] Create OAuth 2.0 credentials for production domain
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all production environment variables
- [ ] Verify all API keys and credentials are correct

### 2. Code Quality

- [ ] All unit tests passing: `npm run test:run`
- [ ] All E2E tests passing: `npm run test:e2e`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Code formatted: `npm run format`
- [ ] No console errors in development
- [ ] No TypeScript errors
- [ ] Build succeeds: `npm run build`

### 3. Feature Verification

- [ ] Authentication works (Google sign-in)
- [ ] Task CRUD operations work
- [ ] Priority system functions correctly
- [ ] Status cycling works (in_progress → complete → forward → delegate → delete)
- [ ] Drag and drop reordering works
- [ ] Search functionality works
- [ ] Filters work (status, category, priority)
- [ ] Notes system works (TipTap editor)
- [ ] Reminders trigger correctly
- [ ] Google Calendar sync works
- [ ] Offline mode works (IndexedDB sync)
- [ ] Theme switching works (light/dark)
- [ ] Settings persist across sessions
- [ ] Responsive design works on mobile

### 4. Security

- [ ] Firestore security rules prevent unauthorized access
- [ ] All queries include user ID for authorization
- [ ] No sensitive data in client-side code
- [ ] Environment variables not committed to git
- [ ] API keys restricted to authorized domains
- [ ] CORS configured correctly
- [ ] Firebase App Check enabled (optional but recommended)

### 5. Performance

- [ ] Bundle size is reasonable (check with `npm run build`)
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] No memory leaks (check with React DevTools Profiler)
- [ ] Lighthouse score > 90 for Performance, Accessibility, Best Practices, SEO

### 6. Hosting Configuration

#### Option A: Vercel Deployment

- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Link project: `vercel link`
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure custom domain (if applicable)
- [ ] Deploy: `vercel --prod`
- [ ] Verify deployment at provided URL

#### Option B: Firebase Hosting

- [ ] Install Firebase CLI: `npm i -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Initialize hosting: `firebase init hosting`
- [ ] Configure `firebase.json` (already configured)
- [ ] Build project: `npm run build`
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Verify deployment at provided URL

### 7. Post-Deployment Verification

- [ ] Production URL loads correctly
- [ ] Authentication works in production
- [ ] All features work in production
- [ ] No console errors in production
- [ ] SSL certificate is valid (HTTPS)
- [ ] Custom domain configured (if applicable)
- [ ] Analytics working (if enabled)
- [ ] Error reporting working (if configured)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### 8. Monitoring & Maintenance

- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up Firebase usage alerts
- [ ] Monitor Firebase quotas (reads/writes/storage)
- [ ] Set up GitHub Actions for CI/CD
- [ ] Configure automated testing on PR
- [ ] Set up staging environment for testing

## Deployment Commands

### Local Testing
```bash
# Run development server
npm run dev

# Run tests
npm run test:run
npm run test:e2e

# Build for production
npm run build

# Preview production build
npm run preview
```

### Vercel Deployment
```bash
# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls
```

### Firebase Deployment
```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes
```

## Environment Variables Reference

Required environment variables for production:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
```

See `.env.production.example` for full list and descriptions.

## Rollback Plan

If deployment fails or issues are discovered:

1. **Vercel**: Use Vercel dashboard to rollback to previous deployment
2. **Firebase Hosting**: Revert to previous version with `firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID`
3. **Git**: Revert commit and redeploy

## Support Contacts

- Firebase Support: https://firebase.google.com/support
- Vercel Support: https://vercel.com/support
- Google Calendar API: https://developers.google.com/calendar/support

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Production Build](https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks)
