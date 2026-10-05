# Roomly User Guide

Roomly supports two main user journeys:

- **Room Maker:** the coworking business owner, administrator, or staff member who creates workspaces and manages bookings.
- **Room Booker:** the customer whose room, desk, office, or appointment is being reserved.

## Room Maker Guide

### 1. Create your account and business

1. Open Roomly and select **Create account**.
2. Enter your name, email address, and password.
3. Create your organization using its business name, contact email, public slug, and timezone.
4. Open **Business settings** later to update the logo, contact information, description, website, and timezone.

The organization keeps your locations, workspaces, customers, and bookings separate from every other Roomly business.

### 2. Add locations and floors

1. Open **Locations & floors**.
2. Add each branch or physical location.
3. Add its address, city, country, timezone, and active status.
4. Add optional floors or zones inside the location.

Use separate locations for separate branches. Use floors or zones only to organize spaces within the same branch.

### 3. Configure amenities and workspace categories

1. Open **Amenities** and add options such as Wi-Fi, projector, parking, or air conditioning.
2. Create suitable workspace categories while creating or editing workspaces, such as Meeting Room, Private Office, Hot Desk, or Studio.

### 4. Create a workspace

1. Open **Workspaces**.
2. Select **New workspace**.
3. Choose its location, optional floor, and category.
4. Enter its name, description, and capacity.
5. Select its amenities.
6. Set its pricing type:
   - **Hourly:** price is calculated from the booking duration.
   - **Daily:** price is charged for each started day.
   - **Monthly:** the configured monthly amount is used.
   - **Fixed:** one fixed amount is used.
   - **Free:** no payment is due.
7. Add photos if Cloudinary is configured.
8. Choose whether the workspace is public and active.

An inactive workspace cannot receive new bookings. A private workspace remains available for staff operations but is intended to stay out of a future public catalogue.

### 5. Configure availability

1. Open **Availability**.
2. Select a workspace.
3. Set its opening and closing hours for each weekday.
4. Add closed dates, holidays, or date-specific hours.
5. Configure booking rules:
   - Minimum and maximum duration
   - Booking time increment
   - Minimum advance notice
   - Maximum advance booking window
   - Buffer before and after a booking
   - Instant or approval-required booking
6. Add a manual or maintenance block whenever the workspace must be unavailable.

Roomly applies these rules through one central availability engine. Existing bookings, blocked periods, and buffers are automatically removed from available time.

### 6. Create a booking for a customer

1. Open **Bookings** and select **New booking**.
2. Choose the workspace and date.
3. Select one of the available time slots.
4. Enter the customer's name, email, phone number, and party size.
5. Add customer notes or internal staff notes when needed.
6. Create the booking.

Roomly generates a confirmation number and prevents overlapping bookings on both the server and database.

### 7. Run daily operations

Use **Overview** to see:

- Today's bookings
- Currently occupied spaces
- Available spaces
- Upcoming bookings
- Today's booking hours
- Cancellations and no-shows
- Basic utilization

Use **Calendar** to switch between day, week, and month views. Filter by location, workspace, or booking status. The day view displays a resource timeline for bookings and blocked time.

### 8. Manage a booking

Open a booking to:

- Confirm a pending booking
- Reschedule it
- Cancel it
- Check the customer in
- Mark it completed
- Mark the customer as a no-show
- Update internal notes
- Review its activity history

Roomly validates availability again whenever a booking is rescheduled.

### 9. Manage customers

Open **Customers** to search by name, email, or phone number. A customer profile shows contact details, total bookings, completed bookings, exceptions, and full booking history.

Roomly automatically reuses the customer record when the same organization books the same email address again.

### 10. Track payments

1. Open a booking or visit **Payments**.
2. Review the quoted booking amount.
3. Record the amount, payment status, and payment method.
4. Optionally add a receipt, transfer reference, or note.

Payment statuses are **Unpaid**, **Partial**, **Paid**, and **Refunded**. Supported manual methods are **Cash**, **Bank transfer**, **Card**, and **Online**.

Roomly currently tracks payments but does not charge cards automatically.

### 11. Review reports

Open **Reports** and choose a 7, 30, or 90-day period. Roomly shows:

- Total bookings
- Booking hours
- Workspace utilization
- Most-booked spaces
- Cancellation rate
- No-show rate
- Collected revenue less refunds
- Location performance

### 12. Manage the team

Open **Team** to invite members and assign a role:

- **Owner:** full business ownership and management access.
- **Admin:** business configuration and operational management.
- **Staff:** daily booking and reception operations.

### 13. Platform administration

Authorized Roomly platform administrators can open `/admin` to manage businesses, users, plans, subscriptions, disabled organizations, and support notes. This area is separate from an individual business dashboard.

## Room Booker Guide

### Current booking experience

The current Roomly version supports staff-assisted booking. A customer contacts the coworking business, and its staff creates the reservation in Roomly.

The customer should provide:

- Name
- Email address
- Phone number
- Preferred workspace
- Preferred date and time
- Number of people
- Any special request

After staff creates the booking, the customer receives or records the Roomly confirmation number. The business can then confirm, reschedule, cancel, check in, or complete the reservation.

### Before arriving

The customer should verify:

- Business location
- Workspace name
- Booking date
- Start and end time
- Number of attendees
- Payment status
- Confirmation number

To change or cancel the booking, the customer currently contacts the business and provides the confirmation number or booking email address.

### At the location

1. Give reception the confirmation number or booking email.
2. Reception checks the customer in.
3. Use the reserved workspace during the confirmed time.
4. Reception completes the booking when the visit finishes.

### Self-service booking status

Public business pages, guest self-service booking, secure customer management links, confirmation emails, cancellation links, rescheduling links, and calendar files are part of **Phase 4** and are not implemented in the current build.

Until Phase 4 is completed, customers should not be instructed to create a Roomly account or use a public booking link.

## Recommended First-Time Setup

For a new Room Maker, use this order:

1. Create the organization.
2. Add a location and optional floors.
3. Add amenities.
4. Create workspaces and pricing.
5. Configure availability and booking rules.
6. Invite the team.
7. Create one real test booking.
8. Confirm, check in, complete, and record its payment.
9. Review the calendar and reports.

This confirms that the complete internal booking workflow is ready before customers begin using the service.
