import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import ClientPassModel from "../models/ClientPassModel.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import AuditLogsService from "./audit.logs.service.js";
import { calculateEndDate } from "../utils/calculateEndDate.js";
import PlanModel from "../models/PlanModel.js";

class ClientPassService {
    async createclientPass(meta, body, creator) {
        let { plan_id, pricing_id, start_date, payment_id, status } = body;

        if(!creator.id || !ObjectId.isValid(creator.id)) throw new ValidationError("Invalid creator ID");

        const data = {};

        if(!plan_id || !ObjectId.isValid(plan_id)) throw new ValidationError("Invalid plan ID");
        if(!pricing_id || !ObjectId.isValid(pricing_id)) throw new ValidationError("Invalid pricing ID");

        if(!start_date) throw new ValidationError("Start date is required");

        start_date = new Date(start_date);
        if(isNaN(start_date.getTime())) throw new ValidationError("Invalid start date");

        if(!payment_id || !ObjectId.isValid(payment_id)) throw new ValidationError("Invalid payment ID");

        const countToday = await ClientPassModel.countToday();
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const reference_no = `DP-${yyyy}${mm}${dd}-${String(countToday + 1).padStart(4, '0')}`;

        const end_date = await calculateEndDate();
        console.log(end_date)

        const plan = await PlanModel.viewAPlan(new ObjectId(plan_id));
        if(!plan) throw new ValidationError("Plan not found");

        data.client_id = new ObjectId(new ObjectId(creator.id))
        data.plan_id = new ObjectId(plan_id);
        data.pricing_id = new ObjectId(pricing_id);
        data.start_date = start_date
        data.end_date = end_date;
        data.payment_id = new ObjectId(payment_id);
        data.reference_no = reference_no;
        data.duration_days = String(plan.duration_days).trim().toLowerCase();
        data.status = status ? String(status).trim().toLowerCase() : "active"; // active, expired, cancelled
        data.createdAt = new Date();
        data.createdBy = new ObjectId(creator.id);
        data.updatedAt = null;
        data.updatedBy = null;
        data.archivedAt = null;
        data.archivedBy = null;

        return await AuditLogsService.auditWrap({
            action: "client_PASS_CREATED",
            entity: "clients_pass",
            actor: { id: new ObjectId(creator.id), role: creator.role, user_type: creator.user_type }, 
            meta: meta,
            summary: `${creator.first_name} ${creator.last_name} (${creator.role} → ${creator.user_type}) created a client pass with reference number ${reference_no}`,
            fn: async () => {
                console.log("HERE?")
                return await ClientPassModel.createclientPass(data);
            }
        });
    }

    async findclientPass(id) {

        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid client pass ID");

        return await ClientPassModel.findclientPass(new ObjectId(id));

    }

    async findAllclientPass(query) {
        let { plan_id, pricing_id, payment_id, client_id, status, page = 1, limit = 10 } = query;
        page = Number(page);
        limit = Number(limit);

        const filter = {}; 
        if(plan_id && !ObjectId.isValid(plan_id)) throw new ValidationError("Invalid plan ID"); 
        if(pricing_id && !ObjectId.isValid(pricing_id)) throw new ValidationError("Invalid pricing ID");
        if(payment_id && !ObjectId.isValid(payment_id)) throw new ValidationError("Invalid payment ID");
        if(client_id && !ObjectId.isValid(client_id)) throw new ValidationError("Invalid client ID");
        if(status) {
            filter.status = String(status).trim().toLowerCase();
        }
        if(plan_id) {
            filter.plan_id = new ObjectId(plan_id);
        }
        if(pricing_id) {
            filter.pricing_id = new ObjectId(pricing_id);
        }
        if(payment_id) {
            filter.payment_id = new ObjectId(payment_id);
        }
        if(client_id) {
            filter.client_id = new ObjectId(client_id);
        }   

        return await ClientPassModel.findAllclientPass(filter, page, limit);
    }

    async updateclientPassStatus(id, data) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid payment ID");
        const client_pass = await ClientPassModel.findclientPassByPaymentId(new ObjectId(id));
        if(!client_pass) throw new ValidationError("client pass not found");
         
        return await ClientPassModel.updateclientPassStatus(new ObjectId(id), data);
    }

    async findActiveclientPass(id) {

        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid client ID");
        return await ClientPassModel.findActiveclientPass(new ObjectId(id));
    }
}

export default new ClientPassService();