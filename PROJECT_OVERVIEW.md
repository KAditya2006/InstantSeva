# InstantSeva Project Overview

InstantSeva is a full-stack hyperlocal service marketplace that connects customers with nearby verified service professionals such as plumbers, electricians, tutors, cleaners, AC technicians, drivers, cooks, caretakers, and other local workers.

The project is built as a production-oriented marketplace with customer booking, worker onboarding, admin verification, real-time chat, live availability, location-aware worker discovery, multilingual support, push notifications, SEO support, and verification-driven trust flows.

---

## 1. Product Goal

The main goal of InstantSeva is to make local services easy to discover, book, verify, and complete safely.

The platform supports three main roles:

- Customer: searches services, chats with workers, books jobs, tracks accepted services, verifies OTPs, and reviews completed work.
- Worker: completes profile and KYC, manages skills/pricing/availability, accepts or rejects jobs, chats with customers, and completes jobs through OTP verification.
- Admin: verifies users/workers, manages accounts, reviews uploaded documents, monitors bookings, reviews audit logs, and controls marketplace quality.

---

## 2. Core Features

### Public Website

- Responsive home page for desktop, tablet, and mobile.
- Public service categories and service discovery.
- Search page available before login.
- Public worker profile preview.
- SEO metadata, sitemap, robots file, Open Graph data, and structured data.
- Public users can explore services, but booking and chat require login and profile approval.

### Authentication

- User and worker registration.
- Email OTP verification.
- Login with JWT authentication.
- Forgot password and reset password flow.
- Protected routes for user, worker, and admin areas.
- Dashboard access gate based on profile completion and admin approval.

### Customer Flow

1. Register and verify email.
2. Complete profile and upload KYC document.
3. Wait for admin verification.
4. Access dashboard after approval.
5. Search workers by service and location.
6. View worker availability and online status.
7. Chat with eligible workers.
8. Book a service with address, location, schedule, and notes.
9. Track accepted booking details.
10. Give Start OTP to begin the job.
11. Give Completion OTP after the service is finished.
12. Review the completed booking.

### Worker Flow

1. Register as worker and verify email.
2. Complete worker profile with skills, bio, pricing, and experience.
3. Upload KYC document.
4. Wait for admin approval.
5. Access worker dashboard after approval.
6. Set availability status.
7. Receive booking requests.
8. Accept or reject jobs.
9. Chat with customers.
10. Use customer OTP to start/complete service.
11. Track job history and booking details.

### Admin Flow

- View dashboard statistics.
- Open clickable user, worker, and booking directories.
- Add users and workers from admin dashboard.
- Soft-delete/suspend users and workers.
- Review KYC queue.
- Preview uploaded KYC documents inside the admin modal.
- Approve or reject identity verification.
- View booking records.
- View audit logs for important platform actions.

---

## 3. Technology Stack

### Frontend

- React 19 for UI.
- Vite for development and production builds.
- Tailwind CSS 4 for styling.
- React Router for routing.
- Axios for API communication.
- React Context for authentication state.
- React Hot Toast for UI notifications.
- Socket.IO client for real-time chat and presence.
- Leaflet and React-Leaflet for map and location UI.
- i18next and react-i18next for multilingual support.
- Lucide React for icons.
- Framer Motion for UI animation.

### Backend

- Node.js with Express.
- MongoDB with Mongoose.
- Socket.IO for real-time communication.
- JWT authentication.
- bcrypt password hashing.
- Multer and Cloudinary for media uploads.
- Nodemailer for email and OTP delivery.
- Web Push with VAPID keys for browser notifications.
- Helmet and CORS for security headers and origin protection.
- Express Rate Limit for abuse prevention.

### Shared Code

- `shared/serviceKeywords.json` contains multilingual service keyword mappings used by both frontend and backend search logic.

---

## 4. Project Structure

