import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";
import { emailCreateAdmin } from "../templates/auth/email.createAdmin.js";
import { sendEmail } from "./email.service.js";
import { emailUpdateAdminPassword } from "../templates/auth/email.updatePassword.js";
import AdminDashboardModel from "../models/AdminDashboardModel.js";


class AdminDashboardService {
    async dashboard() {
        const [dashboard, recentActivities, todaysClasses, pendingApprovals, revenueThisMonthCard] = await Promise.all([
            AdminDashboardModel.dashboard(),
            AdminDashboardModel.recentActivities(),
            AdminDashboardModel.todaysClasses(),
            AdminDashboardModel.pendingApprovals(),
            AdminDashboardModel.revenueThisMonthCard()
        ]);

        return {
            dashboard,
            recentActivities,
            todaysClasses,
            pendingApprovals,
            revenueThisMonthCard
        }
    }

    async clientsManagement(query) {
        let { status, fitness_goal, gender, search, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit)
        const skip = (page - 1) * limit

        let filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(fitness_goal) {

            const goals = Array.isArray(fitness_goal)
                ? fitness_goal
                : [fitness_goal];

            filter.fitness_goal = {
                $in: goals.map(g => g.trim().toLowerCase())
            }
        }
        
        if(gender) {
            filter.gender = gender.trim().toLowerCase()
        }

        filter.role = "client";

        if (search) {
            filter.$or = [
                { first_name: { $regex: search, $options: "i" } },
                { last_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        return await AdminDashboardModel.clientsManagement(filter, page, limit, skip);
    }

    async membershipRequests(query) {
        let { status, request_type, search, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit)
        const skip = (page - 1) * limit

        let filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(request_type) {
            filter.request_type = request_type.trim().toLowerCase();
        }

        if(search) {
            search = search.trim().toLowerCase()
        }

        return AdminDashboardModel.membershipRequests(filter, search, page, limit, skip);
    }

    async memberships(query) {
        let { start_date, end_date, status, plan_id, search, page = 1, limit = 10} = query;
        
        let filter = {};
        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit

        if(start_date) {
            filter.end_date = { $gte: new Date(start_date) }; 
        }

        if(end_date) {
            filter.start_date = { $lte: new Date(end_date) }; 
        }

        if(plan_id) {
            filter.plan_id = new ObjectId(plan_id)
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(status === "frozen") {
            filter.is_frozen = true
        }

        if(search) {
            search = search.trim().toLowerCase()
        }

        return AdminDashboardModel.memberships(filter, search, page, limit, skip);
    }

    async payments(query) {
        let { 
            status, 
            payment_method, 
            search, 
            start_date,
            end_date,
            page = 1, 
            limit = 10 
        } = query;

        let filter = {};

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        if (start_date || end_date) {
            filter.createdAt = {};

            if (start_date) {
                filter.createdAt.$gte = new Date(start_date);
            }

            if (end_date) {
                filter.createdAt.$lte = new Date(end_date);
            }
        }

        if (status) {
            filter.status = status.trim()
        }

        if (payment_method) {
            filter.payment_method = payment_method.trim().toLowerCase();
        }
        
        if (search) {
            search = search.trim().toLowerCase();
        }

        return AdminDashboardModel.payments(filter, search, page, limit, skip);
    }

    async classes(query) {
        let { page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;
        
        return AdminDashboardModel.classes(page, limit, skip);
    }

    async schedules(query) {
        let { class_id, start_at, end_at, trainer_id, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        let filter = {};

        if (class_id) {
            filter.class_id = new ObjectId(class_id);
        }

        if (trainer_id) {
            filter.trainer_id = new ObjectId(trainer_id);
        }

        if (status) {
            filter.status = status.trim().toLowerCase();
        }


        if (start_at || end_at) {
            filter.start_at = {};

            if (start_at) {
                filter.start_at.$gte = new Date(start_at);
            }

            if (end_at) {
                const end = new Date(end_at);
                end.setHours(23, 59, 59, 999);
                filter.start_at.$lte = end;
            }
        }

        return AdminDashboardModel.schedules(filter, page, limit, skip);
    }

    async trainers(query) {
        let { search, specialization, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        let filter = {};

        filter.role = "trainer";

        if (search) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { first_name: searchRegex },
                { last_name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ];
        }

        if (specialization) {
            filter.specialization = { $in: Array.isArray(specialization) ? specialization : [specialization] };
        }

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        return AdminDashboardModel.trainers(filter, page, limit, skip);
    }

    async pricing(query) {
        let { price, membership_fee, status, type, page = 1, limit = 10 } = query;
                
        page = Number(page);
        limit = Number(limit);
        price = Number(price);
        membership_fee = Number(membership_fee);

        const filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(price) {
            filter.price = price;
        }

        if(membership_fee) {
            filter.membership_fee = membership_fee;
        }

        if(type) {
            filter.type = String(type).trim().toLowerCase();
        }

        return await AdminDashboardModel.pricing(filter, page, limit);
    }

    async plans(query) {
        let { status, label, page = 1, limit = 10 } = query;
        
        page = Number(page)
        limit = Number(limit)
    
        const filter = {};
    
        if(status) {
            filter.status = status.trim().toLowerCase();
        }
    
        if(label) {
            filter.label = label.trim().toLowerCase();
        }
    
        return await AdminDashboardModel.plans(filter, page, limit);
    }

async bookings(query) {
        let { status, client_id, trainer_id, schedule_id, type, page = 1, limit = 10 } = query;
        
        page = Number(page)
        limit = Number(limit)
    
        const filter = {};
    
        if(status) {
            filter.status = status.trim().toLowerCase();
        }
    
        if(client_id) {
            filter.client_id = new ObjectId(client_id)
        }

        if(trainer_id) {
            filter.trainer_id = new ObjectId(trainer_id)
        }

        if(schedule_id) {
            filter.schedule_id = new ObjectId(schedule_id)
        }

        if(type) {
            filter.type = type.trim().toLowerCase();
        }
    
        return await AdminDashboardModel.bookings(filter, page, limit);
    }

    async discounts(query) {
        let { 
            status, 
            discount_type, 
            client_id, 
            start_date, 
            end_date, 
            page = 1, 
            limit = 10 
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        if (discount_type) {
            filter.discount_type = discount_type.trim();
        }

        if (client_id && ObjectId.isValid(client_id)) {
            filter.client_id = new ObjectId(client_id);
        }

        if (start_date || end_date) {
            filter.createdAt = {};

            if (start_date) {
                filter.createdAt.$gte = new Date(start_date);
            }

            if (end_date) {
                filter.createdAt.$lte = new Date(end_date);
            }
        }

        return await AdminDashboardModel.discounts(filter, page, limit);
    }

    async airecommendations(query) {
        let { 
            status, 
            client_id,
            trainer_id,
            start_date, 
            end_date, 
            page = 1, 
            limit = 10 
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        if (client_id && ObjectId.isValid(client_id)) {
            filter.client_id = new ObjectId(client_id);
        }

        if (trainer_id && ObjectId.isValid(trainer_id)) {
            filter.trainer_id = new ObjectId(trainer_id);
        }

        if (start_date || end_date) {
            const dateFilter = {};

            if (start_date) {
                const start = new Date(start_date);
                if (!isNaN(start)) {
                    start.setHours(0, 0, 0, 0);
                    dateFilter.$gte = start;
                }
            }

            if (end_date) {
                const end = new Date(end_date);
                if (!isNaN(end)) {
                    end.setHours(23, 59, 59, 999);
                    dateFilter.$lte = end;
                }
            }

            if (Object.keys(dateFilter).length > 0) {
                filter.createdAt = dateFilter;
            }
        }

        return await AdminDashboardModel.airecommendations(filter, page, limit);
    }

    async membershipconfig(query) {
        let {
            search,
            duration,
            min_fee,
            max_fee,
            min_days,
            max_days,
            perks,
            page = 1,
            limit = 10,
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (search) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        if (duration) {
            filter.duration = String(duration).toLowerCase().trim();
        }

        if (min_fee || max_fee) {
            filter.fee = {};
            if (min_fee) filter.fee.$gte = Number(min_fee);
            if (max_fee) filter.fee.$lte = Number(max_fee);
        }

        if (min_days || max_days) {
            filter.duration_days = {};
            if (min_days) filter.duration_days.$gte = Number(min_days);
            if (max_days) filter.duration_days.$lte = Number(max_days);
        }

        if (perks) {
            const perksArray = Array.isArray(perks)
                ? perks
                : [perks];

            filter.perks = {
                $in: perksArray.map(p => String(p).toLowerCase().trim())
            };
        }


        return await AdminDashboardModel.membershipconfig(filter, page, limit);
    }

    async analytics(query) {
        let { months = 6 } = query;
        months = Number(months);

        const [
            overview,
            revenueByMonth,
            bookingsByType,
            classPopularity,
            clientGrowth,
            membershipStatus,
            topTrainers
        ] = await Promise.all([
            AdminDashboardModel.analyticsOverview(),
            AdminDashboardModel.revenueByMonth(months),
            AdminDashboardModel.bookingsByType(),
            AdminDashboardModel.classPopularity(),
            AdminDashboardModel.clientGrowth(months),
            AdminDashboardModel.membershipStatusBreakdown(),
            AdminDashboardModel.topTrainers()
        ]);

        return {
            overview,
            revenueByMonth,
            bookingsByType,
            classPopularity,
            clientGrowth,
            membershipStatus,
            topTrainers
        };
    }
}

export default new AdminDashboardService();