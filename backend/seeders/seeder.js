import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { connectDB } from '../config/db.js';
import AuditLogsService from '../services/audit.logs.service.js';

const __dirname = dirname(fileURLToPath(new URL(import.meta.url)));
const seedDataPath = path.join(__dirname, 'seed-data.json');
const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

const ADMIN_CREATOR_ID = new ObjectId();

// Seed Admins
async function seedAdmins(db, actor) {
    console.log('\n=== Seeding Admins ===');
    const adminsCollection = db.collection('admins');
    for (const adminData of seedData.admins) {
        const existingAdmin = await adminsCollection.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log(`  ⏭️  Admin ${adminData.email} already exists, skipping...`);
            continue;
        }
        const hashedPassword = await hashPassword(adminData.password || '123123123');
        const sanitized = {
            first_name: adminData.first_name.trim(),
            last_name: adminData.last_name.trim(),
            email: adminData.email.trim().toLowerCase(),
            password: hashedPassword,
            role: adminData.role.trim().toLowerCase(),
            user_type: adminData.user_type.trim().toLowerCase(),
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null,
        };
        const result = await adminsCollection.insertOne(sanitized);
        await AuditLogsService.auditWrap({
            action: 'ADMIN_CREATED', entity: 'admins', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created admin ${sanitized.first_name} ${sanitized.last_name}`,
            fn: async () => result
        });
        console.log(`  ✅ Created admin: ${sanitized.email} (${sanitized.role})`);
    }
}

// Seed Clients
async function seedClients(db, actor) {
    console.log('\n=== Seeding Clients ===');
    const clientsCollection = db.collection('clients');
    const seededClients = [];
    for (let i = 0; i < seedData.clients.length; i++) {
        const clientData = seedData.clients[i];
        const existingClient = await clientsCollection.findOne({ email: clientData.email });
        if (existingClient) {
            console.log(`  ⏭️  Client ${clientData.email} already exists, skipping...`);
            seededClients.push(existingClient);
            continue;
        }
        const hashedPassword = await hashPassword(clientData.password || '123123123');
        const now = new Date();
        const sanitized = {
            first_name: clientData.first_name.trim(),
            last_name: clientData.last_name.trim(),
            email: clientData.email.trim().toLowerCase(),
            phone: clientData.phone,
            address: clientData.address,
            password: hashedPassword,
            role: 'client',
            user_type: 'client',
            status: 'active',
            is_discounted: false,
            gender: clientData.gender,
            date_of_birth: clientData.date_of_birth ? new Date(clientData.date_of_birth) : null,
            height: clientData.height,
            weight: clientData.weight,
            bmi: clientData.bmi,
            fitness_goal: clientData.fitness_goal || [],
            medical_condition: clientData.medical_condition,
            training_type: clientData.training_type,
            experience_level: clientData.experience_level,
            days_per_week: clientData.days_per_week,
            session_minutes: clientData.session_minutes,
            emergency_name: clientData.emergency_name,
            emergency_contact: clientData.emergency_contact,
            emergency_relationship: clientData.emergency_relationship,
            qr_code: null,
            createdAt: now,
            createdBy: 'self',
            updatedAt: now,
            updatedBy: 'self',
            archivedAt: null,
            archivedBy: null
        };
        const result = await clientsCollection.insertOne(sanitized);
        const createdClient = { ...sanitized, _id: result.insertedId };
        seededClients.push(createdClient);
        await AuditLogsService.auditWrap({
            action: 'CLIENT_CREATED', entity: 'clients', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created client ${createdClient.first_name} ${createdClient.last_name}`,
            fn: async () => createdClient
        });
        console.log(`  ✅ Created client: ${createdClient.email}`);
    }
    return seededClients;
}