```text
Startup/
  backend/
    config/          Backend configuration: database, Cloudinary, env validation.
    controllers/     API business logic for auth, admin, booking, chat, user, worker, marketplace.
    middleware/      Auth, role checks, language handling, rate limiters.
    models/          MongoDB schemas.
    routes/          Express route definitions.
    scripts/         Seed and admin helper scripts.
    services/        OTP, push notifications, location services.
    tests/           Backend unit and smoke tests.
    utils/           Reusable backend helpers.
    app.js           Express app setup.
    index.js         HTTP and Socket.IO server entry point.

  frontend/
    public/          Static assets, SEO files, manifest.
    scripts/         Frontend integrity and smoke checks.
    src/
      components/    Reusable UI components.
      constants/     Static app constants.
      context/       Auth context and global state.
      i18n/          Translation setup and locale files.
      pages/         Route-level pages.
      services/      Axios API client.
      utils/         Client helpers for images, search, presence, formatters.
    vite.config.js   Vite configuration.

  shared/
    serviceKeywords.json

  package.json
  render.yaml
  PROJECT_OVERVIEW.md
  README.md
```

---

## 5. Frontend Pages

The frontend currently includes these main pages:

- `Home.jsx`: public landing page and service discovery entry.
- `Search.jsx`: service search and worker listing.
- `WorkerProfile.jsx`: public worker detail and booking page.
- `Signup.jsx`: registration.
- `Login.jsx`: login.
- `VerifyOTP.jsx`: email OTP verification.
- `ForgotPassword.jsx`: password reset request.
- `Dashboard.jsx`: customer dashboard.
- `WorkerDashboard.jsx`: worker dashboard.
- `AdminDashboard.jsx`: admin control panel.
- `Chat.jsx`: real-time messaging.
- `Profile.jsx`: profile completion and KYC.
- `EditProfile.jsx`: profile editing.
- `NotFound.jsx`: fallback page.

---

## 6. Backend API Areas

Main route groups:

- `/api/auth`: registration, login, current user, OTP verification, password reset.
- `/api/user`: customer profile, avatar upload, user KYC upload.
- `/api/worker`: worker profile, worker KYC upload, availability/profile updates.
- `/api/marketplace`: public worker/service discovery and worker details.
- `/api/bookings`: booking creation, status update, payment status, review, OTP verification.
- `/api/chat`: chat creation, messages, read receipts, image messages.
- `/api/admin`: stats, account management, identity approval, bookings, audit logs.
- `/api/notifications`: in-app notifications, push subscription, read status.
- `/api/health`: deployment and environment health check.

---

## 7. Database Models

Important MongoDB models:

- `User`: account, role, KYC, location, preferred language, soft-delete state.
- `WorkerProfile`: skills, experience, bio, pricing, KYC, availability, approval status, rating stats.
- `Booking`: customer, worker, service, schedule, status, OTPs, location, payment status.
- `Chat`: chat participants and chat metadata.
- `Message`: text/image messages, read/delivery status.
- `Review`: verified booking reviews.
- `Notification`: in-app notification records.
- `PushSubscription`: browser push subscription records.
- `OTP`: email verification OTPs.
- `PasswordReset`: password reset code records.
- `AuditLog`: admin and critical action history.
- `CommonLocation`: stored common locations and usage count.
- `WorkerModels`: dynamic worker model helpers.

---

## 8. Verification and Trust System

InstantSeva uses multiple verification layers:

### Email Verification

- Registration requires email verification through OTP.
- OTP attempts are limited.
- Expired or incorrect OTPs are rejected.

### Profile Completion Gate

- Users and workers cannot access dashboard features until required profile details are complete.
- Customers must complete profile and submit KYC before dashboard access.
- Workers must complete profile and submit worker KYC before dashboard access.

### Admin Approval Gate

- Admin reviews submitted identity documents.
- Approved accounts gain dashboard access.
- Rejected accounts can re-upload documents.

### Booking OTP Protection

- Worker receives Start OTP after accepting a booking.
- Customer verifies Start OTP to begin the job.
- Customer receives Completion OTP after the job starts.
- Worker verifies Completion OTP to complete the job.
- Booking OTPs have expiry and failed-attempt protection.

---

## 9. Search and Location System

The marketplace search supports:

