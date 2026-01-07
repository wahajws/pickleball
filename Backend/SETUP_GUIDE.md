# Backend Setup Guide

## Problem
Running `npm start` only starts the server - it does **NOT** create database tables or seed data. You need to run setup scripts first.

## Correct Setup Order

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Configure Environment
Create a `.env` file in the `Backend` folder with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pickleball_booking
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
```

### Step 3: Create Database and Tables
Choose **ONE** of these options:

**Option A: Bootstrap (Recommended for Development)**
```bash
npm run bootstrap
```
- Creates the database if it doesn't exist
- Creates all tables using Sequelize sync

**Option B: Migrations (Recommended for Production)**
```bash
npm run migrate
```
- Runs database migrations to create tables

### Step 4: Seed Data (Create Users and Test Data)

**For ALL users from passwords.txt (Recommended):**
```bash
npm run seed:full
```
This runs `seed-comprehensive.js` which creates:
- ✅ Platform Admin: `admin@platform.com` / `Admin123!`
- ✅ Company Admin: `company@admin.com` / `Company123!`
- ✅ Branch Manager: `branch@manager.com` / `Branch123!`
- ✅ Branch Staff: `staff@branch.com` / `Staff123!`
- ✅ Customer 1-5: `customer1@test.com` through `customer5@test.com` / `Customer123!`
- ✅ Companies, branches, courts, services, bookings, and more test data

**For Basic Setup (Only 3 customers):**
```bash
npm run seed
```
This runs `seed.js` which creates:
- ✅ Platform Admin: `admin@platform.com` / `Admin123!`
- ✅ Company Admin: `company@admin.com` / `Company123!`
- ✅ Branch Manager: `branch@manager.com` / `Branch123!`
- ✅ Customer 1-3 only: `customer1@test.com` through `customer3@test.com` / `Customer123!`
- ✅ Basic companies, branches, courts, and services

### Step 5: Start the Server
```bash
npm start
```
or for development with auto-reload:
```bash
npm run dev
```

## Script Reference

| Script | Command | What It Does |
|--------|---------|--------------|
| **Bootstrap** | `npm run bootstrap` | Creates database + tables (dev) |
| **Migrate** | `npm run migrate` | Creates tables via migrations (prod) |
| **Seed (Basic)** | `npm run seed` | Creates 3 customers + basic data |
| **Seed (Full)** | `npm run seed:full` | Creates 5 customers + comprehensive data |
| **Import CSV** | `npm run import:csv` | Imports data from mock-data folder |
| **Start** | `npm start` | Starts the server (no setup) |
| **Dev** | `npm run dev` | Starts server with auto-reload |

## Quick Setup (All-in-One)

If you want to set everything up quickly:

```bash
cd Backend
npm install
npm run bootstrap      # Create database and tables
npm run seed:full      # Create all users and data
npm run dev            # Start server
```

## Test Credentials (from passwords.txt)

After running `npm run seed:full`, you can use these credentials:

- **Platform Admin**: `admin@platform.com` / `Admin123!`
- **Company Admin**: `company@admin.com` / `Company123!`
- **Branch Manager**: `branch@manager.com` / `Branch123!`
- **Branch Staff**: `staff@branch.com` / `Staff123!`
- **Customers**: `customer1@test.com` through `customer5@test.com` / `Customer123!`

## Troubleshooting

**"No tables created"**
- Make sure you ran `npm run bootstrap` or `npm run migrate` BEFORE `npm start`

**"Connection refused"**
- Check your `.env` file has correct database credentials
- Make sure MySQL is running

**"Users not found"**
- Make sure you ran `npm run seed:full` (not just `npm run seed`)