// Seed Trainers
async function seedTrainers(db, actor) {
    console.log('\n=== Seeding Trainers ===');
    const trainersCollection = db.collection('trainers');
    const seededTrainers = [];
    for (let i = 0; i < seedData.trainers.length; i++) {
        const trainerData = seedData.trainers[i];
        const existingTrainer = await trainersCollection.findOne({ email: trainerData.email });
        if (existingTrainer) {
            console.log(`  ⏭️  Trainer ${trainerData.email} already exists, skipping...`);
            seededTrainers.push(existingTrainer);
            continue;
        }
        const hashedPassword = await hashPassword('123123123');
        const sanitized = {
            first_name: trainerData.first_name.trim(),
            last_name: trainerData.last_name.trim(),
            email: trainerData.email.trim(),
            phone: trainerData.phone.trim(),
            password: hashedPassword,
            role: 'trainer',
            user_type: 'trainer',
            status: 'active',
            specialization: Array.isArray(trainerData.specialization)
                ? trainerData.specialization.map(s => s.trim().toLowerCase())
                : [trainerData.specialization.trim().toLowerCase()],
            certification: trainerData.certification?.trim(),
            availability: {
                days: Array.isArray(trainerData.availability.days)
                    ? trainerData.availability.days.map(d => String(d).trim().toLowerCase())
                    : [String(trainerData.availability.days).trim().toLowerCase()],
                time_from: String(trainerData.availability.time_from).trim(),
                time_to: String(trainerData.availability.time_to).trim()
            },
            rate: Number(trainerData.rate),
            max_hours: Number(trainerData.max_hours),
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: new Date(),
            updatedBy: actor._id,
            archivedAt: null,
            archivedBy: null
        };
        const result = await trainersCollection.insertOne(sanitized);
        const createdTrainer = { ...sanitized, _id: result.insertedId };
        seededTrainers.push(createdTrainer);
        await AuditLogsService.auditWrap({
            action: 'TRAINER_CREATED', entity: 'trainers', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created trainer ${createdTrainer.first_name} ${createdTrainer.last_name}`,
            fn: async () => createdTrainer
        });
        console.log(`  ✅ Created trainer: ${createdTrainer.email}`);
    }
    return seededTrainers;
}

// Seed Membership Configs
async function seedMembershipConfigs(db, actor) {
    console.log('\n=== Seeding Membership Configs ===');
    const configsCollection = db.collection('membership_config');
    const seededConfigs = [];
    for (const configData of seedData.membership_configs) {
        const existingConfig = await configsCollection.findOne({ name: configData.name });
        if (existingConfig) {
            console.log(`  ⏭️  Membership config ${configData.name} already exists, skipping...`);
            seededConfigs.push(existingConfig);
            continue;
        }
        const sanitized = {
            name: configData.name.trim(),
            perks: configData.perks,
            fee: Number(configData.fee),
            duration: configData.duration.trim().toLowerCase(),
            duration_days: Number(configData.duration_days),
            version: seededConfigs.length + 1,
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        };
        const result = await configsCollection.insertOne(sanitized);
        seededConfigs.push({ ...sanitized, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'MEMBERSHIP_CONFIG_CREATED', entity: 'membership_config', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created membership config ${sanitized.name}`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created membership config: ${sanitized.name} (${sanitized.duration})`);
    }
    return seededConfigs;
}

// Seed Plans
async function seedPlans(db, actor) {
    console.log('\n=== Seeding Plans ===');
    const plansCollection = db.collection('plans');
    const seededPlans = [];
    for (const planData of seedData.plans) {
        const existingPlan = await plansCollection.findOne({ label: planData.label });
        if (existingPlan) {
            console.log(`  ⏭️  Plan ${planData.label} already exists, skipping...`);
            seededPlans.push(existingPlan);
            continue;
        }
        const sanitized = {
            label: planData.label.trim(),
            duration_days: Number(planData.duration_days),
            status: planData.status.trim().toLowerCase(),
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        };
        const result = await plansCollection.insertOne(sanitized);
        seededPlans.push({ ...sanitized, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'PLAN_CREATED', entity: 'plans', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created plan ${sanitized.label}`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created plan: ${sanitized.label} (${sanitized.duration_days} days)`);
    }
    return seededPlans;
}

// Seed Pricing
async function seedPricing(db, actor) {
    console.log('\n=== Seeding Pricing ===');
    const pricingCollection = db.collection('pricing');
    const seededPricing = [];
    for (const pricingData of seedData.pricing) {
        const existingPricing = await pricingCollection.findOne({ plan_label: pricingData.plan_label });
        if (existingPricing) {
            console.log(`  ⏭️  Pricing for ${pricingData.plan_label} already exists, skipping...`);
            seededPricing.push(existingPricing);
            continue;
        }
        const sanitized = {
            plan_label: pricingData.plan_label.trim(),
            price: Number(pricingData.price),
            membership_fee: Number(pricingData.membership_fee),
            currency: 'PHP',
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        };
        const result = await pricingCollection.insertOne(sanitized);
        seededPricing.push({ ...sanitized, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'PRICING_CREATED', entity: 'pricing', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created pricing for ${sanitized.plan_label}`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created pricing: ${sanitized.plan_label} - ₱${sanitized.price}`);
    }
    return seededPricing;
}

// Seed Classes
async function seedClasses(db, actor) {
    console.log('\n=== Seeding Classes ===');
    const classesCollection = db.collection('classes');
    const seededClasses = [];
    for (const classData of seedData.classes) {
        const existingClass = await classesCollection.findOne({ _id: new ObjectId(classData._id) });
        if (existingClass) {
            console.log(`  ⏭️  Class ${classData.name} already exists, skipping...`);
            seededClasses.push(existingClass);
            continue;
        }
        const sanitized = {
            _id: new ObjectId(classData._id),
            name: classData.name.trim(),
            duration: Number(classData.duration),
            status: classData.status.trim().toLowerCase(),
            active: classData.status === 'active' ? 'active' : 'inactive',
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null
        };
        const result = await classesCollection.insertOne(sanitized);
        seededClasses.push({ ...sanitized, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'CLASS_CREATED', entity: 'classes', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created class ${sanitized.name}`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created class: ${sanitized.name} (${sanitized.duration} mins)`);
    }
    return seededClasses;
}

// Seed Class Schedules - 1 schedule per class with client bookings
async function seedClassSchedules(db, actor, trainers, classes, clients) {
    console.log('\n=== Seeding Class Schedules ===');
    const schedulesCollection = db.collection('class_schedule');
    const bookingsCollection = db.collection('bookings');
    const seededSchedules = [];
    const startBase = new Date();
    startBase.setHours(8, 0, 0, 0);
    // Create exactly 1 schedule for each class
    for (let i = 0; i < classes.length; i++) {
        const classItem = classes[i];
        const randomTrainer = trainers.length > 0 ? trainers[i % trainers.length] : null;
        const scheduleDate = new Date(startBase);
        scheduleDate.setDate(scheduleDate.getDate() + (i * 2)); // Every 2 days
        const startAt = new Date(scheduleDate);
        const endAt = new Date(scheduleDate.getTime() + (classItem.duration || 45) * 60000);
        const existingSchedule = await schedulesCollection.findOne({
            class_id: new ObjectId(classItem._id),
            start_at: startAt,
            status: 'open'
        });
        if (existingSchedule) {
            console.log(`  ⏭️  ${classItem.name} at ${startAt.toISOString().split('T')[0]} exists, skipping...`);
            seededSchedules.push({ ...existingSchedule, _id: existingSchedule._id });
            continue;
        }
        const capacity = Math.max(15, Math.ceil(clients.length / 2));
        const numBookedClients = Math.min(Math.floor(Math.random() * 8) + 5, clients.length);
        const data = {
            class_id: new ObjectId(classItem._id),
            start_at: startAt,
            end_at: endAt,
            capacity: capacity,
            trainer_id: randomTrainer ? new ObjectId(randomTrainer._id) : null,
            location: "6Pack Iron City",
            notes: `Scheduled ${classItem.name} session`,
            status: "open",
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        };
        const result = await schedulesCollection.insertOne(data);
        const schedule = { ...data, _id: result.insertedId };
        seededSchedules.push(schedule);
        await AuditLogsService.auditWrap({
            action: 'CLASS_SCHEDULE_CREATED', entity: 'class_schedule', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} scheduled ${classItem.name}`,
            fn: async () => ({ _id: result.insertedId })
        });
        // Create client bookings for this schedule
        const selectedClients = clients.sort(() => 0.5 - Math.random()).slice(0, numBookedClients);
        for (const client of selectedClients) {
            const bookingData = {
                schedule_id: new ObjectId(schedule._id),
                client_id: new ObjectId(client._id),
                status: "joined",
                type: 'class',
                joinedAt: new Date(startAt.getTime() - 3600000),
                cancelledAt: null, cancelledBy: null, cancelReason: null,
                createdAt: new Date(),
                createdBy: new ObjectId(client._id),
                updatedAt: null, updatedBy: null
            };
            const bookingResult = await bookingsCollection.insertOne(bookingData);
            await AuditLogsService.auditWrap({
                action: 'CLASS_BOOKING_CREATED', entity: 'bookings', entity_id: bookingResult.insertedId,
                actor, meta: { method: 'seeder' },
                summary: `${client.first_name} ${client.last_name} booked ${classItem.name}`,
                fn: async () => ({ _id: bookingResult.insertedId })
            });
        }
        console.log(`  ✅ ${classItem.name} | Cap: ${capacity} | Booked: ${selectedClients.length}/${clients.length} | T: ${randomTrainer ? randomTrainer.first_name : 'TBD'}`);
    }
    console.log(`  ➕ Total: ${seededSchedules.length} schedules`);
    return seededSchedules;
}

