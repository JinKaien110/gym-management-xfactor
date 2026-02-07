import express from "express";
import ClassScheduleController from "../controllers/ClassScheduleController.js";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/class-schedule", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.createClassSchedule);
router.get("/class-schedule/:id", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.viewClassSchedule);
router.get("/class-schedule", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.viewAllClassSchedule);
router.put("/class-schedule/:id", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.updateClassSchedule);
router.patch("/class-schedule/:id", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.updateClassScheduleStatus);
router.get("/trainer/class-schedule", verifyToken, authorizeRoles("trainer"), ClassScheduleController.viewClassScheduleAssignedToMe);


export default router;