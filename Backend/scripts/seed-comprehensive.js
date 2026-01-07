require('dotenv').config();
const { sequelize } = require('../src/models');
const {
  // Auth & Users
  Role, Permission, RolePermission, User, UserRole, AuthIdentity, AuthSession, OtpCode,
  // Companies & Branches
  Company, Branch, BranchContact, BranchAmenity, BranchStaff, BranchBusinessHours, BranchSpecialHours,
  // Courts & Resources
  Court, CourtFeature, CourtRateRule, CourtTimeSlot, ResourceBlock,
  // Bookings
  Booking, BookingItem, BookingParticipant, BookingChangeLog, BookingWaitlist, CourtReservationLock,
  // Groups
  Group, GroupMember, GroupBooking,
  // Services & Memberships
  Service, ServiceBranchAvailability, MembershipPlan, MembershipPlanBenefit,
  CustomerMembership, MembershipCycle, MembershipUsageLedger,
  // Marketing
  Campaign, CampaignRule, PromoCode, DiscountApplication,
  // Financial
  Payment, PaymentAttempt, Refund, Invoice, InvoiceItem, CustomerWalletLedger, TaxRate,
  // Gift Cards
  GiftCard, GiftCardRedemption,
  // Notifications
  NotificationTemplate, NotificationOutbox, NotificationDeliveryLog, UserNotificationPreference,
  // Reviews & Support
  Review, SupportTicket, SupportTicketMessage,
  // Company Customers
  CompanyCustomer,
  // Audit & Media
  AuditLog, MediaFile, MediaVariant
} = require('../src/models');
const { generateUUID } = require('../src/utils/uuid');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected. Seeding comprehensive data...\n');

    // ============================================================================
    // 1. ROLES & PERMISSIONS
    // ============================================================================
    console.log('Creating roles and permissions...');
    const roles = {
      platformAdmin: await Role.findOrCreate({
        where: { role_type: 'platform_super_admin' },
        defaults: {
          id: generateUUID(),
          name: 'Platform Super Admin',
          role_type: 'platform_super_admin',
          description: 'Full platform access',
          is_system_role: true
        }
      }),
      companyAdmin: await Role.findOrCreate({
        where: { role_type: 'company_admin' },
        defaults: {
          id: generateUUID(),
          name: 'Company Admin',
          role_type: 'company_admin',
          description: 'Company management access',
          is_system_role: true
        }
      }),
      branchManager: await Role.findOrCreate({
        where: { role_type: 'branch_manager' },
        defaults: {
          id: generateUUID(),
          name: 'Branch Manager',
          role_type: 'branch_manager',
          description: 'Branch management access',
          is_system_role: true
        }
      }),
      branchStaff: await Role.findOrCreate({
        where: { role_type: 'branch_staff' },
        defaults: {
          id: generateUUID(),
          name: 'Branch Staff',
          role_type: 'branch_staff',
          description: 'Branch staff access',
          is_system_role: true
        }
      }),
      customer: await Role.findOrCreate({
        where: { role_type: 'customer' },
        defaults: {
          id: generateUUID(),
          name: 'Customer',
          role_type: 'customer',
          description: 'Customer access',
          is_system_role: true
        }
      })
    };

    const platformAdminRole = roles.platformAdmin[0];
    const companyAdminRole = roles.companyAdmin[0];
    const branchManagerRole = roles.branchManager[0];
    const branchStaffRole = roles.branchStaff[0];
    const customerRole = roles.customer[0];

    // Create sample permissions
    const permissions = [];
    const permissionNames = [
      { resource: 'company', action: 'create' },
      { resource: 'company', action: 'read' },
      { resource: 'company', action: 'update' },
      { resource: 'company', action: 'delete' },
      { resource: 'branch', action: 'create' },
      { resource: 'branch', action: 'read' },
      { resource: 'branch', action: 'update' },
      { resource: 'branch', action: 'delete' },
      { resource: 'booking', action: 'create' },
      { resource: 'booking', action: 'read' },
      { resource: 'booking', action: 'update' },
      { resource: 'booking', action: 'delete' }
    ];

    for (const perm of permissionNames) {
      const [permission] = await Permission.findOrCreate({
        where: { resource: perm.resource, action: perm.action },
        defaults: {
          id: generateUUID(),
          name: `${perm.resource}.${perm.action}`,
          resource: perm.resource,
          action: perm.action,
          description: `${perm.action} ${perm.resource}`
        }
      });
      permissions.push(permission);
    }

    // Assign permissions to roles
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { role_id: platformAdminRole.id, permission_id: permission.id },
        defaults: {
          id: generateUUID(),
          role_id: platformAdminRole.id,
          permission_id: permission.id
        }
      });
    }

    console.log(`  ✓ Created ${permissions.length} permissions`);

    // ============================================================================
    // 2. USERS
    // ============================================================================
    console.log('\nCreating users...');

    // Platform Admin
    let platformAdmin = await User.findOne({ where: { email: 'admin@platform.com' } });
    if (!platformAdmin) {
      const adminId = generateUUID();
      const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
      
      platformAdmin = await User.create({
        id: adminId,
        email: 'admin@platform.com',
        first_name: 'Platform',
        last_name: 'Admin',
        status: 'active',
        email_verified_at: new Date(),
        created_by: adminId
      });

      await AuthIdentity.create({
        id: generateUUID(),
        user_id: adminId,
        provider: 'email_password',
        provider_user_id: 'admin@platform.com',
        email: 'admin@platform.com',
        is_primary: true,
        verified_at: new Date(),
        provider_metadata: { password_hash: adminPasswordHash }
      });

      await UserRole.create({
        id: generateUUID(),
        user_id: adminId,
        role_id: platformAdminRole.id,
        company_id: null,
        branch_id: null,
        assigned_by: adminId
      });

      console.log('  ✓ Platform Admin: admin@platform.com / Admin123!');
    }

    // Company Admin
    let companyAdmin = await User.findOne({ where: { email: 'company@admin.com' } });
    if (!companyAdmin) {
      const companyAdminId = generateUUID();
      const companyAdminPasswordHash = await bcrypt.hash('Company123!', 10);
      
      companyAdmin = await User.create({
        id: companyAdminId,
        email: 'company@admin.com',
        first_name: 'Company',
        last_name: 'Admin',
        status: 'active',
        email_verified_at: new Date(),
        created_by: platformAdmin.id
      });

      await AuthIdentity.create({
        id: generateUUID(),
        user_id: companyAdminId,
        provider: 'email_password',
        provider_user_id: 'company@admin.com',
        email: 'company@admin.com',
        is_primary: true,
        verified_at: new Date(),
        provider_metadata: { password_hash: companyAdminPasswordHash }
      });

      console.log('  ✓ Company Admin: company@admin.com / Company123!');
    }

    // Branch Manager
    let branchManager = await User.findOne({ where: { email: 'branch@manager.com' } });
    if (!branchManager) {
      const branchManagerId = generateUUID();
      const branchManagerPasswordHash = await bcrypt.hash('Branch123!', 10);
      
      branchManager = await User.create({
        id: branchManagerId,
        email: 'branch@manager.com',
        first_name: 'Branch',
        last_name: 'Manager',
        status: 'active',
        email_verified_at: new Date(),
        created_by: platformAdmin.id
      });

      await AuthIdentity.create({
        id: generateUUID(),
        user_id: branchManagerId,
        provider: 'email_password',
        provider_user_id: 'branch@manager.com',
        email: 'branch@manager.com',
        is_primary: true,
        verified_at: new Date(),
        provider_metadata: { password_hash: branchManagerPasswordHash }
      });

      console.log('  ✓ Branch Manager: branch@manager.com / Branch123!');
    }

    // Branch Staff
    let branchStaff = await User.findOne({ where: { email: 'staff@branch.com' } });
    if (!branchStaff) {
      const branchStaffId = generateUUID();
      const branchStaffPasswordHash = await bcrypt.hash('Staff123!', 10);
      
      branchStaff = await User.create({
        id: branchStaffId,
        email: 'staff@branch.com',
        first_name: 'Branch',
        last_name: 'Staff',
        phone: '+1234567899',
        status: 'active',
        email_verified_at: new Date(),
        created_by: platformAdmin.id
      });

      await AuthIdentity.create({
        id: generateUUID(),
        user_id: branchStaffId,
        provider: 'email_password',
        provider_user_id: 'staff@branch.com',
        email: 'staff@branch.com',
        is_primary: true,
        verified_at: new Date(),
        provider_metadata: { password_hash: branchStaffPasswordHash }
      });

      console.log('  ✓ Branch Staff: staff@branch.com / Staff123!');
    }

    // Test Customers
    const customers = [];
    for (let i = 1; i <= 5; i++) {
      let customer = await User.findOne({ where: { email: `customer${i}@test.com` } });
      if (!customer) {
        const customerId = generateUUID();
        const customerPasswordHash = await bcrypt.hash('Customer123!', 10);
        
        customer = await User.create({
          id: customerId,
          email: `customer${i}@test.com`,
          first_name: `Customer${i}`,
          last_name: 'Test',
          phone: `+1234567890${i}`,
          status: 'active',
          email_verified_at: new Date(),
          created_by: platformAdmin.id
        });

        await AuthIdentity.create({
          id: generateUUID(),
          user_id: customerId,
          provider: 'email_password',
          provider_user_id: `customer${i}@test.com`,
          email: `customer${i}@test.com`,
          is_primary: true,
          verified_at: new Date(),
          provider_metadata: { password_hash: customerPasswordHash }
        });

        await UserRole.create({
          id: generateUUID(),
          user_id: customerId,
          role_id: customerRole.id,
          company_id: null,
          branch_id: null,
          assigned_by: platformAdmin.id
        });

        customers.push(customer);
        console.log(`  ✓ Customer ${i}: customer${i}@test.com / Customer123!`);
      } else {
        customers.push(customer);
      }
    }

    // Create Auth Sessions
    if (customers.length > 0) {
      await AuthSession.create({
        id: generateUUID(),
        user_id: customers[0].id,
        session_token: 'mock_session_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        last_activity_at: new Date(),
        status: 'active',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Test)'
      });
      console.log('  ✓ Created sample auth session');
    }

    // Create OTP Codes
    await OtpCode.create({
      id: generateUUID(),
      phone: '+12345678901',
      code: '123456',
      status: 'pending',
      purpose: 'login',
      expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });
    console.log('  ✓ Created sample OTP code');

    // ============================================================================
    // 3. COMPANIES
    // ============================================================================
    console.log('\nCreating companies...');
    let company1 = await Company.findOne({ where: { name: 'Pickleball Paradise' } });
    if (!company1) {
      company1 = await Company.create({
        id: generateUUID(),
        name: 'Pickleball Paradise',
        slug: 'pickleball-paradise',
        description: 'Premier pickleball facility in San Francisco',
        website_url: 'https://pickleballparadise.com',
        timezone: 'America/Los_Angeles',
        default_currency: 'USD',
        status: 'active',
        created_by: platformAdmin.id
      });
      console.log('  ✓ Company: Pickleball Paradise');
    }

    let company2 = await Company.findOne({ where: { name: 'Court Masters' } });
    if (!company2) {
      company2 = await Company.create({
        id: generateUUID(),
        name: 'Court Masters',
        slug: 'court-masters',
        description: 'Professional court rental services',
        website_url: 'https://courtmasters.com',
        timezone: 'America/Los_Angeles',
        default_currency: 'USD',
        status: 'active',
        created_by: platformAdmin.id
      });
      console.log('  ✓ Company: Court Masters');
    }

    // Assign company admin role
    if (companyAdmin && !await UserRole.findOne({ where: { user_id: companyAdmin.id, company_id: company1.id } })) {
      await UserRole.create({
        id: generateUUID(),
        user_id: companyAdmin.id,
        role_id: companyAdminRole.id,
        company_id: company1.id,
        branch_id: null,
        assigned_by: platformAdmin.id
      });
    }

    // ============================================================================
    // 4. BRANCHES
    // ============================================================================
    console.log('\nCreating branches...');
    let branch1 = await Branch.findOne({ where: { company_id: company1.id, name: 'Downtown Branch' } });
    if (!branch1) {
      branch1 = await Branch.create({
        id: generateUUID(),
        company_id: company1.id,
        name: 'Downtown Branch',
        slug: 'downtown-branch',
        address_line1: '789 Main St',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postal_code: '94103',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        status: 'active',
        created_by: companyAdmin.id
      });
      console.log('  ✓ Branch: Downtown Branch');

      // Branch Contacts
      await BranchContact.create({
        id: generateUUID(),
        branch_id: branch1.id,
        contact_type: 'phone',
        contact_value: '+1-555-1001',
        is_primary: true,
        created_by: companyAdmin.id
      });

      await BranchContact.create({
        id: generateUUID(),
        branch_id: branch1.id,
        contact_type: 'email',
        contact_value: 'downtown@pickleballparadise.com',
        is_primary: false,
        created_by: companyAdmin.id
      });

      // Branch Amenities
      const amenities = ['Parking', 'Locker Room', 'Pro Shop', 'Cafe', 'WiFi'];
      for (const amenity of amenities) {
        await BranchAmenity.create({
          id: generateUUID(),
          branch_id: branch1.id,
          name: amenity,
          description: `${amenity} available`,
          created_by: companyAdmin.id
        });
      }
      console.log(`  ✓ Created ${amenities.length} branch amenities`);

      // Branch Staff
      if (branchStaff) {
        await BranchStaff.create({
          id: generateUUID(),
          branch_id: branch1.id,
          user_id: branchStaff.id,
          position: 'Staff Member',
          is_manager: false,
          is_active: true,
          assigned_by: companyAdmin.id,
          created_by: companyAdmin.id
        });
        console.log('  ✓ Assigned branch staff');
      }

      // Business Hours
      for (let day = 0; day <= 6; day++) {
        await BranchBusinessHours.create({
          id: generateUUID(),
          branch_id: branch1.id,
          day_of_week: day,
          open_time: '06:00:00',
          close_time: '22:00:00',
          is_closed: false,
          created_by: companyAdmin.id
        });
      }

      // Special Hours (Holiday)
      const nextHoliday = new Date();
      nextHoliday.setMonth(nextHoliday.getMonth() + 1);
      nextHoliday.setDate(1);
      await BranchSpecialHours.create({
        id: generateUUID(),
        branch_id: branch1.id,
        date: nextHoliday,
        open_time: '08:00:00',
        close_time: '20:00:00',
        is_closed: false,
        reason: 'Holiday hours',
        created_by: companyAdmin.id
      });
      console.log('  ✓ Created special hours');

      // Resource Blocks
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      const blockEnd = new Date(tomorrow);
      blockEnd.setHours(16, 0, 0, 0);

      await ResourceBlock.create({
        id: generateUUID(),
        branch_id: branch1.id,
        court_id: null, // Block all courts
        block_type: 'maintenance',
        start_datetime: tomorrow,
        end_datetime: blockEnd,
        reason: 'Scheduled maintenance',
        created_by: companyAdmin.id
      });
      console.log('  ✓ Created resource block');
    }

    let branch2 = await Branch.findOne({ where: { company_id: company1.id, name: 'Westside Branch' } });
    if (!branch2) {
      branch2 = await Branch.create({
        id: generateUUID(),
        company_id: company1.id,
        name: 'Westside Branch',
        slug: 'westside-branch',
        address_line1: '321 Ocean Blvd',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postal_code: '94117',
        latitude: 37.7849,
        longitude: -122.4094,
        timezone: 'America/Los_Angeles',
        status: 'active',
        created_by: companyAdmin.id
      });
      console.log('  ✓ Branch: Westside Branch');

      // Business Hours
      for (let day = 0; day <= 6; day++) {
        await BranchBusinessHours.create({
          id: generateUUID(),
          branch_id: branch2.id,
          day_of_week: day,
          open_time: '07:00:00',
          close_time: '21:00:00',
          is_closed: false,
          created_by: companyAdmin.id
        });
      }
    }

    // Assign branch manager
    if (branchManager && !await UserRole.findOne({ where: { user_id: branchManager.id, branch_id: branch1.id } })) {
      await UserRole.create({
        id: generateUUID(),
        user_id: branchManager.id,
        role_id: branchManagerRole.id,
        company_id: company1.id,
        branch_id: branch1.id,
        assigned_by: companyAdmin.id
      });
    }

    // ============================================================================
    // 5. COURTS
    // ============================================================================
    console.log('\nCreating courts...');
    const courts = [];
    for (let i = 1; i <= 6; i++) {
      let court = await Court.findOne({ where: { branch_id: branch1.id, court_number: i.toString() } });
      if (!court) {
        court = await Court.create({
          id: generateUUID(),
          branch_id: branch1.id,
          name: `Court ${i}`,
          court_number: i.toString(),
          status: 'active',
          surface_type: i % 2 === 0 ? 'indoor' : 'outdoor',
          hourly_rate: 25.00 + (i * 5),
          description: `Court ${i} description`,
          created_by: companyAdmin.id
        });
        courts.push(court);

        // Court Features
        const features = ['Lighting', 'Net', 'Scoreboard'];
        for (const feature of features) {
          await CourtFeature.create({
            id: generateUUID(),
            court_id: court.id,
            feature_name: feature,
            feature_value: 'Yes',
            created_by: companyAdmin.id
          });
        }

        // Court Rate Rules
        // Peak hours (weekdays 5-9 PM) - 1.5x base rate
        const peakRate = (court.hourly_rate * 1.5).toFixed(2);
        await CourtRateRule.create({
          id: generateUUID(),
          branch_id: branch1.id,
          court_id: court.id,
          day_of_week: null, // Applies to all days
          start_time: '17:00:00',
          end_time: '21:00:00',
          rate_per_hour: parseFloat(peakRate),
          applies_to_members: false,
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true,
          created_by: companyAdmin.id
        });

        // Weekend rate - 1.2x base rate
        const weekendRate = (court.hourly_rate * 1.2).toFixed(2);
        await CourtRateRule.create({
          id: generateUUID(),
          branch_id: branch1.id,
          court_id: court.id,
          day_of_week: 0, // Sunday
          start_time: '00:00:00',
          end_time: '23:59:59',
          rate_per_hour: parseFloat(weekendRate),
          applies_to_members: false,
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true,
          created_by: companyAdmin.id
        });

        console.log(`  ✓ Court ${i}: ${court.name} ($${court.hourly_rate}/hr)`);
      } else {
        courts.push(court);
      }
    }

    // ============================================================================
    // 6. SERVICES
    // ============================================================================
    console.log('\nCreating services...');
    let service1 = await Service.findOne({ where: { company_id: company1.id, name: 'Court Rental' } });
    if (!service1) {
      service1 = await Service.create({
        id: generateUUID(),
        company_id: company1.id,
        name: 'Court Rental',
        description: 'Standard court rental service',
        service_type: 'court_booking',
        base_price: 30.00,
        currency: 'USD',
        is_active: true,
        created_by: companyAdmin.id
      });
      console.log('  ✓ Service: Court Rental');
    }

    let service2 = await Service.findOne({ where: { company_id: company1.id, name: 'Equipment Rental' } });
    if (!service2) {
      service2 = await Service.create({
        id: generateUUID(),
        company_id: company1.id,
        name: 'Equipment Rental',
        description: 'Paddles and balls rental',
        service_type: 'equipment_rental',
        base_price: 10.00,
        currency: 'USD',
        is_active: true,
        created_by: companyAdmin.id
      });
      console.log('  ✓ Service: Equipment Rental');
    }

    // Service Branch Availability
    await ServiceBranchAvailability.findOrCreate({
      where: { service_id: service1.id, branch_id: branch1.id },
      defaults: {
        id: generateUUID(),
        service_id: service1.id,
        branch_id: branch1.id,
        is_available: true,
        created_by: companyAdmin.id
      }
    });
    console.log('  ✓ Created service branch availability');

    // ============================================================================
    // 7. TAX RATES
    // ============================================================================
    console.log('\nCreating tax rates...');
    await TaxRate.findOrCreate({
      where: { company_id: company1.id, name: 'Sales Tax' },
      defaults: {
        id: generateUUID(),
        company_id: company1.id,
        branch_id: null,
        name: 'Sales Tax',
        rate_percentage: 8.5,
        tax_type: 'sales_tax',
        applies_to: 'all',
        valid_from: new Date().toISOString().split('T')[0],
        is_active: true,
        created_by: companyAdmin.id
      }
    });
    console.log('  ✓ Created tax rate');

    // ============================================================================
    // 8. MEMBERSHIP PLANS
    // ============================================================================
    console.log('\nCreating membership plans...');
    let plan1 = await MembershipPlan.findOne({ where: { company_id: company1.id, name: 'Monthly Unlimited' } });
    if (!plan1 && service1) {
      plan1 = await MembershipPlan.create({
        id: generateUUID(),
        company_id: company1.id,
        service_id: service1.id,
        name: 'Monthly Unlimited',
        description: 'Unlimited court access for one month',
        plan_type: 'recurring',
        plan_scope: 'company_wide',
        price: 99.99,
        billing_type: 'monthly',
        currency: 'USD',
        max_active_per_user: 1,
        is_active: true,
        created_by: companyAdmin.id
      });

      await MembershipPlanBenefit.create({
        id: generateUUID(),
        membership_plan_id: plan1.id,
        benefit_type: 'discount',
        benefit_value: 20.00,
        description: '20% off all bookings',
        created_by: companyAdmin.id
      });

      console.log('  ✓ Plan: Monthly Unlimited ($99.99/month)');
    }

    let plan2 = await MembershipPlan.findOne({ where: { company_id: company1.id, name: '10-Session Pass' } });
    if (!plan2 && service1) {
      plan2 = await MembershipPlan.create({
        id: generateUUID(),
        company_id: company1.id,
        service_id: service1.id,
        name: '10-Session Pass',
        description: 'Prepaid pass for 10 sessions',
        plan_type: 'prepaid_pass',
        plan_scope: 'company_wide',
        price: 200.00,
        billing_type: 'prepaid_passes',
        currency: 'USD',
        max_active_per_user: 1,
        is_active: true,
        created_by: companyAdmin.id
      });
      console.log('  ✓ Plan: 10-Session Pass ($200.00)');
    }

    // Customer Memberships
    if (customers.length > 0 && plan1) {
      const membership = await CustomerMembership.create({
        id: generateUUID(),
        user_id: customers[0].id,
        membership_plan_id: plan1.id,
        company_id: company1.id,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_by: customers[0].id
      });

      // Membership Cycle
      const cycleStartDate = new Date();
      const cycleEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await MembershipCycle.create({
        id: generateUUID(),
        customer_membership_id: membership.id,
        cycle_number: 1,
        period_start_date: cycleStartDate.toISOString().split('T')[0],
        period_end_date: cycleEndDate.toISOString().split('T')[0],
        billing_date: cycleStartDate.toISOString().split('T')[0],
        amount: 99.99,
        discount_amount: 0.00,
        tax_amount: 0.00,
        total_amount: 99.99,
        payment_status: 'succeeded',
        created_by: customers[0].id
      });

      // Membership Usage Ledger
      await MembershipUsageLedger.create({
        id: generateUUID(),
        customer_membership_id: membership.id,
        benefit_type: 'usage',
        amount: 1.00,
        quantity: 1,
        description: 'Court booking used',
        period_start_date: cycleStartDate.toISOString().split('T')[0],
        period_end_date: cycleEndDate.toISOString().split('T')[0],
        created_by: customers[0].id
      });

      console.log('  ✓ Created customer membership');
    }

    // ============================================================================
    // 9. CAMPAIGNS & PROMO CODES
    // ============================================================================
    console.log('\nCreating campaigns and promo codes...');
    const campaignStartDate = new Date().toISOString().split('T')[0];
    const campaignEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const campaign = await Campaign.create({
      id: generateUUID(),
      company_id: company1.id,
      name: 'Summer Special',
      description: 'Summer discount campaign',
      discount_type: 'percent_off',
      discount_value: 15.00,
      applicability: 'all',
      start_date: campaignStartDate,
      end_date: campaignEndDate,
      is_active: true,
      created_by: companyAdmin.id
    });

    await CampaignRule.create({
      id: generateUUID(),
      campaign_id: campaign.id,
      rule_type: 'minimum_amount',
      rule_value: '50.00',
      created_by: companyAdmin.id
    });

    const promoCode = await PromoCode.create({
      id: generateUUID(),
      company_id: company1.id,
      campaign_id: campaign.id,
      code: 'SUMMER2024',
      discount_type: 'percentage',
      discount_value: 15.00,
      max_uses: 100,
      used_count: 5,
      is_active: true,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      created_by: companyAdmin.id
    });
    console.log('  ✓ Created campaign and promo code: SUMMER2024');

    // ============================================================================
    // 10. COMPANY CUSTOMERS (Subscriptions)
    // ============================================================================
    console.log('\nCreating company subscriptions...');
    for (let i = 0; i < Math.min(3, customers.length); i++) {
      if (!await CompanyCustomer.findOne({ where: { user_id: customers[i].id, company_id: company1.id } })) {
        await CompanyCustomer.create({
          id: generateUUID(),
          user_id: customers[i].id,
          company_id: company1.id,
          default_branch_id: branch1.id,
          status: 'active',
          marketing_opt_in: i === 0,
          created_by: customers[i].id
        });
      }
    }
    console.log('  ✓ Created company subscriptions');

    // ============================================================================
    // 11. BOOKINGS
    // ============================================================================
    console.log('\nCreating bookings...');
    let booking = null;
    if (customers.length > 0 && courts.length > 0 && service1) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);

      booking = await Booking.findOne({ where: { user_id: customers[0].id, company_id: company1.id } });
      if (!booking) {
        const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        booking = await Booking.create({
          id: generateUUID(),
          booking_number: bookingNumber,
          user_id: customers[0].id,
          company_id: company1.id,
          branch_id: branch1.id,
          status: 'confirmed',
          booking_source: 'customer_web',
          subtotal: 30.00,
          total_amount: 30.00,
          created_by: customers[0].id
        });

        const durationMinutes = Math.round((endTime - tomorrow) / (1000 * 60));
        const bookingItem = await BookingItem.create({
          id: generateUUID(),
          booking_id: booking.id,
          company_id: company1.id,
          branch_id: branch1.id,
          court_id: courts[0].id,
          service_id: service1.id,
          start_datetime: tomorrow,
          end_datetime: endTime,
          duration_minutes: durationMinutes,
          quantity: 1,
          unit_price: 30.00,
          subtotal: 30.00,
          total_amount: 30.00,
          created_by: customers[0].id
        });

        // Booking Participants
        await BookingParticipant.create({
          id: generateUUID(),
          booking_id: booking.id,
          booking_item_id: bookingItem.id,
          user_id: customers[1]?.id || customers[0].id,
          role: 'player',
          created_by: customers[0].id
        });

        // Booking Change Log
        await BookingChangeLog.create({
          id: generateUUID(),
          booking_id: booking.id,
          changed_by: customers[0].id,
          change_type: 'created',
          old_values: {},
          new_values: { status: 'confirmed' },
          reason: 'Initial booking',
          created_by: customers[0].id
        });

        // Court Time Slot
        await CourtTimeSlot.create({
          id: generateUUID(),
          court_id: courts[0].id,
          slot_start_datetime: tomorrow,
          slot_end_datetime: endTime,
          booking_id: booking.id,
          is_locked: true,
          created_by: customers[0].id
        });

        console.log('  ✓ Created booking with items and participants');
      }

      // Booking Waitlist
      if (customers.length > 1 && courts.length > 0) {
        const waitlistTime = new Date(tomorrow);
        waitlistTime.setHours(12, 0, 0, 0);
        const waitlistEndTime = new Date(waitlistTime.getTime() + 60 * 60 * 1000);
        await BookingWaitlist.create({
          id: generateUUID(),
          user_id: customers[1].id,
          company_id: company1.id,
          branch_id: branch1.id,
          court_id: courts[0].id,
          requested_start_datetime: waitlistTime,
          requested_end_datetime: waitlistEndTime,
          priority: 1,
          status: 'pending',
          created_by: customers[1].id
        });
        console.log('  ✓ Created booking waitlist entry');
      }
    }

    // ============================================================================
    // 12. GROUPS
    // ============================================================================
    console.log('\nCreating groups...');
    if (customers.length >= 3 && company1) {
      const group = await Group.create({
        id: generateUUID(),
        company_id: company1.id,
        name: 'Weekend Players',
        description: 'Regular weekend pickleball group',
        created_by_user_id: customers[0].id,
        is_active: true
      });

      for (let i = 0; i < 3; i++) {
        await GroupMember.create({
          id: generateUUID(),
          group_id: group.id,
          user_id: customers[i].id,
          role: i === 0 ? 'admin' : 'member',
          created_by: customers[0].id
        });
      }
      console.log('  ✓ Created group with members');
    }

    // ============================================================================
    // 13. PAYMENTS & INVOICES
    // ============================================================================
    console.log('\nCreating payments and invoices...');
    let payment = null;
    let invoice = null;
    if (booking) {
      payment = await Payment.create({
        id: generateUUID(),
        user_id: customers[0].id,
        company_id: company1.id,
        booking_id: booking.id,
        amount: 30.00,
        currency: 'USD',
        payment_method: 'credit_card',
        payment_status: 'succeeded',
        provider: 'stripe',
        provider_transaction_id: 'TXN-' + Date.now(),
        paid_at: new Date(),
        created_by: customers[0].id
      });

      invoice = await Invoice.create({
        id: generateUUID(),
        user_id: customers[0].id,
        company_id: company1.id,
        branch_id: branch1.id,
        invoice_number: 'INV-' + Date.now(),
        subtotal: 30.00,
        tax_amount: 2.55,
        discount_amount: 0.00,
        total_amount: 32.55,
        currency: 'USD',
        invoice_status: 'paid',
        due_date: new Date().toISOString().split('T')[0],
        paid_at: new Date(),
        created_by: customers[0].id
      });

      await InvoiceItem.create({
        id: generateUUID(),
        invoice_id: invoice.id,
        item_type: 'booking',
        item_reference_id: booking.id,
        description: 'Court Rental',
        quantity: 1,
        unit_price: 30.00,
        discount_amount: 0.00,
        tax_amount: 2.55,
        total_amount: 32.55,
        created_by: customers[0].id
      });

      // Discount Application
      if (promoCode && campaign) {
        await DiscountApplication.create({
          id: generateUUID(),
          campaign_id: campaign.id,
          promo_code_id: promoCode.id,
          user_id: customers[0].id,
          booking_id: booking.id,
          discount_amount: 4.50,
          applied_at: new Date(),
          created_by: customers[0].id
        });
      }

      console.log('  ✓ Created payment and invoice');
    }

    // Payment Attempts (requires a payment_id, so create a failed payment first)
    if (customers.length > 1 && booking) {
      const failedPayment = await Payment.create({
        id: generateUUID(),
        user_id: customers[1].id,
        company_id: company1.id,
        booking_id: booking.id,
        amount: 50.00,
        currency: 'USD',
        payment_method: 'credit_card',
        payment_status: 'failed',
        failure_reason: 'Insufficient funds',
        created_by: customers[1].id
      });

      await PaymentAttempt.create({
        id: generateUUID(),
        payment_id: failedPayment.id,
        attempt_number: 1,
        amount: 50.00,
        payment_method: 'credit_card',
        status: 'failed',
        failure_reason: 'Insufficient funds',
        created_by: customers[1].id
      });
      console.log('  ✓ Created payment attempt');
    }

    // ============================================================================
    // 14. REFUNDS
    // ============================================================================
    console.log('\nCreating refunds...');
    if (payment) {
      await Refund.create({
        id: generateUUID(),
        payment_id: payment.id,
        company_id: company1.id,
        amount: 15.00,
        currency: 'USD',
        reason: 'Partial refund for cancellation',
        refund_status: 'completed',
        processed_at: new Date(),
        created_by: companyAdmin.id
      });
      console.log('  ✓ Created refund');
    }

    // ============================================================================
    // 15. WALLET & GIFT CARDS
    // ============================================================================
    console.log('\nCreating wallet and gift cards...');
    if (customers.length > 0 && company1) {
      // Gift Card
      const giftCard = await GiftCard.create({
        id: generateUUID(),
        company_id: company1.id,
        code: 'GIFT-' + Date.now().toString().slice(-8).toUpperCase(),
        initial_amount: 100.00,
        current_balance: 50.00,
        currency: 'USD',
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        assigned_to_user_id: customers[0].id,
        purchased_by_user_id: customers[0].id,
        created_by: companyAdmin.id
      });

      // Wallet Ledger (from gift card redemption)
      const walletLedger = await CustomerWalletLedger.create({
        id: generateUUID(),
        user_id: customers[0].id,
        company_id: company1.id,
        transaction_type: 'credit',
        amount: 50.00,
        balance_after: 50.00,
        reference_type: 'gift_card',
        reference_id: giftCard.id,
        description: 'Gift card redemption',
        created_by: customers[0].id
      });

      // Gift Card Redemption
      await GiftCardRedemption.create({
        id: generateUUID(),
        gift_card_id: giftCard.id,
        wallet_ledger_id: walletLedger.id,
        amount_used: 50.00,
        redeemed_at: new Date(),
        created_by: customers[0].id
      });

      console.log('  ✓ Created wallet ledger and gift card');
    }

    // ============================================================================
    // 16. NOTIFICATIONS
    // ============================================================================
    console.log('\nCreating notifications...');
    // Notification Templates
    if (company1) {
      const notificationTemplate = await NotificationTemplate.create({
        id: generateUUID(),
        company_id: company1.id,
        template_name: 'booking_confirmation',
        subject: 'Booking Confirmed',
        body_template: 'Your booking has been confirmed.',
        notification_type: 'booking_confirmation',
        channel: 'email',
        is_active: true,
        created_by: companyAdmin.id
      });

      // Notification Outbox
      if (customers.length > 0) {
        const notificationOutbox = await NotificationOutbox.create({
          id: generateUUID(),
          user_id: customers[0].id,
          template_id: notificationTemplate.id,
          notification_type: 'welcome',
          channel: 'email',
          recipient_email: customers[0].email,
          subject: 'Welcome!',
          body: 'Welcome to Pickleball Paradise!',
          status: 'sent',
          sent_at: new Date(),
          created_by: companyAdmin.id
        });

        // Notification Delivery Log
        await NotificationDeliveryLog.create({
          id: generateUUID(),
          notification_id: notificationOutbox.id,
          status: 'delivered',
          logged_at: new Date(),
          created_by: companyAdmin.id
        });
      }
    }

    // User Notification Preferences
    if (customers.length > 0 && company1) {
      await UserNotificationPreference.create({
        id: generateUUID(),
        user_id: customers[0].id,
        notification_type: 'booking_confirmation',
        channel: 'email',
        is_enabled: true,
        created_by: customers[0].id
      });
    }
    console.log('  ✓ Created notification templates and preferences');

    // ============================================================================
    // 17. REVIEWS
    // ============================================================================
    console.log('\nCreating reviews...');
    if (customers.length > 0 && company1) {
      for (let i = 0; i < Math.min(3, customers.length); i++) {
        if (!await Review.findOne({ where: { user_id: customers[i].id, company_id: company1.id } })) {
          await Review.create({
            id: generateUUID(),
            user_id: customers[i].id,
            company_id: company1.id,
            branch_id: branch1.id,
            rating: 4 + i,
            title: `Review ${i + 1}`,
            comment: `Great experience ${i + 1}!`,
            status: 'approved',
            created_by: customers[i].id
          });
        }
      }
      console.log('  ✓ Created reviews');
    }

    // ============================================================================
    // 18. SUPPORT TICKETS
    // ============================================================================
    console.log('\nCreating support tickets...');
    if (customers.length > 0) {
      const ticket = await SupportTicket.create({
        id: generateUUID(),
        ticket_number: 'TKT-' + Date.now(),
        user_id: customers[0].id,
        company_id: company1.id,
        branch_id: branch1.id,
        subject: 'Question about membership',
        status: 'open',
        priority: 'medium',
        created_by: customers[0].id
      });

      await SupportTicketMessage.create({
        id: generateUUID(),
        ticket_id: ticket.id,
        user_id: customers[0].id,
        message: 'I have a question about my membership benefits.',
        is_internal: false,
        created_by: customers[0].id
      });

      await SupportTicketMessage.create({
        id: generateUUID(),
        ticket_id: ticket.id,
        user_id: companyAdmin.id,
        message: 'Thank you for contacting us. We will review your membership.',
        is_internal: true,
        created_by: companyAdmin.id
      });

      console.log('  ✓ Created support ticket with messages');
    }

    // ============================================================================
    // 19. AUDIT LOGS
    // ============================================================================
    console.log('\nCreating audit logs...');
    if (platformAdmin && company1) {
      await AuditLog.create({
        id: generateUUID(),
        actor_user_id: platformAdmin.id,
        action: 'create',
        entity_type: 'company',
        entity_id: company1.id,
        metadata: { name: company1.name },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Test)'
      });
      console.log('  ✓ Created audit log');
    }
    console.log('  ✓ Created audit log');

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('COMPREHENSIVE SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nTest Credentials:');
    console.log('  Platform Admin: admin@platform.com / Admin123!');
    console.log('  Company Admin:  company@admin.com / Company123!');
    console.log('  Branch Manager: branch@manager.com / Branch123!');
    console.log('  Branch Staff:   staff@branch.com / Staff123!');
    console.log('  Customer 1-5:   customer1@test.com / Customer123!');
    console.log('\nTest Data Summary:');
    console.log(`  Companies: 2`);
    console.log(`  Branches: 2`);
    console.log(`  Courts: ${courts.length}`);
    console.log(`  Services: 2`);
    console.log(`  Membership Plans: 2`);
    console.log(`  Customers: ${customers.length}`);
    console.log(`  Bookings: 1+`);
    console.log(`  Payments: 1+`);
    console.log(`  Invoices: 1+`);
    console.log(`  Reviews: 3+`);
    console.log(`  Support Tickets: 1+`);
    console.log(`  Promo Code: SUMMER2024`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();