// Seed Client Passes
async function seedClientPasses(db, actor, seededClients, seededPlans, seededPricing) {
    console.log('\n=== Seeding Client Passes ===');
    const clientPassCollection = db.collection('clients_pass');
    const seededPasses = [];
    for (let i = 0; i < Math.min(10, seededClients.length); i++) {
        const client = seededClients[i];
        const randomPlan = seededPlans[Math.floor(Math.random() * seededPlans.length)];
        const planPricing = seededPricing.find(p => p.plan_label === randomPlan.label);
        if (!planPricing) {
            console.log(`  ⏭️  No pricing found for ${randomPlan.label}, skipping...`);
            continue;
        }
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + randomPlan.duration_days * 24 * 60 * 60 * 1000);
        const statuses = ['active', 'expired', 'cancelled'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const data = {
            client_id: new ObjectId(client._id),
            plan_id: new ObjectId(randomPlan._id),
            pricing_id: new ObjectId(planPricing._id),
            start_date: startDate,
            end_date: endDate,
            payment_id: new ObjectId(),
            reference_no: `REF-${Date.now()}-${i}`,
            duration_days: String(randomPlan.duration_days).trim().toLowerCase(),
            status: randomStatus,
            createdAt: new Date(),
            createdBy: actor._id,
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        };
        const result = await clientPassCollection.insertOne(data);
        seededPasses.push({ ...data, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'CLIENT_PASS_CREATED', entity: 'clients_pass', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created client pass for ${client.first_name}`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created client pass for ${client.first_name} (${randomPlan.label})`);
    }
    return seededPasses;
}

// Seed Memberships
async function seedMemberships(db, actor, seededClients) {
    console.log('\n=== Seeding Memberships ===');
    const membershipCollection = db.collection('memberships');
    const seededMemberships = [];
    const statuses = ['active', 'expired', 'cancelled', 'pending'];
    for (let i = 0; i < Math.min(30, seededClients.length); i++) {
        const client = seededClients[i];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const startDate = new Date();
        if (status === 'expired') startDate.setDate(startDate.getDate() - 45);
        else if (status === 'active') startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
        else if (status === 'pending') startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 7));
        else startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const isFrozen = Math.random() > 0.9 && status === 'active';
        const data = {
            client_id: new ObjectId(client._id),
            payment_id: Math.random() > 0.3 ? new ObjectId() : null,
            start_date: startDate,
            end_date: endDate,
            status: status,
            is_frozen: isFrozen,
            frozen_from: isFrozen ? new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
            frozen_til: isFrozen ? new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000) : null,
            frozenBy: isFrozen ? actor._id : null,
            unfrozenAt: null,
            createdAt: startDate,
            createdBy: new ObjectId(client._id),
            updatedAt: null,
            updatedBy: null,
            archivedAt: status === 'cancelled' ? new Date() : null,
            archivedBy: status === 'cancelled' ? actor._id : null
        };
        const result = await membershipCollection.insertOne(data);
        seededMemberships.push({ ...data, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'MEMBERSHIP_CREATED', entity: 'memberships', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${actor.first_name} ${actor.last_name} created ${status} membership for ${client.first_name}`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created ${status} membership for ${client.first_name}`);
    }
    return seededMemberships;
}

