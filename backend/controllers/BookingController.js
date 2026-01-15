import BookingService from "../services/booking.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class BookingController {
    async joinBooking(req, res, next) {
        try {
            const result = await BookingService.joinBooking(req.params.id, req.user);

            return res.status(200).json({ message: "Successfully joined a class schedule", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewMyBookings(req, res, next) {
        try {
            const result = await BookingService.joinBooking(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewBookingDetails() {
        
    }

    async viewAllBooking(req, res, next) {
        try {
            const result = await BookingService.joinBooking(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async cancelBooking(req, res, next) {
        try {
            const result = await BookingService.joinBooking(req.params.id, req.user);

            return res.status(200).json({ message: "Successfully cancel a class schedule", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
}

export default new BookingController();