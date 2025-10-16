import express from 'express';
import { pool } from '../../db.js';

const router = express.Router();

// Test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Reports route is working!' });
});

// ==================== 1. PACKAGE-WISE ANALYTICS ====================
router.get('/packages-analytics', async (req, res) => {
    try {
        console.log('Package analytics endpoint hit!');
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                p.id as package_id,
                p.title as package_name,
                p.price as package_price,
                p.duration_days,
                COUNT(b.id) as total_bookings,
                IFNULL(SUM(b.amount), 0) as total_revenue,
                IFNULL(AVG(b.amount), 0) as avg_booking_value,
                SUM(CASE WHEN b.payment_status = 'success' THEN 1 ELSE 0 END) as successful_bookings,
                SUM(CASE WHEN b.payment_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings
            FROM packages p
            LEFT JOIN bookings b ON p.id = b.package_id
        `;

        const params = [];

        if (start_date && end_date) {
            query += ' WHERE b.booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' GROUP BY p.id, p.title, p.price, p.duration_days ORDER BY total_revenue DESC';

        console.log('Executing query with package_id JOIN');

        const [packageStats] = await pool.query(query, params);

        console.log('Package analytics result count:', packageStats.length);
        console.log('Sample result:', packageStats[0]);

        res.json({ success: true, data: packageStats });
    } catch (error) {
        console.error('❌ Package analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch package analytics', message: error.message });
    }
});

// ==================== 2. BOOKING STATUS BREAKDOWN ====================
router.get('/booking-status', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query1 = `
            SELECT 
                IFNULL(payment_status, 'pending') as status,
                COUNT(*) as count,
                IFNULL(SUM(amount), 0) as total_amount
            FROM bookings
        `;

        let query2 = `SELECT COUNT(*) as total FROM bookings`;

        const params = [];

        if (start_date && end_date) {
            query1 += ' WHERE booking_date BETWEEN ? AND ?';
            query2 += ' WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query1 += ' GROUP BY payment_status ORDER BY count DESC';

        const [statusBreakdown] = await pool.query(query1, params);
        const [totalResult] = await pool.query(query2, params);
        
        const total = totalResult[0].total;

        // Calculate percentages
        const breakdownWithPercentage = statusBreakdown.map(item => ({
            ...item,
            percentage: total > 0 ? ((item.count / total) * 100).toFixed(2) : 0
        }));

        // Get status trends over time
        let trendsQuery = `
            SELECT 
                DATE(booking_date) as date,
                IFNULL(payment_status, 'pending') as status,
                COUNT(*) as count
            FROM bookings
        `;

        if (start_date && end_date) {
            trendsQuery += ' WHERE booking_date BETWEEN ? AND ?';
        }

        trendsQuery += ' GROUP BY DATE(booking_date), payment_status ORDER BY date DESC LIMIT 30';

        const [trends] = await pool.query(trendsQuery, params);

        res.json({ 
            success: true, 
            data: {
                breakdown: breakdownWithPercentage,
                trends: trends
            }
        });
    } catch (error) {
        console.error('Booking status error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch booking status', message: error.message });
    }
});

// ==================== 3. AVERAGE BOOKING VALUE ====================
router.get('/average-booking-value', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query1 = `
            SELECT 
                COUNT(*) as total_bookings,
                IFNULL(AVG(amount), 0) as average_value,
                IFNULL(MIN(amount), 0) as min_value,
                IFNULL(MAX(amount), 0) as max_value,
                IFNULL(SUM(amount), 0) as total_revenue
            FROM bookings
        `;

        let query2 = `SELECT AVG(amount) as avg_amount FROM bookings`;

        let query3 = `
            SELECT 
                CASE 
                    WHEN amount < 5000 THEN 'Under $5000'
                    WHEN amount BETWEEN 5000 AND 10000 THEN '$5000-$10000'
                    WHEN amount BETWEEN 10000 AND 20000 THEN '$10000-$20000'
                    WHEN amount BETWEEN 20000 AND 50000 THEN '$20000-$50000'
                    ELSE 'Above $50000'
                END as value_range,
                COUNT(*) as count,
                IFNULL(SUM(amount), 0) as total_revenue
            FROM bookings
        `;

        const params = [];

        if (start_date && end_date) {
            query1 += ' WHERE booking_date BETWEEN ? AND ?';
            query2 += ' WHERE booking_date BETWEEN ? AND ?';
            query3 += ' WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query3 += ' GROUP BY value_range ORDER BY MIN(amount)';

        const [avgStats] = await pool.query(query1, params);
        const [avgResult] = await pool.query(query2, params);
        const [distribution] = await pool.query(query3, params);

        const avgAmount = avgResult[0]?.avg_amount || 0;

        // Calculate high and low value counts
        let countQuery = `
            SELECT 
                SUM(CASE WHEN amount > ? THEN 1 ELSE 0 END) as high_value_count,
                SUM(CASE WHEN amount <= ? THEN 1 ELSE 0 END) as low_value_count
            FROM bookings
        `;

        const countParams = [avgAmount, avgAmount];

        if (start_date && end_date) {
            countQuery += ' WHERE booking_date BETWEEN ? AND ?';
            countParams.push(start_date, end_date);
        }

        const [counts] = await pool.query(countQuery, countParams);

        const statsWithCounts = {
            ...avgStats[0],
            high_value_count: counts[0].high_value_count || 0,
            low_value_count: counts[0].low_value_count || 0
        };

        res.json({ 
            success: true, 
            data: {
                stats: statsWithCounts,
                distribution: distribution
            }
        });
    } catch (error) {
        console.error('Average booking value error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch average booking value', message: error.message });
    }
});

// ==================== 4. TOP CUSTOMERS ====================
router.get('/top-customers', async (req, res) => {
    try {
        console.log('Top customers endpoint hit!');
        console.log('Query params:', req.query);

        const { start_date, end_date, limit = 10 } = req.query;

        // Build the query WITHOUT prepared statements for aggregates
        let query = `
            SELECT 
                email,
                name as customer_name,
                phone,
                COUNT(id) as total_bookings,
                IFNULL(SUM(amount), 0) as total_spent,
                IFNULL(AVG(amount), 0) as avg_booking_value,
                MAX(booking_date) as last_booking_date,
                SUM(CASE WHEN payment_status = 'success' THEN 1 ELSE 0 END) as successful_bookings
            FROM bookings
        `;

        const queryParams = [];

        if (start_date && end_date) {
            query += ' WHERE booking_date BETWEEN ? AND ?';
            queryParams.push(start_date, end_date);
        }

        query += `
            GROUP BY email, name, phone
            HAVING total_bookings > 0
            ORDER BY total_spent DESC
            LIMIT ?
        `;

        queryParams.push(parseInt(limit));

        console.log('Executing query with params:', queryParams);

        const [topCustomers] = await pool.query(query, queryParams);

        console.log('Query executed successfully!');
        console.log('Results count:', topCustomers.length);

        res.json({ success: true, data: topCustomers });
    } catch (error) {
        console.error('❌ Top customers error:', error);
        console.error('Error message:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch top customers', 
            message: error.message
        });
    }
});

// ==================== 5. DESTINATION-WISE ANALYTICS ====================
router.get('/destination-analytics', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                tour_destination as destination,
                COUNT(*) as total_bookings,
                IFNULL(SUM(amount), 0) as total_revenue,
                IFNULL(AVG(amount), 0) as avg_revenue,
                SUM(CASE WHEN payment_status = 'success' THEN 1 ELSE 0 END) as successful_bookings
            FROM bookings
        `;

        const params = [];

        if (start_date && end_date) {
            query += ' WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' GROUP BY tour_destination ORDER BY total_bookings DESC';

        const [destinationStats] = await pool.query(query, params);

        res.json({ success: true, data: destinationStats });
    } catch (error) {
        console.error('Destination analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch destination analytics', message: error.message });
    }
});

// ==================== 6. REVENUE ANALYTICS (Day/Week/Month) ====================
router.get('/revenue-analytics', async (req, res) => {
    try {
        const { period = 'day', start_date, end_date } = req.query;

        let groupBy = '';
        switch (period) {
            case 'day':
                groupBy = 'DATE(booking_date)';
                break;
            case 'week':
                groupBy = 'YEARWEEK(booking_date)';
                break;
            case 'month':
                groupBy = 'DATE_FORMAT(booking_date, "%Y-%m")';
                break;
            default:
                groupBy = 'DATE(booking_date)';
        }

        let query = `
            SELECT 
                ${groupBy} as period,
                COUNT(*) as total_bookings,
                IFNULL(SUM(amount), 0) as total_revenue,
                IFNULL(AVG(amount), 0) as avg_revenue,
                SUM(CASE WHEN payment_status = 'success' THEN 1 ELSE 0 END) as successful_bookings
            FROM bookings
        `;

        const params = [];

        if (start_date && end_date) {
            query += ' WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ` GROUP BY ${groupBy} ORDER BY period DESC LIMIT 30`;

        const [revenueData] = await pool.query(query, params);

        res.json({ success: true, data: revenueData });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch revenue analytics', message: error.message });
    }
});

// ==================== 7. EXPORT DATA (CSV) ====================
router.get('/export/csv', async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;

        let query = '';
        const params = [];
        let filename = 'report.csv';

        switch (report_type) {
            case 'bookings':
                filename = 'bookings_report.csv';
                query = `
                    SELECT 
                        id, name, email, phone, tour_destination, tour_date,
                        payment_status, payment_method, amount, booking_date
                    FROM bookings
                `;
                if (start_date && end_date) {
                    query += ' WHERE booking_date BETWEEN ? AND ?';
                    params.push(start_date, end_date);
                }
                query += ' ORDER BY booking_date DESC';
                break;

            case 'packages':
                filename = 'packages_analytics.csv';
                query = `
                    SELECT 
                        p.title as package_name,
                        COUNT(b.id) as total_bookings,
                        IFNULL(SUM(b.amount), 0) as total_revenue
                    FROM packages p
                    LEFT JOIN bookings b ON p.title = b.tour_destination
                `;
                if (start_date && end_date) {
                    query += ' WHERE b.booking_date BETWEEN ? AND ?';
                    params.push(start_date, end_date);
                }
                query += ' GROUP BY p.title';
                break;

            case 'customers':
                filename = 'top_customers.csv';
                query = `
                    SELECT 
                        email, name as customer_name, phone,
                        COUNT(id) as total_bookings,
                        IFNULL(SUM(amount), 0) as total_spent
                    FROM bookings
                `;
                if (start_date && end_date) {
                    query += ' WHERE booking_date BETWEEN ? AND ?';
                    params.push(start_date, end_date);
                }
                query += ' GROUP BY email, name, phone ORDER BY total_spent DESC';
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid report type' });
        }

        const [data] = await pool.query(query, params);

        if (data.length === 0) {
            return res.status(404).json({ success: false, error: 'No data found' });
        }

        // Convert to CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);

    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ success: false, error: 'Failed to export data', message: error.message });
    }
});

// ==================== 8. SUMMARY STATS ====================
router.get('/summary', async (req, res) => {
    try {
        console.log('Summary endpoint hit!');
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN payment_status = 'success' THEN 1 ELSE 0 END) as successful_bookings,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
                SUM(CASE WHEN payment_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
                IFNULL(SUM(amount), 0) as total_revenue,
                IFNULL(AVG(amount), 0) as average_booking_value,
                COUNT(DISTINCT email) as unique_customers,
                COUNT(DISTINCT tour_destination) as unique_destinations
            FROM bookings
        `;

        const params = [];

        if (start_date && end_date) {
            query += ' WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        console.log('Executing summary query');

        const [summary] = await pool.query(query, params);

        console.log('Summary result:', summary[0]);

        res.json({ success: true, data: summary[0] });
    } catch (error) {
        console.error('❌ Summary stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch summary', message: error.message });
    }
});

export default router;