// Seed Discount Requests
async function seedDiscountRequests(db, actor, seededClients) {
    console.log('\n=== Seeding Discount Requests ===');
    const discountRequestCollection = db.collection('discount_requests');
    const seededRequests = [];
    const statuses = ['pending', 'approved', 'rejected'];
    const requestCount = 15;
    for (let i = 0; i < requestCount; i++) {
        const client = seededClients[Math.floor(Math.random() * seededClients.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const data = {
            client_id: new ObjectId(client._id),
            selfie_url: `/uploads/selfie_${client._id}_${i}.jpg`,
            id_url: `/uploads/id_${client._id}_${i}.jpg`,
            status: status,
            reviewed_at: status !== 'pending' ? new Date() : null,
            reviewed_by: status !== 'pending' ? actor._id : null,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            createdBy: new ObjectId(client._id)
        };
        const result = await discountRequestCollection.insertOne(data);
        seededRequests.push({ ...data, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'DISCOUNT_REQUEST_CREATED', entity: 'discount_requests', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${client.first_name} ${client.last_name} created discount request (${status})`,
            fn: async () => ({ _id: result.insertedId })
        });
        console.log(`  ✅ Created discount request for ${client.first_name} (${status})`);
    }
    return seededRequests;
}

// Seed Payments
async function seedPayments(db, actor, seededClients, seededPlans, seededPricing) {
    console.log('\n=== Seeding Payments ===');
    const paymentCollection = db.collection('payments');
    const seededPayments = [];
    const paymentFors = ['membership', 'daily_pass', 'trainer-booking'];
    const statuses = ['PENDING', 'PAID', 'FAILED', 'EXPIRED'];
    const paymentMethods = ['gcash', 'paymaya', 'credit_card', 'cash'];
    for (let i = 0; i < 50; i++) {
        const client = seededClients[Math.floor(Math.random() * seededClients.length)];
        const paymentFor = paymentFors[Math.floor(Math.random() * paymentFors.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        let planId = null;
        let pricingId = null;
        if (paymentFor === 'membership') {
            const randomPlan = seededPlans[Math.floor(Math.random() * seededPlans.length)];
            planId = new ObjectId(randomPlan._id);
            const planPricing = seededPricing.find(p => p.plan_label === randomPlan.label);
            pricingId = planPricing ? new ObjectId(planPricing._id) : null;
        }
        const amount = Math.floor(Math.random() * 5000) + 1000;
        const now = new Date();
        now.setDate(now.getDate() - Math.floor(Math.random() * 60));
        const data = {
            client_id: new ObjectId(client._id),
            first_name: client.first_name,
            last_name: client.last_name,
            provider: 'xendit',
            external_id: `ext_${Date.now()}_${i}`,
            amount: amount,
            status: status,
            payment_for: paymentFor,
            reference_no: `REF-${Date.now()}-${i}`,
            payment_method: paymentMethod,
            raw_response: { id: `xendit_${i}`, status: status.toLowerCase(), amount: amount },
            plan_id: planId,
            pricing_id: pricingId,
            createdAt: now,
            createdBy: new ObjectId(client._id),
            updatedAt: status === 'PAID' ? now : null,
            updatedBy: status === 'PAID' ? new ObjectId(client._id) : null
        };
        const result = await paymentCollection.insertOne(data);
        seededPayments.push({ ...data, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'PAYMENT_CREATED', entity: 'payments', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${client.first_name} ${client.last_name} - ${paymentFor} payment (${status}) - ₱${amount}`,
            fn: async () => ({ _id: result.insertedId })
        });
    }
    console.log(`  ✅ Created ${seededPayments.length} payments`);
    return seededPayments;
}

// Seed Bookings (Class) - extra beyond what's in schedules
async function seedClassBookings(db, actor, seededClients, seededSchedules) {
    console.log('\n=== Seeding Class Bookings (extra) ===');
    const bookingCollection = db.collection('bookings');
    const seededBookings = [];
    const openSchedules = seededSchedules.filter(s => s.status === 'open');
    for (let i = 0; i < Math.min(10, openSchedules.length); i++) {
        const schedule = openSchedules[i];
        const client = seededClients[Math.floor(Math.random() * seededClients.length)];
        const existingBooking = await bookingCollection.findOne({
            schedule_id: new ObjectId(schedule._id),
            client_id: new ObjectId(client._id)
        });
        if (existingBooking) continue;
        const statuses = ['joined', 'cancelled'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const data = {
            schedule_id: new ObjectId(schedule._id),
            client_id: new ObjectId(client._id),
            status: randomStatus,
            type: 'class',
            joinedAt: randomStatus === 'joined' ? new Date(schedule.start_at.getTime() - 3600000) : null,
            cancelledAt: randomStatus === 'cancelled' ? new Date() : null,
            cancelledBy: randomStatus === 'cancelled' ? actor._id : null,
            cancelReason: randomStatus === 'cancelled' ? 'schedule_conflict' : null,
            createdAt: new Date(),
            createdBy: new ObjectId(client._id),
            updatedAt: null,
            updatedBy: null
        };
        const result = await bookingCollection.insertOne(data);
        seededBookings.push({ ...data, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'CLASS_BOOKING_CREATED', entity: 'bookings', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${client.first_name} extra booking for ${schedule.class_id}`,
            fn: async () => ({ _id: result.insertedId })
        });
    }
    console.log(`  ✅ Created ${seededBookings.length} extra class bookings`);
    return seededBookings;
}

// Seed Trainer Bookings
async function seedTrainerBookings(db, actor, seededClients, seededTrainers) {
    console.log('\n=== Seeding Trainer Bookings ===');
    const bookingCollection = db.collection('bookings');
    const seededBookings = [];
    const statuses = ['on_going', 'completed'];
    for (let i = 0; i < 30; i++) {
        const client = seededClients[Math.floor(Math.random() * seededClients.length)];
        const trainer = seededTrainers[Math.floor(Math.random() * seededTrainers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const data = {
            client_id: new ObjectId(client._id),
            trainer_id: new ObjectId(trainer._id),
            payment_id: Math.random() > 0.5 ? new ObjectId() : null,
            bookedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            status: status,
            type: 'trainer-booking',
            createdAt: new Date(),
            createdBy: new ObjectId(client._id),
            updatedAt: null,
            updatedBy: null
        };
        const result = await bookingCollection.insertOne(data);
        seededBookings.push({ ...data, _id: result.insertedId });
        await AuditLogsService.auditWrap({
            action: 'TRAINER_BOOKING_CREATED', entity: 'bookings', entity_id: result.insertedId,
            actor, meta: { method: 'seeder' },
            summary: `${client.first_name} booked trainer ${trainer.first_name} (${status})`,
            fn: async () => ({ _id: result.insertedId })
        });
    }
    console.log(`  ✅ Created ${seededBookings.length} trainer bookings`);
    return seededBookings;
}

// Main
async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║          Gym Capstone - Database Seeder              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    try {
        console.log('Connecting to database...');
        const { db, client } = await connectDB();
        console.log('✅ Connected to MongoDB\n');
        const systemActor = {
            _id: new ObjectId(),
            first_name: 'System',
            last_name: 'Seeder',
            role: 'superadmin',
            user_type: 'admin'
        };
        await seedAdmins(db, systemActor);
        const seededClients = await seedClients(db, systemActor);
        await seedTrainers(db, systemActor);
        await seedMembershipConfigs(db, systemActor);
        await seedPlans(db, systemActor);
        await seedPricing(db, systemActor);
        const classes = await seedClasses(db, systemActor);
        const trainers = await db.collection('trainers').find({ status: 'active' }).toArray();
        const seededSchedules = await seedClassSchedules(db, systemActor, trainers, classes, seededClients);
        await seedClientPasses(db, systemActor, seededClients, await db.collection('plans').find({}).toArray(), await db.collection('pricing').find({}).toArray());
        await seedMemberships(db, systemActor, seededClients);
        await seedDiscountRequests(db, systemActor, seededClients);
        await seedPayments(db, systemActor, seededClients, await db.collection('plans').find({}).toArray(), await db.collection('pricing').find({}).toArray());
        await seedClassBookings(db, systemActor, seededClients, seededSchedules);
        await seedTrainerBookings(db, systemActor, seededClients, trainers);
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║          ✅ Seeding completed successfully!            ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}
if (process.argv[1] === fileURLToPath(new URL(import.meta.url))) {
    main();
}
export { main };