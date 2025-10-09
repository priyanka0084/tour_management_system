import express from 'express';
import { pool } from '../../db.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        // Check what columns exist in the users table
        const [columns] = await pool.execute('SHOW COLUMNS FROM users');
        const columnNames = columns.map(col => col.Field);
        
        // Determine the correct name column
        let nameColumn = 'full_name';
        if (columnNames.includes('fullname')) {
            nameColumn = 'fullname';
        } else if (columnNames.includes('name')) {
            nameColumn = 'name';
        } else if (columnNames.includes('full_name')) {
            nameColumn = 'full_name';
        }
        
        const query = `
            SELECT 
                id,
                ${nameColumn} as full_name,
                email,
                role,
                created_at
            FROM users
            ORDER BY created_at DESC
        `;
        
        const [users] = await pool.execute(query);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// UPDATE user role
router.put('/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        await pool.execute(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, id]
        );
        
        res.json({ success: true, message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user role' });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

export default router;
