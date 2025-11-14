import express from 'express';
import dotenv from 'dotenv';
import { bookingService } from './services/booking.service.js';
import { Booking } from './models/booking.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Booking endpoints
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    const requiredFields = ['customerName', 'customerEmail', 'customerPhone', 'serviceId', 'barberId', 'scheduledTime'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Convert scheduledTime to Date
    bookingData.scheduledTime = new Date(bookingData.scheduledTime);
    
    // Set default values
    bookingData.customerId = bookingData.customerId || bookingData.customerEmail;
    bookingData.status = bookingData.status || 'confirmed';

    const booking = await bookingService.createBooking(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert scheduledTime to Date if present
    if (updates.scheduledTime) {
      updates.scheduledTime = new Date(updates.scheduledTime);
    }

    const booking = await bookingService.updateBooking(id, updates);
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await bookingService.cancelBooking(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

app.get('/api/bookings/:id/reminders', async (req, res) => {
  try {
    const { id } = req.params;
    const reminders = await bookingService.getBookingReminderStatus(id);
    res.json(reminders);
  } catch (error) {
    console.error('Error getting reminder status:', error);
    res.status(500).json({ error: 'Failed to get reminder status' });
  }
});

app.get('/api/queue/stats', async (req, res) => {
  try {
    const stats = await bookingService.getQueueStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
