# Neill Planner - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)

---

## First-Time Setup

### 1. Firebase Project Initialization

If not already done, initialize Firebase in this project:

```bash
# Login to Firebase
firebase login

# Initialize Firebase project (if needed)
firebase init

# Select:
# - Firestore (Database rules and indexes)
# - Hosting (optional, for deployment)
```

### 2. Environment Configuration

Ensure your `.env.local` file has the correct Firebase credentials:

```bash
# Copy example if needed
cp .env.example .env.local

# Edit .env.local with your Firebase project credentials
# Get these from Firebase Console > Project Settings > General
```

**Important:** Never commit `.env.local` to version control!

---

## Deploy Security Rules

### Step 1: Review Firestore Rules

Review the security rules before deployment:

```bash
# View the rules file
cat firestore.rules
```

The rules enforce:
- Authentication required for all operations
- Users can only access their own data
- Server-side validation of data formats
- Protection against unauthorized modifications

### Step 2: Deploy to Firebase

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy rules and indexes together
firebase deploy --only firestore
```

### Step 3: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Verify the rules are showing correctly
5. Check the "Published" timestamp

---

## Deploy Firestore Indexes

### Why Indexes Matter

The application uses compound queries that require composite indexes:

```typescript
// This query needs an index on: userId, scheduledDate, deletedAt, priority.letter, priority.number
where('userId', '==', userId)
where('scheduledDate', '>=', startDate)
where('scheduledDate', '<=', endDate)
where('deletedAt', '==', null)
orderBy('scheduledDate')
orderBy('priority.letter')
orderBy('priority.number')
```

### Deploy Indexes

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### Alternative: Auto-Create Indexes

If you prefer, Firebase will prompt you to create indexes when you first run queries:

1. Run the app in development
2. Perform queries that need indexes
3. Firebase Console will show "Create Index" prompts
4. Click the prompts to automatically create needed indexes

---

## Testing Security Rules

### Using Firebase Emulator (Recommended)

Test your rules locally before deploying:

```bash
# Install emulator if needed
firebase init emulators

# Start emulator
firebase emulators:start

# In another terminal, run your app pointing to emulator
# Update firebase config to use emulator in development
```

### Manual Testing Checklist

After deploying rules, manually verify:

- [ ] Users can create tasks with their own userId
- [ ] Users CANNOT create tasks with another user's userId
- [ ] Users can read only their own tasks
- [ ] Users CANNOT read other users' tasks
- [ ] Invalid data (missing fields, wrong types) is rejected
- [ ] Unauthenticated requests are rejected

---

## Deploy Application to Firebase Hosting (Optional)

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates optimized files in the `dist/` directory.

### Step 2: Deploy to Firebase Hosting

```bash
# Deploy hosting only
firebase deploy --only hosting

