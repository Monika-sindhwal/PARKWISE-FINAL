const express = require("express");
const router = express.Router();

const {
  getCustomerDashboard,
  getOwnerDashboard,
  getAdminDashboard,
} = require("../controllers/dashboard.controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

router.get("/customer", protect, authorize("customer"), getCustomerDashboard);
router.get("/owner", protect, authorize("owner"), getOwnerDashboard);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

module.exports = router;
