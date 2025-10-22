// var express = require('express');
// var router = express.Router();
// const cartcontroller = require("../controllers/cart.controller");

// /* Routes for cart */
// router.get('/', cartcontroller.getAll);
// router.get('/count', cartcontroller.getCartCount);
// router.get('/:id', cartcontroller.getById);
// router.post('/', cartcontroller.insert);
// router.put('/:id', cartcontroller.update);
// router.delete('/:id', cartcontroller.delete);

// module.exports = router;

var express = require('express');
var router = express.Router();
const cartcontroller = require("../controllers/cart.controller");

/* Routes for cart */
router.get('/', cartcontroller.getAll);

// ✅ QUAN TRỌNG: Các route cụ thể phải đứng TRƯỚC các route động (:id)
router.get('/count', cartcontroller.getCartCount);
router.delete("/clear", cartcontroller.clearByUserId); // ← ĐẶT TRƯỚC /:id

// Route động phải đặt cuối cùng
router.get('/:id', cartcontroller.getById);
router.post('/', cartcontroller.insert);
router.put('/:id', cartcontroller.update);
router.delete('/:id', cartcontroller.delete);

module.exports = router;