import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import {
    sendBookingConfirmation,
    sendPaymentStatus,
    sendPromotionalOffer,
    sendTripReminder,
    sendReviewRequest
} from '../services/whatsappService.js';

const router = express.Router();

// Send Booking Confirmation
router.post('/send-booking-confirmation', authMiddleware, async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'Booking ID is required' });
        }

        const [bookings] = await pool.execute(
            `SELECT b.*, u.phone, u.id as user_id 
             FROM bookings b
             LEFT JOIN users u ON b.email = u.email
             WHERE b.id = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const booking = bookings[0];

        if (req.user.role !== 'admin' && booking.email !== req.user.email) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const phone = booking.phone || req.user.phone;

        if (!phone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number not found. Please update your profile.' 
            });
        }

        const result = await sendBookingConfirmation(booking, phone);

        res.json({
            success: result.success,
            message: result.success 
                ? 'WhatsApp confirmation sent successfully' 
                : 'Failed to send WhatsApp confirmation',
            details: result
        });
    } catch (error) {
        console.error('Send booking confirmation error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Send Payment Status
router.post('/send-payment-status', authMiddleware, async (req, res) => {
    try {
        const { bookingId, status = 'success' } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'Booking ID is required' });
        }

        const [bookings] = await pool.execute(
            `SELECT b.*, u.phone, u.id as user_id 
             FROM bookings b
             LEFT JOIN users u ON b.email = u.email
             WHERE b.id = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const booking = bookings[0];

        if (req.user.role !== 'admin' && booking.email !== req.user.email) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const phone = booking.phone || req.user.phone;

        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number not found' });
        }

        const result = await sendPaymentStatus(booking, phone, status);

        res.json({
            success: result.success,
            message: result.success 
                ? 'Payment status sent successfully' 
                : 'Failed to send payment status',
            details: result
        });
    } catch (error) {
        console.error('Send payment status error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Send Promotional Offer (Admin Only)
router.post('/send-promotion', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { userIds, offerDetails } = req.body;

        if (!offerDetails || !offerDetails.message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Offer details with message are required' 
            });
        }

        let users = [];

        if (userIds === 'all') {
            [users] = await pool.execute(
                'SELECT id, name as full_name, email, phone FROM users WHERE phone IS NOT NULL'
            );
        } else if (Array.isArray(userIds)) {
            [users] = await pool.execute(
                'SELECT id, name as full_name, email, phone FROM users WHERE id IN (?) AND phone IS NOT NULL',
                [userIds]
            );
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid userIds format. Use array or "all"' 
            });
        }

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No users found with phone numbers' 
            });
        }

        const results = [];
        for (const user of users) {
            const result = await sendPromotionalOffer(user.id, user.full_name, user.phone, offerDetails);
            results.push({ userId: user.id, userName: user.full_name, success: result.success });
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `Promotional offers sent to ${successCount}/${users.length} users`,
            details: results
        });
    } catch (error) {
        console.error('Send promotion error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Send Trip Reminder
router.post('/send-trip-reminder', authMiddleware, async (req, res) => {
    try {
        const daysAhead = req.body.daysAhead || 3;

        const [bookings] = await pool.execute(
            `SELECT b.*, u.phone, u.id as user_id 
             FROM bookings b
             LEFT JOIN users u ON b.email = u.email
             WHERE b.status = 'confirmed'
             AND b.tour_date = DATE_ADD(CURDATE(), INTERVAL ? DAY)
             AND u.phone IS NOT NULL`,
            [daysAhead]
        );

        if (bookings.length === 0) {
            return res.json({ success: true, message: `No trips starting in ${daysAhead} days` });
        }

        const results = [];
        for (const booking of bookings) {
            const result = await sendTripReminder(booking, booking.phone, daysAhead);
            results.push({ bookingId: booking.id, success: result.success });
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `Reminders sent to ${successCount}/${bookings.length} users`,
            details: results
        });
    } catch (error) {
        console.error('Send trip reminder error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Send Review Request
router.post('/send-review-request', authMiddleware, async (req, res) => {
    try {
        const [bookings] = await pool.execute(
            `SELECT b.*, u.phone, u.id as user_id 
             FROM bookings b
             LEFT JOIN users u ON b.email = u.email
             LEFT JOIN reviews r ON r.booking_id = b.id
             WHERE b.status = 'completed'
             AND b.tour_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
             AND r.id IS NULL
             AND u.phone IS NOT NULL`
        );

        if (bookings.length === 0) {
            return res.json({ success: true, message: 'No completed trips to request reviews for' });
        }

        const results = [];
        for (const booking of bookings) {
            const result = await sendReviewRequest(booking, booking.phone);
            results.push({ bookingId: booking.id, success: result.success });
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `Review requests sent to ${successCount}/${bookings.length} users`,
            details: results
        });
    } catch (error) {
        console.error('Send review request error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;