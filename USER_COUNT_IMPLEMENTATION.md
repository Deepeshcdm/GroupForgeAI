# User Count Management Implementation

## Overview
Implemented a complete system to manage and display the total user count from the Firebase `meta` collection in the Faculty Dashboard. The system automatically increments the count on user registration and decrements it on user deletion.

## Files Created/Modified

### 1. **New Service: `src/services/metaService.ts`**
   - `getUserCount()` - Fetches the user count from `meta.stats.usercount`
   - `incrementUserCount()` - Increments the user count by 1 (called on new user registration)
   - `decrementUserCount()` - Decrements the user count by 1 (called on user deletion)
   - `initializeMetaIfNeeded()` - Initializes the meta collection if it doesn't exist

### 2. **New Service: `src/services/userManagement.ts`**
   - `deleteUserAndUpdateCount(userId)` - Deletes a single user and decrements the count
   - `deleteMultipleUsersAndUpdateCount(userIds)` - Deletes multiple users and updates count accordingly

### 3. **Updated: `src/contexts/AuthContext.tsx`**
   - Imported `incrementUserCount` from metaService
   - Updated `signInWithGoogle()` - Increments user count when new user registers via Google
   - Updated `signInWithGitHub()` - Increments user count when new user registers via GitHub
   - Updated `signUpWithEmail()` - Increments user count when new user registers via email

### 4. **Updated: `src/pages/DashboardPage.tsx`**
   - Imported `getUserCount` from metaService
   - Modified `FacultyDashboard()` to fetch total students from meta collection instead of calculating from groups
   - The dashboard now displays `stats.totalStudents` from `meta.stats.usercount`

### 5. **Updated: `src/services/index.ts`**
   - Exported all new services for use throughout the application

## Database Structure

### Meta Collection
```javascript
{
  "meta": {
    "stats": {
      "usercount": 0 // Increment/decrement on user registration/deletion
    }
  }
}
```

## Usage Examples

### Display User Count in Faculty Dashboard
```typescript
// Already implemented in FacultyDashboard
const metaTotalStudents = await getUserCount();
```

### When User Registers
```typescript
// Called automatically in AuthContext sign-up methods
await incrementUserCount();
```

### When User is Deleted
```typescript
// Use this in admin/user management panels
import { deleteUserAndUpdateCount } from '../services/userManagement';
await deleteUserAndUpdateCount(userId);

// Or for batch deletion
import { deleteMultipleUsersAndUpdateCount } from '../services/userManagement';
await deleteMultipleUsersAndUpdateCount([userId1, userId2, userId3]);
```

## Flow Diagram

```
User Registration
    ↓
SignUp (Email/Google/GitHub)
    ↓
createUserProfile()
    ↓
incrementUserCount() → meta.stats.usercount++
    ↓
Faculty Dashboard displays updated count

User Deletion
    ↓
deleteUserAndUpdateCount(userId)
    ↓
deleteDoc(users/{userId})
    ↓
decrementUserCount() → meta.stats.usercount--
    ↓
Faculty Dashboard displays updated count
```

## Features Implemented ✓

- ✓ Fetch user count from `meta.stats.usercount`
- ✓ Display total students in Faculty Dashboard
- ✓ Increment user count on new user registration (Email, Google, GitHub)
- ✓ Decrement user count on user deletion
- ✓ Batch user deletion with count update
- ✓ Error handling and logging
- ✓ Meta collection initialization support
