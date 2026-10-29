import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createEnquiry,
  listUnclaimed,
  claimEnquiry,
  listMyEnquiries,
} from "../controllers/enquiryController.js";

const router = Router();

router.post("/", createEnquiry);
router.get("/unclaimed", requireAuth, listUnclaimed);
router.get("/mine", requireAuth, listMyEnquiries);
router.patch("/:id/claim", requireAuth, claimEnquiry);

export default router;