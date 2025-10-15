import express from 'express';
import { pool } from '../../db.js';

const router = express.Router();

// ==================== 1. PACKAGE-WISE ANALYTICS ====================
router.get('/packages-analytics', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'AND b.booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [packageStats] = await pool.execute(`
            SELECT 
                p.id as package_id,
                p.title as package_name,
                p.price as package_price,
                p.duration_days,
                COUNT(b.id) as total_bookings,
                SUM(b.amount) as total_revenue,
                AVG(b.amount) as avg_booking_value,
                COUNT(CASE WHEN b.payment_status = 'success' THEN 1 END) as successful_bookings,
                COUNT(CASE WHEN b.payment_status = 'pending' THEN 1 END) as pending_bookings
            FROM packages p
            LEFT JOIN bookings b ON p.title = b.tour_destination ${dateFilter}
            GROUP BY p.id, p.title, p.price, p.duration_days
            ORDER BY total_revenue DESC
        `, params);

        res.json({ success: true, data: packageStats });
    } catch (error) {
        console.error('Package analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch package analytics' });
    }
});

// ==================== 2. BOOKING STATUS BREAKDOWN ====================
router.get('/booking-status', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [statusBreakdown] = await pool.execute(`
            SELECT 
                COALESCE(payment_status, 'pending') as status,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bookings ${dateFilter})), 2) as percentage
            FROM bookings
            ${dateFilter}
            GROUP BY payment_status
            ORDER BY count DESC
        `, start_date && end_date ? [...params, ...params] : []);

        // Get status trends over time
        const [trends] = await pool.execute(`
            SELECT 
                DATE(booking_date) as date,
                COALESCE(payment_status, 'pending') as status,
                COUNT(*) as count
            FROM bookings
            ${dateFilter}
            GROUP BY DATE(booking_date), payment_status
            ORDER BY date DESC
            LIMIT 30
        `, params);

        res.json({ 
            success: true, 
            data: {
                breakdown: statusBreakdown,
                trends: trends
            }
        });
    } catch (error) {
        console.error('Booking status error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch booking status' });
    }
});

// ==================== 3. AVERAGE BOOKING VALUE ====================
router.get('/average-booking-value', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [avgStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_bookings,
                AVG(amount) as average_value,
                MIN(amount) as min_value,
                MAX(amount) as max_value,
                SUM(amount) as total_revenue,
                COUNT(CASE WHEN amount > (SELECT AVG(amount) FROM bookings) THEN 1 END) as high_value_count,
                COUNT(CASE WHEN amount <= (SELECT AVG(amount) FROM bookings) THEN 1 END) as low_value_count
            FROM bookings
            ${dateFilter}
        `, params);

        // Get booking value distribution
        const [distribution] = await pool.execute(`
            SELECT 
                CASE 
                    WHEN amount < 5000 THEN 'Under $5000'
                    WHEN amount BETWEEN 5000 AND 10000 THEN '$5000-$10000'
                    WHEN amount BETWEEN 10000 AND 20000 THEN '$10000-$20000'
                    WHEN amount BETWEEN 20000 AND 50000 THEN '$20000-$50000'
                    ELSE 'Above $50000'
                END as value_range,
                COUNT(*) as count,
                SUM(amount) as total_revenue
            FROM bookings
            ${dateFilter}
            GROUP BY value_range
            ORDER BY MIN(amount)
        `, params);

        res.json({ 
            success: true, 
            data: {
                stats: avgStats[0],
                distribution: distribution
            }
        });
    } catch (error) {
        console.error('Average booking value error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch average booking value' });
    }
});