- Service keyword search.
- Multilingual service keywords.
- Nearest-to-farthest worker ordering.
- Worker availability status.
- Online/offline presence indicators.
- Worker approval filtering.
- Soft-deleted worker filtering.
- Location-based coordinates and address fallback.
- Shared keyword mapping from `shared/serviceKeywords.json`.

If a searched service is not listed, the UI can show a fallback state and guide users to request or search similar services.

---

## 10. Chat and Presence

The chat system includes:

- Real-time messaging through Socket.IO.
- Text messages.
- Image messages using Cloudinary.
- Chat history persistence in MongoDB.
- Message delivery state.
- Read receipts.
- Online/offline presence.
- Restricted chat rules to prevent unrelated spam.
- Push notification dispatch for important message events.

Message tick behavior:

- Single tick: sent but receiver is offline or not delivered.
- Double tick: delivered to receiver.
- Colored double tick: receiver viewed/read the message.

---

## 11. Notifications

InstantSeva supports multiple notification layers:

- In-app notification records.
- Browser push notifications through Web Push and VAPID.
- Notification language selection based on user preferred language.
- Booking notifications.
- Chat notifications.
- Review notifications.
- Payment/status notifications.
- Verification result notifications.

Required push environment values:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_CONTACT_EMAIL`

---

## 12. Multilingual System

InstantSeva includes multilingual support for all 22 scheduled Indian languages:

1. English
2. Hindi
3. Bengali
4. Telugu
5. Marathi
6. Tamil
7. Urdu
8. Gujarati
9. Kannada
10. Odia
11. Malayalam
12. Punjabi
13. Assamese
14. Maithili
15. Santali
16. Kashmiri
17. Nepali
18. Konkani
19. Sindhi
20. Dogri
21. Manipuri
22. Bodo

Implementation details:

- Uses `i18next` and `react-i18next`.
- English is the fallback language.
- Locale JSON files are lazy-loaded to reduce initial bundle size.
- Selected language is saved in localStorage.
- Logged-in users can sync preferred language to their profile.
- Browser language detection chooses the closest supported language.
- Urdu supports RTL direction.
- API requests include `Accept-Language` and `X-Language`.
- Backend messages can use server-side translation keys.
- Notifications can be created in the receiver's preferred language.
- Runtime translator acts as a safety layer for leftover visible strings.

---

## 13. Voice and Accessibility Features

The project includes browser-based voice support where available:

- Voice input for search or user queries.
- Text-to-speech support in selected language when the browser supports it.
- Graceful fallback when speech APIs are unavailable.
- Responsive layouts for mobile and desktop.
- Language direction handling for RTL.

---

## 14. Admin Dashboard Details

Admin capabilities:

- View total users.
- View total workers.
- View pending KYC count.
- View paid and total bookings.
- Click count cards to inspect matching records.
- Search users, workers, and bookings.
- Add user accounts.
- Add worker accounts.
- Soft-delete user/worker accounts.
- Review pending user and worker KYC.
- Preview uploaded ID documents inside the review modal.
- Approve or reject verification.
- View audit logs.

Document preview behavior:

- Images render directly inside the modal.
- Cloudinary PDFs are converted to an inline first-page image preview.
- Unsupported/corrupt files show an inline fallback message.

---

## 15. Deployment Architecture

The app is designed for single-service deployment on Render:

1. Render runs root build command.
2. Root build installs dependencies and builds frontend.
3. Backend starts with `npm start`.
4. Express serves API routes under `/api`.
5. Express serves `frontend/dist` for the React app.
6. SPA fallback serves `index.html` for frontend routes.
7. SEO files such as `sitemap.xml`, `robots.txt`, and `site.webmanifest` are served directly.

Render configuration:

```yaml
services:
  - type: web
    name: hyperlocal-service-marketplace
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
```

---

## 16. Environment Variables

Important backend environment variables:

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `RENDER_EXTERNAL_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_NAME`
- `FROM_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NOMINATIM_USER_AGENT`
- `GEOCODER_COUNTRY_CODES`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_CONTACT_EMAIL`

Production validation:

