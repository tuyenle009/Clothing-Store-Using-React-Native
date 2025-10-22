// routes/statistics.js
const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/statistics.controller");

// Dashboard Statistics
router.get("/dashboard", statisticsController.getDashboard); // ← BỎ /statistics

// Monthly Revenue
router.get("/monthly-revenue", statisticsController.getMonthlyRevenue); // ← BỎ /statistics

// Order Status Distribution
router.get("/order-status-distribution", statisticsController.getOrderStatusDistribution); // ← BỎ /statistics

// Revenue by Category
router.get("/revenue-by-category", statisticsController.getRevenueByCategory); // ← BỎ /statistics

// Top Products
router.get("/top-products", statisticsController.getTopProducts); // ← BỎ /statistics

// Recent Orders - Cái này hơi khác
router.get("/recent-orders", statisticsController.getRecentOrders); // ← Đổi từ /orders/recent

module.exports = router;