// ==================== 4. TOP CUSTOMERS ====================
router.get('/top-customers', async (req, res) => {
    try {
        const { start_date, end_date, limit = 10 } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE b.booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        params.push(parseInt(limit));

        const [topCustomers] = await pool.execute(`
            SELECT 
                b.email,
                b.name as customer_name,
                b.phone,
                COUNT(b.id) as total_bookings,
                SUM(b.amount) as total_spent,
                AVG(b.amount) as avg_booking_value,
                MAX(b.booking_date) as last_booking_date,
                COUNT(CASE WHEN b.payment_status = 'success' THEN 1 END) as successful_bookings
            FROM bookings b
            ${dateFilter}
            GROUP BY b.email, b.name, b.phone
            ORDER BY total_spent DESC
            LIMIT ?
        `, params);

        res.json({ success: true, data: topCustomers });
    } catch (error) {
        console.error('Top customers error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch top customers' });
    }
});

// ==================== 5. DESTINATION-WISE ANALYTICS ====================
router.get('/destination-analytics', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [destinationStats] = await pool.execute(`
            SELECT 
                tour_destination as destination,
                COUNT(*) as total_bookings,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_revenue,
                COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_bookings
            FROM bookings
            ${dateFilter}
            GROUP BY tour_destination
            ORDER BY total_bookings DESC
        `, params);

        res.json({ success: true, data: destinationStats });
    } catch (error) {
        console.error('Destination analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch destination analytics' });
    }
});

// ==================== 6. REVENUE ANALYTICS (Day/Week/Month) ====================
router.get('/revenue-analytics', async (req, res) => {
    try {
        const { period = 'day', start_date, end_date } = req.query;

        let dateFilter = '';
        let groupBy = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

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

        const [revenueData] = await pool.execute(`
            SELECT 
                ${groupBy} as period,
                COUNT(*) as total_bookings,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_revenue,
                COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_bookings
            FROM bookings
            ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period DESC
            LIMIT 30
        `, params);

        res.json({ success: true, data: revenueData });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch revenue analytics' });
    }
});

// ==================== 7. EXPORT DATA (CSV) ====================
router.get('/export/csv', async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;

        let query = '';
        const params = [];
        let filename = 'report.csv';

        if (start_date && end_date) {
            params.push(start_date, end_date);
        }

        switch (report_type) {
            case 'bookings':
                filename = 'bookings_report.csv';
                query = `
                    SELECT 
                        id, name, email, phone, tour_destination, tour_date,
                        payment_status, payment_method, amount, booking_date
                    FROM bookings
                    ${start_date && end_date ? 'WHERE booking_date BETWEEN ? AND ?' : ''}
                    ORDER BY booking_date DESC
                `;
                break;

            case 'packages':
                filename = 'packages_analytics.csv';
                query = `
                    SELECT 
                        p.title as package_name,
                        COUNT(b.id) as total_bookings,
                        SUM(b.amount) as total_revenue
                    FROM packages p
                    LEFT JOIN bookings b ON p.title = b.tour_destination
                    ${start_date && end_date ? 'WHERE b.booking_date BETWEEN ? AND ?' : ''}
                    GROUP BY p.title
                `;
                break;

            case 'customers':
                filename = 'top_customers.csv';
                query = `
                    SELECT 
                        email, name as customer_name, phone,
                        COUNT(id) as total_bookings,
                        SUM(amount) as total_spent
                    FROM bookings
                    ${start_date && end_date ? 'WHERE booking_date BETWEEN ? AND ?' : ''}
                    GROUP BY email, name, phone
                    ORDER BY total_spent DESC
                `;
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid report type' });
        }

        const [data] = await pool.execute(query, params);

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
        res.status(500).json({ success: false, error: 'Failed to export data' });
    }
});

// ==================== 8. SUMMARY STATS ====================
router.get('/summary', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE booking_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [summary] = await pool.execute(`
            SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN payment_status = 'success' THEN 1 ELSE 0 END) as successful_bookings,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
                SUM(CASE WHEN payment_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
                SUM(amount) as total_revenue,
                AVG(amount) as average_booking_value,
                COUNT(DISTINCT email) as unique_customers,
                COUNT(DISTINCT tour_destination) as unique_destinations
            FROM bookings
            ${dateFilter}
        `, params);

        res.json({ success: true, data: summary[0] });
    } catch (error) {
        console.error('Summary stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch summary' });
    }
});

export default router;