# Or deploy everything (rules + hosting)
firebase deploy
```

### Step 3: Access Your App

After deployment, Firebase will provide a URL:

```
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
```

---

## Environment-Specific Deployments

### Development Environment

```bash
# Use .env.local for development
npm run dev
```

### Staging Environment

```bash
# Create .env.staging with staging Firebase project credentials
# Use staging Firebase project
firebase use staging
firebase deploy
```

### Production Environment

```bash
# Create .env.production with production Firebase project credentials
# Use production Firebase project
firebase use production
firebase deploy
```

---

## Post-Deployment Verification

### 1. Test Authentication

- [ ] Google Sign-In works
- [ ] User profile is created on first login
- [ ] Default settings are created for new users

### 2. Test Task Operations

- [ ] Create task
- [ ] Read tasks by date
- [ ] Update task (priority, status, etc.)
- [ ] Soft delete task
- [ ] Restore task

### 3. Test Category Operations

- [ ] Create category
- [ ] Read categories
- [ ] Update category
- [ ] Delete category
- [ ] Duplicate name validation

### 4. Test Security

- [ ] Try accessing another user's data (should fail)
- [ ] Try creating invalid data (should fail)
- [ ] Try unauthenticated access (should fail)

---

## Monitoring & Maintenance

### Firebase Console Monitoring

Monitor your app at [Firebase Console](https://console.firebase.google.com):

1. **Firestore Usage**
   - Navigate to **Firestore Database**
   - Check document counts, read/write operations
   - Monitor costs

2. **Authentication**
   - Navigate to **Authentication**
   - View active users, sign-in methods
   - Monitor authentication errors

3. **Performance**
   - Navigate to **Performance Monitoring** (if enabled)
   - View load times, network requests

### Set Up Alerts

Configure alerts for:
- High Firestore usage (approaching quota)
- Authentication failures
- Error rates

---

## Troubleshooting

### Issue: "Permission Denied" Errors

**Cause:** Security rules are rejecting the request

**Solutions:**
1. Check Firebase Console > Firestore > Rules tab
2. Verify rules are deployed: Look for recent "Published" timestamp
3. Check browser console for detailed error messages
4. Verify user is authenticated: `firebase.auth().currentUser`

### Issue: "Index Not Found" Errors

**Cause:** Missing composite index for complex query

**Solutions:**
1. Click the error link to auto-create index
2. Wait 2-5 minutes for index to build
3. Or manually deploy: `firebase deploy --only firestore:indexes`

### Issue: Rules Not Updating

**Cause:** Browser caching or deployment didn't complete

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Redeploy rules: `firebase deploy --only firestore:rules`
3. Check Firebase Console for deployment status

### Issue: Validation Errors on Valid Data

**Cause:** Mismatch between client validation and server rules

**Solutions:**
1. Check error message for specific field/requirement
2. Verify data format matches rules (e.g., string lengths, types)
3. Check that timestamps are properly formatted

---

## Security Best Practices

### 1. Credential Management

- ✅ Never commit `.env.local` to git
- ✅ Use different Firebase projects for dev/staging/prod
- ✅ Rotate API keys if exposed
- ✅ Restrict API key usage in Google Cloud Console

### 2. Firestore Rules

- ✅ Always require authentication
- ✅ Validate userId matches authenticated user
- ✅ Validate data types and formats server-side
- ✅ Use default deny-all rules

### 3. Monitoring

- ✅ Enable Firebase Analytics
- ✅ Set up cost alerts
- ✅ Monitor error rates
- ✅ Review security rules regularly

---

## Rollback Plan

If issues arise after deployment:

### Rollback Security Rules

```bash
# Get previous rule versions from Firebase Console
# Firestore > Rules > "View History"
# Copy previous version and redeploy
firebase deploy --only firestore:rules
```

### Rollback Application

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and redeploy
npm run build
firebase deploy --only hosting
```

---

## Performance Optimization

### Enable Firebase Performance Monitoring

```bash
npm install firebase
```

Add to your app:
```typescript
import { initializePerformance } from 'firebase/performance';
const perf = initializePerformance(app);
```

### Enable Firebase App Check

Protect against abuse:

```bash
firebase appcheck
```

Follow prompts to configure App Check for web.

---

## Cost Optimization

### Firestore Pricing

Monitor these metrics:
- **Document Reads:** $0.06 per 100K documents
- **Document Writes:** $0.18 per 100K documents
- **Document Deletes:** $0.02 per 100K documents
- **Storage:** $0.18 per GB/month

### Optimization Tips

1. **Pagination:** Limit query results to reduce reads
2. **Caching:** Cache frequently accessed data (categories)
3. **Batch Operations:** Use batch writes to reduce costs
4. **Cleanup:** Delete old soft-deleted tasks periodically

---

## Support Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firestore Rules Guide:** https://firebase.google.com/docs/firestore/security/get-started
- **Firebase Console:** https://console.firebase.google.com
- **Firebase Status:** https://status.firebase.google.com

---

## Checklist: Ready for Production?

Before going live, ensure:

- [ ] Security rules deployed and tested
- [ ] Composite indexes created
- [ ] Environment variables configured correctly
- [ ] Authentication flow tested
- [ ] All CRUD operations tested
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Monitoring set up
- [ ] Cost alerts configured
- [ ] Backup/rollback plan documented
- [ ] Team trained on monitoring tools

---

**Your application is now ready for deployment!**

For questions or issues, refer to the [Backend Review Summary](./BACKEND_REVIEW_SUMMARY.md) for detailed technical information.
