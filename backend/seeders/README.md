# Database Seeder

This directory contains database seeding scripts for the Gym Capstone project.

## Files

- `seed-data.json` - JSON file containing seed data for all collections
- `seeder.js` - Node.js script that inserts seed data with audit logs

## Usage

### Run the seeder:

```bash
node backend/seeders/seeder.js
```

### Using npm script (add to backend/package.json first):

```bash
npm run seed
```

## What Gets Seeded

### 1. Admins (3)
- admin@6packironcity.com (admin)
- staff@6packironcity.com (staff)
- superadmin@6packironcity.com (superadmin)
- Password: `123123123`

### 2. Trainers (3)
- Mike Johnson - HIIT, Strength Training
- Sarah Williams - Yoga, Pilates
- David Brown - Boxing, Muay Thai
- Password: `123123123`

### 3. Clients (3)
- Alice Anderson - intermediate, group classes
- Emma Taylor - advanced, personal training
- James Martinez - beginner, group classes
- Password: `123123123`

### 4. Membership Configs (3)
- Basic Monthly - ₱1,500 (30 days)
- Premium Quarterly - ₱4,000 (90 days)
- Elite Annual - ₱12,000 (365 days)

### 5. Plans (4)
- Basic - 30 days
- Standard - 90 days
- Premium - 180 days
- Elite - 365 days

### 6. Pricing (4)
- Basic - ₱1,500 (membership fee: ₱500)
- Standard - ₱4,000 (membership fee: ₱300)
- Premium - ₱7,000 (membership fee: ₱200)
- Elite - ₱12,000 (membership fee: ₱0)

### 7. Classes (13)
- All 13 existing classes from the system

### 8. Class Schedules (50)
- Random schedules across all classes
- Random trainers
- Random statuses (open, closed, cancelled, archived)
- Capacity: 10-25

### 9. Client Passes (10)
- Random clients with various plan/pricing combinations
- Statuses: active, expired, cancelled

### 10. Memberships (30)
- Random clients with various status (active, expired, cancelled, pending)
- 30-day duration
- Some frozen memberships

### 11. Discount Requests (15)
- Random clients
- Statuses: pending, approved, rejected

### 12. Payments (50)
- Various payment types (membership, daily_pass, trainer-booking)
- Statuses: PENDING, PAID, FAILED, EXPIRED
- Methods: gcash, paymaya, credit_card, cash

### 13. Class Bookings (~30)
- Bookings for class schedules
- Statuses: joined, cancelled

### 14. Trainer Bookings (30)
- Bookings for trainers
- Statuses: on_going, completed

### 15. Audit Logs
- Every seeded record creates an audit log entry
- Actor: System Seeder
- Actions logged: *_CREATED for each entity

## Features

✅ **Duplicate Detection** - Skips records if they already exist  
✅ **Audit Logs** - Every insertion creates an audit log entry  
✅ **Foreign Key References** - Properly links related records  
✅ **Random Variations** - Realistic data with varied statuses and dates  
✅ **Error Handling** - Stops on error with clear message  

## Notes

- The seeder uses `bcrypt` to hash passwords
- Dates are generated to create realistic past/present/future data
- Membership end dates are calculated based on plan duration
- Class schedules are generated for the next 30 days
- Password for all seeded users: `123123123`
- Audit logs reference the System Seeder as the actor

## Clear Data First

To clear existing data before seeding, use MongoDB:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use gym-capstone

# Clear all collections
db.admins.deleteMany({})
db.clients.deleteMany({})
db.trainers.deleteMany({})
db.membership_config.deleteMany({})
db.plans.deleteMany({})
db.pricing.deleteMany({})
db.classes.deleteMany({})
db.class_schedule.deleteMany({})
db.clients_pass.deleteMany({})
db.memberships.deleteMany({})
db.discount_requests.deleteMany({})
db.payments.deleteMany({})
db.bookings.deleteMany({})
db.audit_logs.deleteMany({})
```

**Warning**: This will permanently delete all data!

## Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check `.env` file has correct connection string

**Duplicate Key Error**
- The seeder skips duplicates automatically
- Clear collections first if you want fresh data

**Out of Memory**
- Reduce the number of records in `seed-data.json`
- Run seeding in smaller batches
