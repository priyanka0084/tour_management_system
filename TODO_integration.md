# TODO: Full Integration and Testing of Frontend and Backend

## Step 1: Fix Frontend Startup Issues
- [ ] Remove or fix broken index.js file (duplicate routing)
- [ ] Ensure frontend runs with npm run dev (Vite)
- [ ] Verify all dependencies are installed

## Step 2: Start Backend Server
- [ ] Ensure MySQL is running
- [ ] Create 'tour_bookings' database in MySQL
- [ ] Run backend with npm run dev
- [ ] Verify database connection and table creation

## Step 3: Seed Database with Sample Data
- [ ] Call destinations/seed API to populate countries and places
- [ ] Call packages/seed API to populate packages
- [ ] Verify data is inserted correctly

## Step 4: Test Backend API Endpoints
- [ ] Test GET /api/destinations/countries
- [ ] Test GET /api/destinations/countries/:id/places
- [ ] Test GET /api/packages/:placeId
- [ ] Test POST /api/auth/register
- [ ] Test POST /api/auth/login
- [ ] Test POST /api/bookings
- [ ] Test POST /api/bookings/payments

## Step 5: Test Frontend API Integration
- [ ] Test Destinations page fetches countries and places
- [ ] Test Packages page fetches packages for a place
- [ ] Test DestinationSearch component fetches destinations
- [ ] Test BookingPayment page creates bookings and processes payments
- [ ] Test Login/Register pages authenticate users

## Step 6: Fix Navigation and Routing Issues
- [ ] Add missing routes for login, register, userdashboard, admindashboard in App.jsx
- [ ] Fix navigation links in Navbar
- [ ] Ensure proper flow from Home -> Destinations -> Packages -> Booking
- [ ] Fix pre-filled destination from Packages to BookingPayment

## Step 7: Test End-to-End User Flow
- [ ] Register new user
- [ ] Login
- [ ] Browse destinations
- [ ] View packages for a place
- [ ] Book a tour with payment
- [ ] View booking history

## Step 8: Fix UI and Styling Issues
- [ ] Ensure responsive design
- [ ] Fix any broken styles or layouts
- [ ] Test on different screen sizes

## Step 9: Final Testing and Validation
- [ ] Test all 5 screens: Home, Destinations, Packages, BookingPayment, UserDashboard
- [ ] Verify database connectivity throughout
- [ ] Ensure no console errors
- [ ] Validate all forms and user interactions
