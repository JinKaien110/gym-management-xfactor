import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const dbname = process.env.MONGO_DBNAME;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("Database connected!");
        return client.db(dbname);
    } catch {
        console.error("Database failed to connect: ", error);
        process.exit(1);
    }
}

export { connectDB }