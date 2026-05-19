import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js"; // optional, but better than Error

/**
 * Checks duplicates for email/phone.
 * - Create: pass id as null/undefined
 * - Update: pass id as the document _id string
 */
export default async function checkDuplicate(id, { email, phone }) {
  const { db } = await connectDB();

  // Normalize inputs (optional but recommended)
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const normalizedPhone = phone ? String(phone).trim() : null;

  // Build $or conditions safely (only push if value exists)
  const orConditions = [];

  const hasValidId = id && ObjectId.isValid(id);
  const excludeIdFilter = hasValidId ? { _id: { $ne: new ObjectId(id) } } : {};

  if (normalizedEmail) {
    orConditions.push({ email: normalizedEmail, ...excludeIdFilter });
  }

  if (normalizedPhone) {
    orConditions.push({ phone: normalizedPhone, ...excludeIdFilter });
  }

  // Nothing to check
  if (orConditions.length === 0) return;

  // ⚠️ Use the correct collection name for your system:
  // If yours is "client", change "clients" to "client"
  const [client, trainer, admin] = await Promise.all([
   db.collection("clients").findOne({ $or: orConditions }),
   db.collection("trainers").findOne({ $or: orConditions }),
   db.collection("admins").findOne({ $or: orConditions }),
]);

const existing = client || trainer || admin;

  if (!existing) return;

  // Determine which field collided (compare against normalized values)
  if (normalizedEmail && existing.email === normalizedEmail) {
    throw new ValidationError("Email is already in use by another client");
  }

  if (normalizedPhone && existing.phone === normalizedPhone) {
    throw new ValidationError("Phone number is already in use by another client");
  }

  // Fallback (rare): matched but neither equals due to formatting differences
  throw new ValidationError("Duplicate email or phone detected");
}
