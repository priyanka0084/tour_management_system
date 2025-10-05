// adminDashboard.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'tour_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const userId = req.session?.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = { id: userId };
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Get dashboard statistics
router.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    // Total bookings and revenue
    const [bookingStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalBookings,
        SUM(amount) as totalRevenue,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingBookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmedBookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedBookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledBookings
      FROM bookings
    `);

    // Monthly trends (last 30 days vs previous 30 days)
    const [currentMonthBookings] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [previousMonthBookings] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        AND booking_date < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const bookingsTrend = previousMonthBookings[0].count > 0
      ? Math.round(((currentMonthBookings[0].count - previousMonthBookings[0].count) / previousMonthBookings[0].count) * 100)
      : 100;

    // User statistics
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as adminUsers,
        COUNT(CASE WHEN email_verified = 1 THEN 1 END) as verifiedUsers,
        COUNT(CASE WHEN DATE(last_login) = CURDATE() THEN 1 END) as activeToday
      FROM users
    `);

    // Destinations and packages
    const [destinationStats] = await pool.execute('SELECT COUNT(*) as totalDestinations FROM places');
    const [packageStats] = await pool.execute('SELECT COUNT(*) as totalPackages FROM packages');

    // Revenue trend
    const [currentMonthRevenue] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue
      FROM bookings
      WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND payment_status = 'completed'
    `);

    const [previousMonthRevenue] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as revenue
      FROM bookings
      WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        AND booking_date < DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND payment_status = 'completed'
    `);

    const revenueTrend = previousMonthRevenue[0].revenue > 0
      ? Math.round(((currentMonthRevenue[0].revenue - previousMonthRevenue[0].revenue) / previousMonthRevenue[0].revenue) * 100)
      : 100;

    res.json({
      ...bookingStats[0],
      ...userStats[0],
      ...destinationStats[0],
      ...packageStats[0],
      bookingsTrend,
      revenueTrend,
      usersTrend: 15, // Calculate actual trend
      destinationsTrend: 5 // Calculate actual trend
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get bookings with filters
router.get('/api/admin/bookings', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      startDate, 
      endDate,
      paymentStatus 
    } = req.query;

    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];

    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (paymentStatus) {
      conditions.push('b.payment_status = ?');
      params.push(paymentStatus);
    }

    if (search) {
      conditions.push('(b.name LIKE ? OR b.email LIKE ? OR b.booking_reference LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      conditions.push('b.tour_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('b.tour_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`,
      params
    );

    // Get bookings
    const [bookings] = await pool.execute(
      `SELECT 
        b.*,
        p.title as packageName,
        pl.name as destination,
        u.name as userName,
        u.email as userEmail
       FROM bookings b
       LEFT JOIN packages p ON b.package_id = p.id
       LEFT JOIN places pl ON p.place_id = pl.id
       LEFT JOIN users u ON b.user_id = u.id
       ${whereClause}
       ORDER BY b.booking_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      bookings,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.put('/api/admin/bookings/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );

    // Log admin activity
    await pool.execute(
      `INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, new_data)
       VALUES (?, ?, ?, ?, ?)`,
      [req.admin.id, 'update_booking_status', 'booking', id, JSON.stringify({ status })]
    );

    // Send notification to user
    const [bookings] = await pool.execute(
      'SELECT user_id, booking_reference FROM bookings WHERE id = ?',
      [id]
    );

    if (bookings[0]?.user_id) {
      await pool.execute(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          bookings[0].user_id,
          'booking_status_update',
          'Booking Status Updated',
          `Your booking ${bookings[0].booking_reference} status has been updated to ${status}`,
          JSON.stringify({ bookingId: id, status })
        ]
      );
    }

    res.json({ success: true, message: 'Status updated successfully' });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get users with filters
router.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, verified } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (verified !== undefined) {
      conditions.push('email_verified = ?');
      params.push(verified === 'true' ? 1 : 0);
    }

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [users] = await pool.execute(
      `SELECT 
        id, name, email, phone, role, personality_profile,
        profile_image, created_at, last_login, email_verified as is_verified
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Parse personality profiles
    users.forEach(user => {
      if (user.personality_profile) {
        const profile = JSON.parse(user.personality_profile);
        user.personality_type = profile.personality;
      }
    });

    res.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/api/admin/users/:id/role', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    // Log activity
    await pool.execute(
      `INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, new_data)
       VALUES (?, ?, ?, ?, ?)`,
      [req.admin.id, 'update_user_role', 'user', id, JSON.stringify({ role })]
    );

    res.json({ success: true, message: 'Role updated successfully' });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Get destinations
router.get('/api/admin/destinations', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, country } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (country) {
      conditions.push('c.name = ?');
      params.push(country);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [destinations] = await pool.execute(
      `SELECT 
        p.*,
        c.name as country,
        COUNT(DISTINCT pkg.id) as package_count,
        COUNT(DISTINCT b.id) as booking_count
       FROM places p
       LEFT JOIN countries c ON p.country_id = c.id
       LEFT JOIN packages pkg ON p.id = pkg.place_id
       LEFT JOIN bookings b ON pkg.id = b.package_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(destinations);

  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Get packages
router.get('/api/admin/packages', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, placeId } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];

    if (placeId) {
      conditions.push('p.place_id = ?');
      params.push(placeId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [packages] = await pool.execute(
      `SELECT 
        p.*,
        pl.name as place_name,
        COUNT(b.id) as booking_count,
        SUM(CASE WHEN b.status = 'completed' THEN b.amount ELSE 0 END) as total_revenue
       FROM packages p
       LEFT JOIN places pl ON p.place_id = pl.id
       LEFT JOIN bookings b ON p.id = b.package_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(packages);

  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Get revenue analytics
router.get('/api/admin/analytics/revenue', authenticateAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let interval;
    let format;

    switch (period) {
      case 'week':
        interval = '7 DAY';
        format = '%Y-%m-%d';
        break;
      case 'month':
        interval = '30 DAY';
        format = '%Y-%m-%d';
        break;
      case 'year':
        interval = '365 DAY';
        format = '%Y-%m';
        break;
      default:
        interval = '30 DAY';
        format = '%Y-%m-%d';
    }

    const [revenue] = await pool.execute(`
      SELECT 
        DATE_FORMAT(booking_date, ?) as date,
        SUM(amount) as revenue,
        COUNT(*) as bookings
      FROM bookings
      WHERE booking_date >= DATE_SUB(NOW(), INTERVAL ${interval})
        AND payment_status = 'completed'
      GROUP BY DATE_FORMAT(booking_date, ?)
      ORDER BY booking_date`,
      [format, format]
    );

    res.json(revenue);

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get activity logs
router.get('/api/admin/activity-logs', authenticateAdmin, async (req, res) => {
  try {
    const [logs] = await pool.execute(
      `SELECT 
        al.*,
        u.name as admin_name
       FROM admin_activity_logs al
       JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );

    res.json(logs);

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;