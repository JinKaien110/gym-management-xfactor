import express from "express";
import ClassScheduleController from "../controllers/ClassScheduleController.js";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/class-schedule", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.createClassSchedule);

router.get("/class-schedule/:id", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.viewClassSchedule);

router.get("/class-schedule", verifyToken, authorizeUserTypes("admin", "client", "trainer"), authorizeRoles("admin", "staff", "superadmin", "client", "trainer"), ClassScheduleController.viewAllClassSchedule);

router.get("/client/class-schedule", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClassScheduleController.viewAllClassSchedule);

router.put("/class-schedule/:id", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.updateClassSchedule);

router.patch("/class-schedule/:id", verifyToken, authorizeRoles("admin", "staff"), ClassScheduleController.updateClassScheduleStatus);

router.get("/trainer/class-schedule", verifyToken, authorizeRoles("trainer"), ClassScheduleController.viewClassScheduleAssignedToMe);


export default router;