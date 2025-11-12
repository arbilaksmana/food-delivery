const router = require("express").Router();
const c = require("../controllers/paymentController");

router.post("/", c.create);                    // create payment "pending"
router.patch("/:orderId/status", c.updateStatus); // change status with validation
router.get("/:orderId", c.detail);
router.get("/", c.list);

module.exports = router;
