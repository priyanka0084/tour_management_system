const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// ---------------- BOOKING ROUTES ----------------

// POST /api/bookings - Create a new booking
router.post('/', async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            tour_destination, 
            tour_date, 
            departure, 
            adults, 
            children, 
            infants, 
            special_requests 
        } = req.body;

        // Validation
        if (!name || !email || !phone || !tour_destination || !tour_date) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email format' });
        }

        // Date validation
        const tourDate = new Date(tour_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (tourDate < today) {
            return res.status(400).json({ success: false, error: 'Tour date cannot be in the past' });
        }

        // Total passengers validation
        const total_people = (adults || 0) + (children || 0) + (infants || 0);
        if (total_people < 1 || total_people > 50) {
            return res.status(400).json({ success: false, error: 'Total passengers must be between 1 and 50' });
        }

        const query = `
            INSERT INTO bookings 
            (name, email, phone, tour_destination, tour_date, departure, adults, children, infants, special_requests) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            name,
            email,
            phone,
            tour_destination,
            tour_date,
            departure || null,
            adults || 0,
            children || 0,
            infants || 0,
            special_requests || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: result.insertId
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/bookings - Get all bookings
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                name,
                email,
                phone,
                tour_destination,
                tour_date,
                departure,
                adults,
                children,
                infants,
                special_requests,
                booking_date,
                payment_status,
                payment_method,
                transaction_id,
                amount
            FROM bookings 
            ORDER BY booking_date DESC
        `;

        const [rows] = await pool.execute(query);

        res.json({ success: true, bookings: rows });

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id,
                name,
                email,
                phone,
                tour_destination,
                tour_date,
                departure,
                adults,
                children,
                infants,
                special_requests,
                booking_date,
                payment_status,
                payment_method,
                transaction_id,
                amount
            FROM bookings 
            WHERE id = ?
        `;

        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.json({ success: true, booking: rows[0] });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ---------------- PAYMENT ROUTES ----------------

// POST /api/bookings/payments - Process payment
router.post('/payments', async (req, res) => {
    try {
        const { bookingId, amount, cardNumber, expiry, cvv, method } = req.body;

        if (!bookingId || !amount || !cardNumber || !expiry || !cvv) {
            return res.status(400).json({ success: false, error: 'Missing required payment fields' });
        }

        const [bookingRows] = await pool.execute('SELECT id FROM bookings WHERE id = ?', [bookingId]);
        if (bookingRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const transaction_id = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const [updateResult] = await pool.execute(`
            UPDATE bookings 
            SET payment_status = ?, payment_method = ?, transaction_id = ?, amount = ? 
            WHERE id = ?
        `, ['success', method || 'Credit Card', transaction_id, amount, bookingId]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Failed to update booking' });
        }

        res.json({
            success: true,
            message: 'Payment processed successfully',
            transaction_id,
            amount,
            status: 'success'
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, error: 'Payment processing failed' });
    }
});

// PUT /api/bookings/:id/payment - Update payment status
router.put('/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method, transaction_id, amount, payment_status } = req.body;

        if (!payment_method || !amount) {
            return res.status(400).json({ success: false, error: 'Payment method and amount are required' });
        }

        const [result] = await pool.execute(`
            UPDATE bookings 
            SET payment_status = ?, payment_method = ?, transaction_id = ?, amount = ? 
            WHERE id = ?
        `, [payment_status || 'success', payment_method, transaction_id || null, amount, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.json({ success: true, message: 'Payment updated successfully' });

    } catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/bookings/payments/all - Get all payments
router.get('/payments/all', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, name, email, tour_destination, tour_date, payment_status, 
                   payment_method, transaction_id, amount, booking_date
            FROM bookings
            WHERE payment_status IS NOT NULL
            ORDER BY booking_date DESC
        `);

        res.json({ success: true, payments: rows });

    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
