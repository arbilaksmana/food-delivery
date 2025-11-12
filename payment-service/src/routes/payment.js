const router = require("express").Router();
const c = require("../controllers/paymentController");

router.post("/", c.create);
router.patch("/:orderId/status", c.updateStatus);
router.get("/:orderId", c.detail);
router.get("/", c.list);

module.exports = router;
