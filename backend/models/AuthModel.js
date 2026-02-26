import { connectDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

class AuthModel {

    async FindUserById(UserId) {
        const { db } = await connectDB();
        const ID = await db.collection('members').findOne({ _id: new ObjectId(UserId) },
    { projection: { password: 0 } });

        return ID;
    }

    async FindUserByEmail(email) {
        const { db } = await connectDB();
        const user = await db.collection('members').findOne({ email });

        return user;
    }

    async ValidatePassword(input, passwordhash) {
        return await bcrypt.compare(input, passwordhash);
    }

}

export default new AuthModel();