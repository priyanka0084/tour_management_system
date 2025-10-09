import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET all bookings
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                b.*,
                bd.first_name,
                bd.last_name,
                bd.email,
                bd.phone,
                bd.city,
                bd.state
            FROM bookings b
            LEFT JOIN billing_details bd ON b.id = bd.booking_id
            ORDER BY b.booking_date DESC
        `;
        
        const [bookings] = await pool.execute(query);
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
});

// UPDATE booking status (accept)
router.put('/:id/accept', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute(
            'UPDATE bookings SET payment_status = ? WHERE id = ?',
            ['Confirmed', id]
        );
        
        res.json({ success: true, message: 'Booking accepted successfully' });
    } catch (error) {
        console.error('Accept booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to accept booking' });
    }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete booking' });
    }
});

export default router;