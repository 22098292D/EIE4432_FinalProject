// src/booking.js
import express from 'express';
import { getAllEvents } from './eventdb.js';
import { addTicket, getAllTickets } from './ticketdb.js';
import { updateSelected } from './mapdb.js';
import { updateDiscount } from './userdb.js';
const router = express.Router();

// GET /api/events - Get all events
router.get('/events', async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/movie/:title - Get events by movie title
router.get('/events/movie/:title', async (req, res) => {
  try {
    const events = await getAllEvents();
    const movieEvents = events.filter((event) => event.movieTitle === req.params.title);
    res.json(movieEvents);
  } catch (error) {
    console.error('Error fetching events for movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie events' });
  }
});

// GET /api/events/date/:date - Get events by date
router.get('/events/date/:date', async (req, res) => {
  try {
    const events = await getAllEvents();
    const dateEvents = events.filter((event) => event.showDate === req.params.date);
    res.json(dateEvents);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch date events' });
  }
});

// GET /api/events/movie/:title/date/:date - Get event by movie title and date
router.get('/events/movie/:title/date/:date', async (req, res) => {
  try {
    const events = await getAllEvents();
    const matchingEvents = events.filter(
      (event) => event.movieTitle === req.params.title && event.showDate === req.params.date
    );

    if (matchingEvents.length > 0) {
      res.json(matchingEvents);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error fetching specific event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});
router.get('/events/movie/:title/date/:date/time/:time', async (req, res) => {
  try {
    const events = await getAllEvents();
    const event = events.find(
      (event) =>
        event.movieTitle === req.params.title &&
        event.showDate === req.params.date &&
        event.startTime === req.params.time
    );

    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error fetching specific event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});
router.post('/tickets', async (req, res) => {
  try {
    const ticketData = req.body;

    // Split the time string if it contains both start and end time
    // Otherwise construct the time string from startTime and endTime
    let timeString;
    if (ticketData.startTime && ticketData.endTime) {
      timeString = `${ticketData.startTime} - ${ticketData.endTime}`;
    } else {
      // Check if time is already in correct format
      if (!ticketData.time.includes(' - ')) {
        return res.status(400).json({
          error: 'Invalid time format',
          receivedData: ticketData,
        });
      }
      timeString = ticketData.time;
    }

    // Construct the final ticket data
    const finalTicketData = {
      userId: ticketData.userId,
      movieTitle: ticketData.movieTitle,
      ticketClass: ticketData.ticketClass,
      date: ticketData.date,
      time: timeString,
      venue: ticketData.venue,
      seat: ticketData.seat,
      price: ticketData.price,
      bookingTime: ticketData.bookingTime,
    };

    // Validate required fields
    if (
      !finalTicketData.userId ||
      !finalTicketData.movieTitle ||
      !finalTicketData.ticketClass ||
      !finalTicketData.date ||
      !finalTicketData.time ||
      !finalTicketData.venue ||
      !finalTicketData.seat ||
      !finalTicketData.price ||
      !finalTicketData.bookingTime
    ) {
      return res.status(400).json({
        error: 'Missing required ticket information',
        receivedData: finalTicketData,
      });
    }

    // Add ticket to database
    const result = await addTicket(finalTicketData);

    if (result.acknowledged) {
      res.status(201).json({
        message: 'Ticket saved successfully',
        ticketId: result.insertedId,
      });
    } else {
      throw new Error('Failed to save ticket');
    }

    // Add ticket to database
    const mapID = parseInt(ticketData.mapID);
    await updateSelected(mapID, ticketData.seat, ticketData.userId);
  } catch (error) {
    console.error('Error saving ticket:', error);
    res.status(500).json({
      error: 'Failed to save ticket',
      details: error.message,
    });
  }
});
router.get('/tickets/latest', async (req, res) => {
  try {
    const tickets = await getAllTickets();
    // Get the most recent ticket (first one since we sort by _id in descending order)
    const latestTicket = tickets[0];
    if (!latestTicket) {
      return res.status(404).json({ error: 'No tickets found' });
    }
    res.json(latestTicket);
  } catch (error) {
    console.error('Error fetching latest ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users/discount', async (req, res) => {
  try {
    const { userID, discountType } = req.body;
    console.log(userID, discountType, true); //
    if (discountType === '0') {
      const discountType = 'free';
      await updateDiscount(userID, discountType, true);
    } else {
      await updateDiscount(userID, discountType, true);
    }

    // if (updateSuccess) {
    //   res.status(200).json({ message: 'Discount updated successfully' });
    // } else {
    //   res.status(500).json({ error: 'Failed to update discount' });
    // }
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
