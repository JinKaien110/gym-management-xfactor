import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import ClassModel from "../models/ClassModel.js";
import { getChangedFields } from "../utils/getChangedFields.js";


class ClassService {
    async createClass(body, updater) {
        let { name, default_capacity } = body;
        
        if(!name || !default_capacity === undefined) {
            throw new ValidationError("Please fillout the necessary fields");
        }

        default_capacity = Number(default_capacity);
        if(Number.isNaN(default_capacity) || default_capacity <= 0) {
            throw new ValidationError("Default Capacity must be a positive number");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID")
        }

        const existing = await ClassModel.viewClassByName(name.trim());
        if(existing) {
            throw new ValidationError("Class already exists");
        }

        const id = new ObjectId(updater.id);

        const data = {
            name: name.trim(),
            default_capacity: Number(default_capacity),
            status: "active",
            createdAt: new Date(),
            createdBy: id,
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        }

        return await ClassModel.createClass(data);
    }

    async viewClass(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class ID");
        }

        return await ClassModel.viewClass(new ObjectId(id));
    }

    async viewAllClass(query) {
        let { name, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);

        let filter = {};

        if(name) {
            filter.name = name.trim()
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        return await ClassModel.viewAllClass(filter, page, limit);
    }

    async updateClass(id, body, updater) {
        let { name, default_capacity } = body;
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID")
        }

        const isClass = await ClassModel.viewClass(new ObjectId(id));
        if(!isClass) {
            throw new ValidationError("Class does not exist")
        }

        let data = {};

        if(name) {
            data.name = name.trim()
        }

        if (default_capacity !== undefined) {
            const cap = Number(default_capacity);
                if (Number.isNaN(cap) || cap <= 0) {
                    throw new ValidationError("Default capacity must be a positive number");
                }
            data.default_capacity = cap;
        }

        if(default_capacity) {
            data.default_capacity = default_capacity
        }

        const classesUpdates = getChangedFields(isClass, data)

        if(!Object.keys(classesUpdates).length) {
            return existing;
        }

        classesUpdates.updatedAt = new Date();
        classesUpdates.updatedBy = new ObjectId(updater.id);

        return await ClassModel.updateClass(new ObjectId(id), classesUpdates)
    }

    async updateClassStatus(id, body, updater) {
        let { status } = body;
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID")
        }

        const isClass = await ClassModel.viewClass(new ObjectId(id));

        if(!isClass) {
            throw new ValidationError("Class does not exist")
        }

        if (status === undefined) {
            throw new ValidationError("Status is required");
        }

        const allowedStatus = ["active", "inactive", "archived"];

        const normalizedStatus = status.trim().toLowerCase();
        if (!allowedStatus.includes(normalizedStatus)) {
            throw new ValidationError("Invalid status value");
        }

        if (existing.status === normalizedStatus) {
            return existing;
        }

        const data = {
            status: normalizedStatus,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        if (normalizedStatus === "archived") {
            data.archivedAt = new Date();
            data.archivedBy = new ObjectId(updater.id);
        }

        return await ClassModel.updateClassStatus(new ObjectId(id), data)
    }
}

export default new ClassService();