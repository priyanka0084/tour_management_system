import express from 'express';
const router = express.Router();
import { pool } from '../db.js';
import { sendBookingConfirmation } from '../services/emailService.js';
import rateLimit from 'express-rate-limit';
import * as whatsappService from '../services/whatsappService.js';

// Rate limiter for email resend (max 3 emails per 15 minutes)
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: { success: false, error: 'Too many email requests. Please try again after 15 minutes.' }
});

// ---------------- BOOKING ROUTES ----------------

// POST /api/bookings - Create new booking
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

        if (!name || !email || !phone || !tour_destination || !tour_date) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
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

        // Send WhatsApp confirmation if phone exists
        const [users] = await pool.execute(
            'SELECT phone FROM users WHERE email = ?',
            [email]
        );
        if (users[0]?.phone) {
            await whatsappService.sendBookingConfirmation(
                { id: result.insertId, name, email, phone }, 
                users[0].phone
            );
        }

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
                id, name, email, phone, tour_destination, tour_date, departure,
                adults, children, infants, special_requests, booking_date,
                payment_status, payment_method, transaction_id, amount
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
                id, name, email, phone, tour_destination, tour_date, departure,
                adults, children, infants, special_requests, booking_date,
                payment_status, payment_method, transaction_id, amount
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

// GET /api/bookings/:id/complete-details
router.get('/:id/complete-details', async (req, res) => {
    try {
        const { id } = req.params;

        const [bookingRows] = await pool.execute(`
            SELECT 
                id, name, email, phone, tour_destination, tour_date, departure,
                adults, children, infants, special_requests, booking_date,
                payment_status, payment_method, transaction_id, amount
            FROM bookings 
            WHERE id = ?
        `, [id]);

        if (bookingRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const booking = bookingRows[0];

        const [billingRows] = await pool.execute('SELECT * FROM billing_details WHERE booking_id = ?', [id]);
        const [passengerRows] = await pool.execute('SELECT * FROM passengers WHERE booking_id = ?', [id]);

        res.json({
            success: true,
            booking: booking,
            billing: billingRows[0] || null,
            passengers: passengerRows
        });

    } catch (error) {
        console.error('Get complete booking details error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ---------------- PAYMENT ROUTES ----------------
router.post('/payments', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { bookingId, amount, cardNumber, expiry, cvv, method, billing, passengers } = req.body;

        if (!bookingId || !amount || !cardNumber || !expiry || !cvv) {
            await connection.rollback();
            return res.status(400).json({ success: false, error: 'Missing required payment fields' });
        }

        const [bookingRows] = await connection.execute('SELECT id FROM bookings WHERE id = ?', [bookingId]);
        if (bookingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const transaction_id = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        await connection.execute(`
            UPDATE bookings 
            SET payment_status = ?, payment_method = ?, transaction_id = ?, amount = ? 
            WHERE id = ?
        `, ['success', method || 'Credit Card', transaction_id, amount, bookingId]);

        if (billing) {
            await connection.execute(`
                INSERT INTO billing_details 
                (booking_id, first_name, last_name, company_name, country, street_address, 
                 apartment, city, state, pin_code, phone, email, order_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                bookingId,
                billing.first_name,
                billing.last_name,
                billing.company_name || null,
                billing.country || 'India',
                billing.street_address,
                billing.apartment || null,
                billing.city,
                billing.state || 'Tamil Nadu',
                billing.pin_code,
                billing.phone,
                billing.email,
                billing.order_notes || null
            ]);
        }

        if (passengers && Array.isArray(passengers)) {
            for (const p of passengers) {
                await connection.execute(`
                    INSERT INTO passengers 
                    (booking_id, first_name, last_name, email, dob, gender)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [bookingId, p.first_name, p.last_name, p.email || null, p.dob, p.gender]);
            }
        }

        await connection.commit();

        res.json({ success: true, message: 'Payment processed successfully', transaction_id, amount, status: 'success' });

    } catch (error) {
        await connection.rollback();
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, error: 'Payment processing failed' });
    } finally {
        connection.release();
    }
});

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

// POST /api/bookings/:id/resend-email
router.post('/:id/resend-email', emailLimiter, async (req, res) => {
    try {
        const { id } = req.params;

        const [bookingRows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
        if (bookingRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const booking = bookingRows[0];
        const [billingRows] = await pool.execute('SELECT * FROM billing_details WHERE booking_id = ?', [id]);
        const [passengerRows] = await pool.execute('SELECT * FROM passengers WHERE booking_id = ?', [id]);

        const result = await sendBookingConfirmation({
            booking: booking,
            billing: billingRows[0] || null,
            passengers: passengerRows
        });

        if (result.success) {
            res.json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(500).json({ success: false, error: 'Failed to send email' });
        }

    } catch (error) {
        console.error('Resend email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
