import twilio from 'twilio';
import { pool } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp service initialized');
} else {
    console.warn('⚠️  Twilio credentials not found. WhatsApp notifications will be logged only.');
}

const formatPhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    return `whatsapp:+${cleaned}`;
};

const createNotification = async (userId, type, title, message, link = null) => {
    try {
        await pool.execute(
            `INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)`,
            [userId, type, title, message, link]
        );
        console.log(`✅ Notification created for user ${userId}`);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

const sendWhatsAppMessage = async (toPhone, message) => {
    try {
        if (!client) {
            console.log('📱 [MOCK] WhatsApp to', toPhone, ':', message);
            return { success: true, mock: true, sid: 'MOCK_' + Date.now() };
        }

        const formattedNumber = formatPhoneNumber(toPhone);
        const twilioMessage = await client.messages.create({
            from: twilioWhatsAppNumber,
            to: formattedNumber,
            body: message
        });

        console.log(`✅ WhatsApp sent: ${twilioMessage.sid}`);
        return { success: true, sid: twilioMessage.sid, status: twilioMessage.status };
    } catch (error) {
        console.error('❌ WhatsApp send error:', error.message);
        return { success: false, error: error.message };
    }
};

export const sendBookingConfirmation = async (booking, userPhone) => {
    try {
        const message = `
🎉 *Booking Confirmed!*

Dear ${booking.name},

Your booking has been confirmed!

📍 Destination: ${booking.tour_destination}
📅 Tour Date: ${new Date(booking.tour_date).toLocaleDateString()}
👥 Travelers: ${booking.adults} Adults, ${booking.children || 0} Children
💰 Amount: ₹${booking.amount}

🔗 Booking ID: #${booking.id}
📧 Transaction ID: ${booking.transaction_id}

View details: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/userdashboard

Thank you for choosing Dream Tours! 🌍✨
        `.trim();

        const result = await sendWhatsAppMessage(userPhone, message);

        if (booking.user_id) {
            await createNotification(
                booking.user_id,
                'booking_confirmation',
                'Booking Confirmed!',
                `Your booking for ${booking.tour_destination} has been confirmed.`,
                '/userdashboard?tab=bookings'
            );

            if (result.success) {
                await pool.execute(
                    `UPDATE notifications SET whatsapp_sent = TRUE, whatsapp_sent_at = NOW() 
                     WHERE user_id = ? AND type = 'booking_confirmation' 
                     ORDER BY created_at DESC LIMIT 1`,
                    [booking.user_id]
                );
            }
        }

        return result;
    } catch (error) {
        console.error('Booking confirmation error:', error);
        return { success: false, error: error.message };
    }
};

export const sendPaymentStatus = async (booking, userPhone, status = 'success') => {
    try {
        let message;

        if (status === 'success') {
            message = `
✅ *Payment Successful!*

Dear ${booking.name},

Your payment has been processed successfully!

💳 Amount Paid: ₹${booking.amount}
📧 Transaction ID: ${booking.transaction_id}
🔗 Booking ID: #${booking.id}

Your booking for ${booking.tour_destination} is now confirmed.

View receipt: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/userdashboard

Thank you! 🎉
            `.trim();
        } else {
            message = `
❌ *Payment Failed*

Dear ${booking.name},

We encountered an issue processing your payment for ${booking.tour_destination}.

🔗 Booking ID: #${booking.id}
💰 Amount: ₹${booking.amount}

Please try again or contact support.
            `.trim();
        }

        const result = await sendWhatsAppMessage(userPhone, message);

        if (booking.user_id) {
            await createNotification(
                booking.user_id,
                'payment_status',
                status === 'success' ? 'Payment Successful' : 'Payment Failed',
                status === 'success' 
                    ? `Your payment of ₹${booking.amount} has been processed successfully.`
                    : `Payment failed for your booking. Please try again.`,
                '/userdashboard?tab=bookings'
            );
        }

        return result;
    } catch (error) {
        console.error('Payment status error:', error);
        return { success: false, error: error.message };
    }
};

export const sendPromotionalOffer = async (userId, userName, userPhone, offerDetails) => {
    try {
        const message = `
🎁 *Special Offer Just for You!*

Hi ${userName}! 👋

${offerDetails.message || 'We have an exciting offer for you!'}

${offerDetails.discount ? `💰 Get ${offerDetails.discount}% OFF on your next booking!` : ''}
${offerDetails.code ? `🎟️ Use Code: *${offerDetails.code}*` : ''}
${offerDetails.validUntil ? `⏰ Valid until: ${new Date(offerDetails.validUntil).toLocaleDateString()}` : ''}

Book now: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/destinations

Don't miss out! 🌴✨
        `.trim();

        const result = await sendWhatsAppMessage(userPhone, message);

        await createNotification(
            userId,
            'promotional',
            offerDetails.title || 'Special Offer!',
            offerDetails.message || 'Check out our latest promotional offer!',
            '/destinations'
        );

        return result;
    } catch (error) {
        console.error('Promotional offer error:', error);
        return { success: false, error: error.message };
    }
};

export const sendTripReminder = async (booking, userPhone, daysUntilTrip) => {
    try {
        const message = `
⏰ *Trip Reminder!*

Hi ${booking.name}! 👋

Your trip to *${booking.tour_destination}* is coming up in ${daysUntilTrip} days!

📅 Departure Date: ${new Date(booking.tour_date).toLocaleDateString()}
🧳 Pack your bags and get ready for an amazing adventure!

View booking details: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/userdashboard

Safe travels! 🌍✈️
        `.trim();

        const result = await sendWhatsAppMessage(userPhone, message);

        if (booking.user_id) {
            await createNotification(
                booking.user_id,
                'reminder',
                'Trip Reminder!',
                `Your trip to ${booking.tour_destination} is in ${daysUntilTrip} days!`,
                '/userdashboard?tab=bookings'
            );
        }

        return result;
    } catch (error) {
        console.error('Trip reminder error:', error);
        return { success: false, error: error.message };
    }
};

export const sendReviewRequest = async (booking, userPhone) => {
    try {
        const message = `
⭐ *How was your trip?*

Hi ${booking.name}! 👋

We hope you had an amazing experience in *${booking.tour_destination}*! 🌴

We'd love to hear about your journey. Please take a moment to share your review.

📝 Write a review: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/userdashboard?tab=reviews

Thank you for traveling with Dream Tours! 🎉
        `.trim();

        const result = await sendWhatsAppMessage(userPhone, message);

        if (booking.user_id) {
            await createNotification(
                booking.user_id,
                'reminder',
                'Share Your Experience',
                `How was your trip to ${booking.tour_destination}? Write a review!`,
                '/userdashboard?tab=reviews'
            );
        }

        return result;
    } catch (error) {
        console.error('Review request error:', error);
        return { success: false, error: error.message };
    }
};