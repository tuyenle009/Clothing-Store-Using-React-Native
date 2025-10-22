// statistics.model.js
const db = require("../common/db");

const Statistics = {};

// 1. Dashboard Statistics
Statistics.getDashboardStats = (startDate, endDate, callback) => {
    let whereClause = "WHERE o.is_deleted = 0";
    let params = [];

    if (startDate && endDate) {
        whereClause += " AND o.created_at BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    const sqlString = `
        SELECT 
            COUNT(o.order_id) as total_orders,
            COALESCE(SUM(CASE WHEN o.order_status != 'canceled' THEN o.total_price ELSE 0 END), 0) as total_revenue,
            COUNT(DISTINCT o.user_id) as total_customers,
            COUNT(CASE WHEN o.order_status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as completed_orders,
            COUNT(CASE WHEN o.order_status = 'canceled' THEN 1 END) as canceled_orders
        FROM orders o
        ${whereClause}
    `;

    db.query(sqlString, params, (err, result) => {
        if (err) return callback(err);
        callback(null, result[0]);
    });
};

// Get top selling product for dashboard
Statistics.getTopSellingProduct = (startDate, endDate, callback) => {
    let whereClause = "WHERE o.order_status != 'canceled' AND o.is_deleted = 0";
    let params = [];

    if (startDate && endDate) {
        whereClause += " AND o.created_at BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    const sqlString = `
        SELECT 
            p.product_name as name,
            SUM(od.quantity) as total_sold,
            SUM(od.price) as revenue
        FROM order_details od
        JOIN orders o ON od.order_id = o.order_id
        JOIN product_details pd ON od.detail_id = pd.detail_id
        JOIN products p ON pd.product_id = p.product_id
        ${whereClause}
        GROUP BY p.product_id, p.product_name
        ORDER BY total_sold DESC
        LIMIT 1
    `;

    db.query(sqlString, params, (err, result) => {
        if (err) return callback(err);
        callback(null, result[0] || null);
    });
};

// 2. Monthly Revenue
Statistics.getMonthlyRevenue = (year, callback) => {
    const sqlString = `
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COALESCE(SUM(CASE WHEN order_status != 'canceled' THEN total_price ELSE 0 END), 0) as revenue,
            COUNT(order_id) as total_orders
        FROM orders
        WHERE YEAR(created_at) = ? AND is_deleted = 0
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    `;

    db.query(sqlString, [year], (err, result) => {
        if (err) return callback(err);

        // Fill in missing months with 0
        const monthlyData = {};
        result.forEach(row => {
            monthlyData[row.month] = {
                month: row.month,
                revenue: parseFloat(row.revenue),
                total_orders: row.total_orders
            };
        });

        // Create array with all 12 months
        const fullYearData = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
            fullYearData.push(monthlyData[monthStr] || {
                month: monthStr,
                revenue: 0,
                total_orders: 0
            });
        }

        callback(null, fullYearData);
    });
};

// 3. Order Status Distribution
Statistics.getOrderStatusDistribution = (callback) => {
    const sqlString = `
        SELECT 
            order_status as status,
            COUNT(order_id) as count
        FROM orders
        WHERE is_deleted = 0
        GROUP BY order_status
    `;

    db.query(sqlString, (err, result) => {
        if (err) return callback(err);
        callback(null, result);
    });
};

// 4. Revenue by Category
Statistics.getRevenueByCategory = (callback) => {
    const sqlString = `
        SELECT 
            c.category_name,
            COALESCE(SUM(od.price), 0) as revenue
        FROM categories c
        LEFT JOIN products p ON c.category_id = p.category_id
        LEFT JOIN product_details pd ON p.product_id = pd.product_id
        LEFT JOIN order_details od ON pd.detail_id = od.detail_id
        LEFT JOIN orders o ON od.order_id = o.order_id
        WHERE (o.order_status != 'canceled' OR o.order_status IS NULL)
            AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
            AND c.is_deleted = 0
        GROUP BY c.category_id, c.category_name
        HAVING revenue > 0
        ORDER BY revenue DESC
    `;

    db.query(sqlString, (err, result) => {
        if (err) return callback(err);
        const formattedResult = result.map(row => ({
            category_name: row.category_name,
            revenue: parseFloat(row.revenue)
        }));
        callback(null, formattedResult);
    });
};

// 5. Top Products
Statistics.getTopProducts = (limit, callback) => {
    const sqlString = `
        SELECT 
            p.product_id,
            p.product_name,
            SUM(od.quantity) as total_sold,
            SUM(od.price) as revenue
        FROM products p
        JOIN product_details pd ON p.product_id = pd.product_id
        JOIN order_details od ON pd.detail_id = od.detail_id
        JOIN orders o ON od.order_id = o.order_id
        WHERE o.order_status != 'canceled' 
            AND o.is_deleted = 0
            AND p.is_deleted = 0
        GROUP BY p.product_id, p.product_name
        ORDER BY total_sold DESC
        LIMIT ?
    `;

    db.query(sqlString, [limit], (err, result) => {
        if (err) return callback(err);
        const formattedResult = result.map(row => ({
            product_id: row.product_id,
            product_name: row.product_name,
            total_sold: row.total_sold,
            revenue: parseFloat(row.revenue)
        }));
        callback(null, formattedResult);
    });
};

// 6. Recent Orders
Statistics.getRecentOrders = (limit, sortField, sortOrder, callback) => {
    const allowedSortFields = ['order_id', 'created_at', 'total_price', 'order_status'];
    const allowedSortOrders = ['ASC', 'DESC'];

    const field = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const order = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const sqlString = `
        SELECT 
            order_id,
            user_id,
            total_price,
            order_status,
            created_at
        FROM orders
        WHERE is_deleted = 0
        ORDER BY ${field} ${order}
        LIMIT ?
    `;

    db.query(sqlString, [limit], (err, result) => {
        if (err) return callback(err);
        callback(null, result);
    });
};

module.exports = Statistics;