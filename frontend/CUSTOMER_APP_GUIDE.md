# Customer App Implementation Guide

## ✅ Completed Features

### Layout & Navigation
- ✅ Responsive layout: Desktop top nav (max-width 1200px) + Mobile bottom tab bar
- ✅ Bottom navigation tabs: Explore, Bookings, Memberships, Wallet, Profile
- ✅ Top navigation for desktop with user menu
- ✅ Public vs logged-in navigation states

### Pages Implemented

#### 1. **Explore Page** (`/explore`)
- ✅ Search bar (keyword, city)
- ✅ "Near me" section with geolocation
- ✅ Filters: distance, indoor/outdoor, price range, open now
- ✅ Branch cards with distance, rating, thumbnail, open/closed badge
- ✅ Click to navigate to Branch Detail

#### 2. **Branch Detail Page** (`/branches/:companyId/:branchId`)
- ✅ Header with branch name, company, address, call button
- ✅ Tabs: Courts, Availability, Memberships, Gallery, Reviews
- ✅ Courts list with features and "Book" CTA
- ✅ Gallery tab with media display
- ✅ Follow/Unfollow company button

#### 3. **Availability Page** (`/availability/:companyId/:branchId/:courtId?`)
- ✅ Date picker + time range selector
- ✅ Court selector dropdown
- ✅ Available/blocked slots display
- ✅ Duration options (30/60/90/120 minutes)
- ✅ "Continue booking" CTA

#### 4. **Booking Flow** (`/book/:companyId/:branchId/:courtId?`)
- ✅ Multi-step wizard (6 steps):
  1. Select court & time
  2. Add participants (optional)
  3. Apply promo code (optional)
  4. Apply gift card (optional)
  5. Summary
  6. Confirmation screen
- ✅ Error handling for 409 (overlap) conflicts
- ✅ Redirect to My Bookings after confirmation

#### 5. **My Bookings** (`/my-bookings`)
- ✅ Tabs: Upcoming / Past / Cancelled
- ✅ Booking cards with branch, court, date/time, status, total
- ✅ Cancel button (if allowed)
- ✅ Reschedule button (if allowed)
- ✅ View details navigation

#### 6. **Memberships** (`/memberships`)
- ✅ Active memberships section
- ✅ Available plans section
- ✅ Plan details with benefits, scope badge
- ✅ Purchase flow
- ✅ Membership detail with cancel option

#### 7. **Wallet** (`/wallet`)
- ✅ Current balance display
- ✅ Transaction ledger with filters
- ✅ Gift Cards section:
  - Redeem code form
  - List of gift cards with balances

#### 8. **Notifications** (`/notifications`)
- ✅ List of notifications with read/unread states
- ✅ Mark as read functionality

#### 9. **Profile** (`/profile`)
- ✅ Avatar upload (media upload to MySQL blob)
- ✅ Name, phone, email fields
- ✅ Notification preferences
- ✅ Logout

#### 10. **Signup/Login**
- ✅ Email/password signup
- ✅ OTP login flow (phone/email → request OTP → verify)
- ✅ OTP debug hint when `REACT_APP_OTP_DEBUG=true`

### Additional Features
- ✅ Company subscriptions (Follow/Unfollow)
- ✅ Geolocation for "Near me"
- ✅ React Query for all server data
- ✅ Optimistic updates for follow/unfollow
- ✅ Skeleton loaders and empty states
- ✅ Responsive design with mobile-first approach

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_APP_NAME=Pickleball Booking Platform
REACT_APP_OTP_DEBUG=true  # Optional: shows OTP debug hint
```

### API Endpoints Used
- `GET /companies/branches/explore` - Branch search (needs backend implementation)
- `GET /companies/:companyId/branches/:branchId` - Branch details
- `GET /companies/:companyId/branches/:branchId/courts` - Courts list
- `GET /companies/:companyId/branches/:branchId/availability` - Availability
- `POST /companies/:companyId/bookings` - Create booking
- `POST /companies/:companyId/bookings/:bookingId/cancel` - Cancel booking
- `GET /companies/:companyId/membership-plans` - Membership plans
- `GET /companies/:companyId/memberships` - User memberships
- `GET /me/wallet` - Wallet balance
- `GET /me/wallet/ledger` - Wallet transactions
- `POST /companies/:companyId/gift-cards/redeem` - Redeem gift card
- `POST /companies/:companyId/subscribe` - Follow company
- `GET /companies/me/companies` - Followed companies

## 📱 Mobile Navigation

Bottom tabs appear on mobile (< md breakpoint) when user is logged in:
1. **Explore** - Search and browse branches
2. **Bookings** - View and manage bookings
3. **Memberships** - Active and available memberships
4. **Wallet** - Balance and transactions
5. **Profile** - User profile and settings

## 🎨 UI Patterns

### Card-Based Design
- Branch cards
- Court cards
- Booking cards
- Membership plan cards
- Gift card cards

### Empty States
All list views include empty states with:
- Icon
- Message
- Call-to-action button (where applicable)

### Loading States
- Skeleton loaders for lists
- Full-screen loading for initial loads
- Button loading states during mutations

### Error Handling
- Toast notifications for success/error
- Inline error messages in forms
- 409 conflict handling in booking flow
- Automatic token refresh on 401

## 🚀 Next Steps

1. **Backend Integration**: Some endpoints need to be created:
   - `/companies/branches/explore` - Branch search with filters
   - `/notifications` - Notifications list
   - `/notifications/:id/read` - Mark as read

2. **Enhancements**:
   - Real-time availability updates
   - Push notifications
   - Booking reminders
   - Payment integration UI
   - Advanced search filters
   - Map view for branches

3. **Testing**:
   - Test all booking flows
   - Test geolocation on mobile devices
   - Test OTP flow
   - Test media uploads
   - Test responsive design on various devices

## 📝 Notes

- All date/time handling uses native Date objects
- Media uploads use `multipart/form-data`
- Images are displayed via `GET /api/media/:id`
- OTP code is always "123456" in development (when backend OTP_DEBUG=true)
- Company follow/unfollow uses optimistic updates
- All mutations invalidate relevant queries for real-time updates


