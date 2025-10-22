// statistics.controller.js
const Statistics = require("../models/statistics.model");

// 1. Get Dashboard Statistics
exports.getDashboard = (req, res) => {
    const { start_date, end_date } = req.query;

    // Get main statistics
    Statistics.getDashboardStats(start_date, end_date, (err, stats) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching dashboard statistics",
                error: err.message
            });
        }

        // Get top selling product
        Statistics.getTopSellingProduct(start_date, end_date, (err, topProduct) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error fetching top selling product",
                    error: err.message
                });
            }

            res.json({
                total_orders: stats.total_orders,
                total_revenue: parseFloat(stats.total_revenue),
                total_customers: stats.total_customers,
                pending_orders: stats.pending_orders,
                completed_orders: stats.completed_orders,
                canceled_orders: stats.canceled_orders,
                top_selling_product: topProduct ? {
                    name: topProduct.name,
                    total_sold: topProduct.total_sold,
                    revenue: parseFloat(topProduct.revenue)
                } : null
            });
        });
    });
};

// 2. Get Monthly Revenue
exports.getMonthlyRevenue = (req, res) => {
    const year = req.query.year || new Date().getFullYear();

    Statistics.getMonthlyRevenue(year, (err, data) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching monthly revenue",
                error: err.message
            });
        }

        res.json(data);
    });
};

// 3. Get Order Status Distribution
exports.getOrderStatusDistribution = (req, res) => {
    Statistics.getOrderStatusDistribution((err, data) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching order status distribution",
                error: err.message
            });
        }

        res.json(data);
    });
};

// 4. Get Revenue by Category
exports.getRevenueByCategory = (req, res) => {
    Statistics.getRevenueByCategory((err, data) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching revenue by category",
                error: err.message
            });
        }

        res.json(data);
    });
};

// 5. Get Top Products
exports.getTopProducts = (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    Statistics.getTopProducts(limit, (err, data) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching top products",
                error: err.message
            });
        }

        res.json(data);
    });
};

// 6. Get Recent Orders
exports.getRecentOrders = (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'DESC';

    Statistics.getRecentOrders(limit, sort, order, (err, data) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching recent orders",
                error: err.message
            });
        }

        res.json(data);
    });
};