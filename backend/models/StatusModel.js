import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";


class StatusModel {
    async status(collectionName, id, data) {
        const { db } = await connectDB(); 

        const result = await db.collection(collectionName).findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: true }
        );

        if(!result) throw new ValidationError("Failed to update the document");

        return result;
    } 
}

export default new StatusModel();