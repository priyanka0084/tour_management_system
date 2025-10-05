const nodemailer = require('nodemailer');
require('dotenv').config();

// DEBUG: Check if env variables are loaded
console.log('📧 Email Config Check:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Found' : '❌ Missing');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Found' : '❌ Missing');
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'smtp.gmail.com'
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD // Your app password
    },
    tls: {
        rejectUnauthorized: false  // ← This fixes the SSL error
    }
});

// Test connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

// Format date helper
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
};

// Send booking confirmation email
const sendBookingConfirmation = async (bookingData) => {
    const { booking, billing, passengers } = bookingData;

    const passengersList = passengers && passengers.length > 0 
        ? passengers.map((p, i) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${i + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.first_name} ${p.last_name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.gender}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(p.dob)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="4" style="padding: 8px; text-align: center;">No passenger details available</td></tr>';

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ff6b6b, #f39c12); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
                <p style="margin: 10px 0 0; font-size: 16px;">Your dream trip awaits!</p>
            </div>

            <!-- Success Message -->
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #065f46;">
                    ✅ <strong>Payment Successful!</strong> Your booking has been confirmed.
                </p>
            </div>

            <!-- Booking Details -->
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #ff6b6b; margin-top: 0;">Booking Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 40%;">Booking ID:</td>
                        <td style="padding: 8px 0;">#${booking.id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Transaction ID:</td>
                        <td style="padding: 8px 0;">${booking.transaction_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Name:</td>
                        <td style="padding: 8px 0;">${booking.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                        <td style="padding: 8px 0;">${booking.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                        <td style="padding: 8px 0;">${booking.phone}</td>
                    </tr>
                </table>
            </div>

            <!-- Trip Details -->
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #ff6b6b; margin-top: 0;">Trip Information</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 40%;">Destination:</td>
                        <td style="padding: 8px 0;">🏝️ ${booking.tour_destination}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Departure From:</td>
                        <td style="padding: 8px 0;">✈️ ${booking.departure || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Travel Date:</td>
                        <td style="padding: 8px 0;">📅 ${formatDate(booking.tour_date)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Passengers:</td>
                        <td style="padding: 8px 0;">
                            👥 Adults: ${booking.adults || 0} | 
                            Children: ${booking.children || 0} | 
                            Infants: ${booking.infants || 0}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Passenger Details -->
            ${passengers && passengers.length > 0 ? `
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #ff6b6b; margin-top: 0;">Passenger Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f9fafb;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">#</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Gender</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">DOB</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${passengersList}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Payment Summary -->
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #065f46; margin-top: 0;">Payment Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Payment Method:</td>
                        <td style="padding: 8px 0;">${booking.payment_method}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td>
                        <td style="padding: 8px 0; font-size: 20px; color: #065f46;">₹${parseFloat(booking.amount).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                        <td style="padding: 8px 0;"><span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px;">✅ Success</span></td>
                    </tr>
                </table>
            </div>

            <!-- Next Steps -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #92400e;">📋 What's Next?</h3>
                <ol style="margin: 10px 0; padding-left: 20px; color: #92400e;">
                    <li>Save this confirmation email for your records</li>
                    <li>Prepare necessary travel documents (passport, visa)</li>
                    <li>Pack according to your destination's weather</li>
                    <li>Contact us for any special requests or changes</li>
                </ol>
            </div>

            <!-- Contact Support -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0;">Need Help?</h3>
                <p style="margin: 10px 0;">Our support team is here 24/7</p>
                <p style="margin: 10px 0;">
                    📧 support@exploreease.com | 📞 +91 98765 43210
                </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; color: #6b7280; font-size: 14px;">
                <p>Thank you for choosing ExploreEase! 🌍✈️</p>
                <p style="margin: 10px 0;">
                    © ${new Date().getFullYear()} ExploreEase. All rights reserved.
                </p>
                <p style="margin: 10px 0;">
                    <a href="#" style="color: #ff6b6b; text-decoration: none;">Unsubscribe</a> | 
                    <a href="#" style="color: #ff6b6b; text-decoration: none;">Privacy Policy</a>
                </p>
            </div>

        </body>
        </html>
    `;

    const mailOptions = {
        from: `"ExploreEase Tours" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `Booking Confirmed - #${booking.id} | ${booking.tour_destination}`,
        html: emailHtml
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendBookingConfirmation
};