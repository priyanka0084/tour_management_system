// contactUs.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

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

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Submit contact form
router.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, inquiry_type, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Insert inquiry into database
    const [result] = await pool.execute(
      `INSERT INTO contact_inquiries 
       (name, email, phone, subject, message, inquiry_type, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [name, email, phone || null, subject, message, inquiry_type]
    );

    const inquiryId = result.insertId;

    // Send email to admin
    const adminEmailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f4f4f4; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #666; }
          .value { margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Inquiry</h1>
            <p>Inquiry #${inquiryId}</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <div class="label">Phone:</div>
              <div class="value">${phone || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="label">Inquiry Type:</div>
              <div class="value">${inquiry_type}</div>
            </div>
            <div class="field">
              <div class="label">Subject:</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="value">${message}</div>
            </div>
            <p style="margin-top: 20px;">
              <a href="${process.env.ADMIN_URL}/inquiries/${inquiryId}" 
                 style="background: #0891b2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View in Admin Panel
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"JourneyHub Contact" <contact@journeyhub.com>',
      to: process.env.ADMIN_EMAIL || 'admin@journeyhub.com',
      subject: `New Contact Inquiry: ${subject}`,
      html: adminEmailHTML
    });

    // Send auto-reply to user
    const userEmailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Us!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for reaching out to JourneyHub. We have received your inquiry and will get back to you within 24 hours.</p>
            <p><strong>Your Inquiry Details:</strong></p>
            <ul>
              <li><strong>Subject:</strong> ${subject}</li>
              <li><strong>Reference Number:</strong> #${inquiryId}</li>
            </ul>
            <p>In the meantime, you might find answers to your questions in our <a href="${process.env.FRONTEND_URL}/faq">FAQ section</a>.</p>
            <p>For urgent matters, please call us at +91 98765 43210.</p>
            <p>Best regards,<br>The JourneyHub Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 JourneyHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"JourneyHub Support" <support@journeyhub.com>',
      to: email,
      subject: 'We received your inquiry - JourneyHub',
      html: userEmailHTML
    });

    res.json({ 
      success: true, 
      message: 'Your message has been sent successfully',
      inquiryId 
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// Get inquiries (Admin)
router.get('/api/admin/inquiries', async (req, res) => {
  try {
    const adminId = req.session?.userId || req.headers['x-user-id'];
    
    // Verify admin role
    const [admins] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || admins[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, inquiry_type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (inquiry_type && inquiry_type !== 'all') {
      conditions.push('inquiry_type = ?');
      params.push(inquiry_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [inquiries] = await pool.execute(
      `SELECT * FROM contact_inquiries 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json(inquiries);

  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Update inquiry status (Admin)
router.put('/api/admin/inquiries/:id/status', async (req, res) => {
  try {
    const adminId = req.session?.userId || req.headers['x-user-id'];
    const { id } = req.params;
    const { status, response } = req.body;

    // Verify admin role
    const [admins] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || admins[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update inquiry
    await pool.execute(
      `UPDATE contact_inquiries 
       SET status = ?, response = ?, assigned_to = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, response || null, adminId, id]
    );

    // If resolved and response provided, send email to user
    if (status === 'resolved' && response) {
      const [inquiries] = await pool.execute(
        'SELECT * FROM contact_inquiries WHERE id = ?',
        [id]
      );

      if (inquiries.length > 0) {
        const inquiry = inquiries[0];

        const responseEmailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
              .original-inquiry { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Response to Your Inquiry</h1>
              </div>
              <div class="content">
                <p>Hi ${inquiry.name},</p>
                <p>Thank you for your patience. Here's our response to your inquiry:</p>
                
                <div class="original-inquiry">
                  <p><strong>Your Original Inquiry:</strong></p>
                  <p><em>${inquiry.subject}</em></p>
                  <p>${inquiry.message}</p>
                </div>
                
                <p><strong>Our Response:</strong></p>
                <p>${response}</p>
                
                <p>If you have any further questions, please don't hesitate to contact us again.</p>
                
                <p>Best regards,<br>The JourneyHub Support Team</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: '"JourneyHub Support" <support@journeyhub.com>',
          to: inquiry.email,
          subject: `Re: ${inquiry.subject}`,
          html: responseEmailHTML
        });
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// Get inquiry statistics (Admin)
router.get('/api/admin/inquiries/stats', async (req, res) => {
  try {
    const adminId = req.session?.userId || req.headers['x-user-id'];

    // Verify admin role
    const [admins] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || admins[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_inquiries,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7d
      FROM contact_inquiries
    `);

    const [typeStats] = await pool.execute(`
      SELECT inquiry_type, COUNT(*) as count
      FROM contact_inquiries
      GROUP BY inquiry_type
    `);

    res.json({
      overview: stats[0],
      byType: typeStats
    });

  } catch (error) {
    console.error('Error fetching inquiry stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Subscribe to newsletter
router.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email, name, preferences } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if already subscribed
    const [existing] = await pool.execute(
      'SELECT id, is_subscribed FROM newsletter_subscriptions WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      if (existing[0].is_subscribed) {
        return res.status(400).json({ error: 'Email already subscribed' });
      } else {
        // Resubscribe
        await pool.execute(
          'UPDATE newsletter_subscriptions SET is_subscribed = TRUE, subscribed_at = NOW() WHERE email = ?',
          [email]
        );
      }
    } else {
      // New subscription
      await pool.execute(
        'INSERT INTO newsletter_subscriptions (email, name, preferences) VALUES (?, ?, ?)',
        [email, name || null, JSON.stringify(preferences || {})]
      );
    }

    // Send welcome email
    const welcomeEmailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to JourneyHub Newsletter!</h1>
          </div>
          <div class="content">
            <p>Hi ${name || 'Travel Enthusiast'},</p>
            <p>Thank you for subscribing to our newsletter!</p>
            <p>You'll now receive:</p>
            <ul>
              <li>Exclusive travel deals and offers</li>
              <li>New destination highlights</li>
              <li>Travel tips and guides</li>
              <li>Special promotions for subscribers</li>
            </ul>
            <p>Stay tuned for amazing travel inspiration!</p>
            <p>Happy travels,<br>The JourneyHub Team</p>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              If you wish to unsubscribe, <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${email}">click here</a>.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"JourneyHub Newsletter" <newsletter@journeyhub.com>',
      to: email,
      subject: 'Welcome to JourneyHub Newsletter!',
      html: welcomeEmailHTML
    });

    res.json({ success: true, message: 'Successfully subscribed to newsletter' });

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

module.exports = router;