- `MONGO_URI` is required.
- `JWT_SECRET` is required.
- Production `JWT_SECRET` must be at least 32 characters.
- Production must define a client origin through `CLIENT_ORIGIN` or `RENDER_EXTERNAL_URL`.

Frontend environment variables:

- `VITE_API_URL` can be used when frontend and backend are hosted separately.
- If frontend is served by the backend, `/api` is used by default.

---

## 17. Security Measures

Implemented security features:

- Password hashing with bcrypt.
- JWT authentication.
- Role-based route protection.
- Dashboard access gating.
- Email verification.
- Admin verification gate.
- Rate limiters for auth, signup, login, OTP, chat, password reset, and location search.
- Helmet security headers.
- CORS origin allowlist.
- Soft-delete/suspend instead of immediate account data removal.
- API error handling.
- Structured backend logging.
- Audit log persistence for critical platform events.
- Upload normalization for Cloudinary/local storage file formats.

Important production note:

- JWTs are currently stored client-side for development speed. For stronger production security, HTTP-only cookies, refresh token rotation, and token invalidation should be added later.

---

## 18. SEO System

SEO-related features:

- Sitemap support.
- Robots file support.
- Web manifest support.
- Open Graph metadata.
- Twitter card metadata.
- Structured data for better search engine understanding.
- Public service and worker discovery paths.
- SPA fallback that still serves public routes correctly.

For Google Search Console:

- Submit `/sitemap.xml`.
- Make sure `robots.txt` does not block the home page or sitemap.
- Use URL inspection after deployment.
- Google may take time to update title and favicon after deployment.

---

## 19. Testing and Quality Checks

Root test command:

```bash
npm test
```

This command runs:

- Frontend ESLint.
- i18n locale integrity check.
- UI i18n/static smoke check.
- E2E-style route/API smoke check.
- Frontend production build.
- Backend syntax checks.
- Backend unit tests.

Useful scripts:

```bash
npm run dev
npm run build
npm run lint
npm run check:backend
npm test
npm run seed --prefix backend
```

Backend tests cover:

- Booking lifecycle rules.
- Pricing calculation.
- Pagination safety.
- Payment status transition rules.
- Regex escaping for search.
- Chat access rules.
- Booking OTP fields.
- Upload payload normalization.
- Production env validation.

---

## 20. Local Development

Install dependencies:

```bash
npm install
```

Start backend and frontend together:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

When running locally, CORS allows localhost frontend origins.

---

## 21. Seed Data

The backend seed script creates or updates sample users and marketplace data.

Run:

```bash
npm run seed --prefix backend
```

Seed examples include:

- Admin account.
- Customer account.
- Multiple worker examples such as plumber, electrician, carpenter, tutor, AC repair, and multi-skill worker.

Check `backend/scripts/seed.js` for the latest exact credentials and sample data.

---

## 22. Current Limitations

Known limitations:

- Real payment gateway is not integrated yet.
- Payments are currently prototype/manual status updates.
- JWT storage can be hardened for production.
- Push notification delivery depends on browser support and user permission.
- Browser PDF preview support varies, so Cloudinary PDF previews are converted to image where possible.
- Full production monitoring and analytics are not included yet.

---

## 23. Recommended Roadmap

High-priority improvements:

- Add Razorpay or Stripe payment integration.
- Add HTTP-only cookie authentication and refresh token rotation.
- Add production analytics and error monitoring.
- Add automated browser E2E tests with Playwright or Cypress.
- Add admin export tools for users, workers, bookings, and audit logs.
- Add worker payout management.
- Add service request flow for unlisted services.
- Add stronger moderation tools for chat images and documents.
- Add mobile app or PWA install flow.

Future growth features:

- Worker subscription plans.
- AI-based worker recommendation.
- Service package pricing.
- Scheduled recurring bookings.
- WhatsApp/SMS notification integrations.
- Advanced fraud detection.
- Multi-city marketplace management.

---

## 24. One-Line Summary

InstantSeva is a verified, multilingual, location-aware hyperlocal service marketplace with customer booking, worker onboarding, admin approval, chat, push notifications, OTP-secured job completion, and production-ready deployment support.
