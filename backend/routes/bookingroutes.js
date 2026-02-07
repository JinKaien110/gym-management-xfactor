import express from "express";
import BookingController from "../controllers/BookingController.js";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/booking/:id", verifyToken, authorizeRoles("member"), BookingController.joinBooking);
router.get("/my-booking", verifyToken, authorizeRoles("member"), BookingController.viewMyBookings);
router.get("/booking/:id", verifyToken, authorizeRoles("member"), BookingController.viewBookingDetails);
router.get("/booking", verifyToken, authorizeRoles("admin", "staff"), BookingController.viewAllBooking);
router.patch("/booking/:id", verifyToken, authorizeRoles("member"), BookingController.cancelBooking);



export default router;