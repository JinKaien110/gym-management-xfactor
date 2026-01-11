import bcrypt from "bcrypt";

export async function hashedPassword(password) {
    return await bcrypt.hash(password, 10);
}