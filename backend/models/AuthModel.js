import { connectDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

class AuthModel {

    async FindUserById(UserId) {
        const { db } = await connectDB();
        const ID = await db.collection('members').findOne({ _id: new ObjectId(UserId) });

        return ID;
    }

    async FindUserByEmail(email) {
        const { db } = await connectDB();
        const user = await db.collection('members').findOne({ email });

        return user;
    }

    async ValidatePassword(InputPassword, UserEmail) {
        return await bcrypt.compare(InputPassword, UserEmail);
    }

}

export default new AuthModel();