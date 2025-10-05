// bookingConfirmation.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// Get booking confirmation details
router.get('/api/booking-confirmation', async (req, res) => {
  const { id, reference } = req.query;

  if (!id && !reference) {
    return res.status(400).json({ error: 'Booking ID or reference required' });
  }

  try {
    let query = `
      SELECT 
        b.id,
        b.booking_reference,
        b.name,
        b.email,
        b.phone,
        b.tour_destination,
        b.tour_date,
        b.departure,
        b.adults,
        b.children,
        b.infants,
        b.special_requests,
        b.amount,
        b.discount_amount,
        b.payment_status,
        b.payment_method,
        b.transaction_id,
        b.status,
        b.booking_date,
        p.title as packageName,
        p.duration_days,
        p.services,
        pl.name as destination,
        pl.country_id,
        c.name as country,
        bd.first_name as billing_first_name,
        bd.last_name as billing_last_name,
        bd.street_address,
        bd.city,
        bd.state,
        bd.pin_code
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN places pl ON p.place_id = pl.id
      LEFT JOIN countries c ON pl.country_id = c.id
      LEFT JOIN billing_details bd ON bd.booking_id = b.id
      WHERE ${id ? 'b.id = ?' : 'b.booking_reference = ?'}
    `;

    const [bookings] = await pool.execute(query, [id || reference]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Get passengers
    const [passengers] = await pool.execute(
      'SELECT first_name, last_name, email, dob, gender FROM passengers WHERE booking_id = ?',
      [booking.id]
    );

    // Calculate subtotal
    const subtotal = booking.amount + (booking.discount_amount || 0);

    res.json({
      ...booking,
      passengers,
      subtotal
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// Send confirmation email
router.post('/api/send-confirmation-email', async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID required' });
  }

  try {
    // Fetch booking details
    const [bookings] = await pool.execute(`
      SELECT 
        b.*,
        p.title as packageName,
        pl.name as destination
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN places pl ON p.place_id = pl.id
      WHERE b.id = ?
    `, [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Email HTML template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-ref { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
            <p>Thank you for choosing JourneyHub</p>
          </div>
          
          <div class="content">
            <div class="booking-ref">
              Booking Reference: ${booking.booking_reference}
            </div>
            
            <h2>Hi ${booking.name},</h2>
            <p>Your booking for <strong>${booking.packageName}</strong> has been confirmed!</p>
            
            <div class="details">
              <h3>Booking Details</h3>
              <div class="row">
                <span class="label">Destination:</span>
                <span class="value">${booking.destination}</span>
              </div>
              <div class="row">
                <span class="label">Travel Date:</span>
                <span class="value">${new Date(booking.tour_date).toLocaleDateString()}</span>
              </div>
              <div class="row">
                <span class="label">Departure:</span>
                <span class="value">${booking.departure}</span>
              </div>
              <div class="row">
                <span class="label">Travelers:</span>
                <span class="value">${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants</span>
              </div>
              <div class="row">
                <span class="label">Total Amount:</span>
                <span class="value">₹${booking.amount.toLocaleString()}</span>
              </div>
              <div class="row">
                <span class="label">Payment Status:</span>
                <span class="value">${booking.payment_status}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/booking-confirmation?reference=${booking.booking_reference}" class="button">View Booking</a>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <h3>What's Next?</h3>
            <ul>
              <li>Save this email for your records</li>
              <li>We'll contact you 24-48 hours before your travel date</li>
              <li>You can manage your booking from your dashboard</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Need help? Contact us at support@journeyhub.com or call +91 98765 43210</p>
            <p>&copy; 2024 JourneyHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: '"JourneyHub" <bookings@journeyhub.com>',
      to: booking.email,
      subject: `Booking Confirmed - ${booking.booking_reference}`,
      html: emailHTML
    });

    // Log email sent
    await pool.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [
        booking.user_id,
        'booking_confirmation',
        'Booking Confirmation Email Sent',
        `Confirmation email sent for booking ${booking.booking_reference}`,
        JSON.stringify({ bookingId: booking.id, email: booking.email })
      ]
    );

    res.json({ success: true, message: 'Confirmation email sent successfully' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

// Generate PDF receipt
router.get('/api/booking-receipt/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Fetch booking details
    const [bookings] = await pool.execute(`
      SELECT 
        b.*,
        p.title as packageName,
        p.duration_days,
        pl.name as destination,
        c.name as country
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN places pl ON p.place_id = pl.id
      LEFT JOIN countries c ON pl.country_id = c.id
      WHERE b.id = ?
    `, [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Create PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=JourneyHub_Booking_${booking.booking_reference}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20)
       .text('JourneyHub', 50, 50)
       .fontSize(12)
       .text('Travel Booking Receipt', 50, 80);

    doc.moveDown();
    
    // Booking reference box
    doc.rect(50, 120, 500, 40)
       .fillAndStroke('#e3f2fd', '#0891b2');
    
    doc.fillColor('#000')
       .fontSize(16)
       .text(`Booking Reference: ${booking.booking_reference}`, 60, 135);

    // Customer details
    doc.fontSize(14)
       .text('Customer Details', 50, 190)
       .fontSize(10)
       .text(`Name: ${booking.name}`, 50, 210)
       .text(`Email: ${booking.email}`, 50, 225)
       .text(`Phone: ${booking.phone}`, 50, 240);

    // Booking details
    doc.fontSize(14)
       .text('Booking Details', 300, 190)
       .fontSize(10)
       .text(`Package: ${booking.packageName}`, 300, 210)
       .text(`Destination: ${booking.destination}, ${booking.country}`, 300, 225)
       .text(`Travel Date: ${new Date(booking.tour_date).toLocaleDateString()}`, 300, 240)
       .text(`Duration: ${booking.duration_days} days`, 300, 255);

    // Traveler details
    doc.fontSize(14)
       .text('Travelers', 50, 290)
       .fontSize(10)
       .text(`Adults: ${booking.adults}`, 50, 310)
       .text(`Children: ${booking.children}`, 50, 325)
       .text(`Infants: ${booking.infants}`, 50, 340);

    // Payment details
    doc.fontSize(14)
       .text('Payment Details', 300, 290)
       .fontSize(10)
       .text(`Total Amount: ₹${booking.amount.toLocaleString()}`, 300, 310)
       .text(`Payment Status: ${booking.payment_status}`, 300, 325)
       .text(`Payment Method: ${booking.payment_method || 'N/A'}`, 300, 340);

    // Footer
    doc.fontSize(8)
       .text('Thank you for choosing JourneyHub!', 50, 700, { align: 'center' })
       .text('For support, contact: support@journeyhub.com | +91 98765 43210', 50, 715, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF receipt' });
  }
});

module.exports = router;