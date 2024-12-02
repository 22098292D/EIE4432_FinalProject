import express from 'express';
import { getAllTickets } from './ticketdb.js';

const router = express.Router();

router.get('/bookingHistory', async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.render('managePage2', { tickets });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).send('Error loading booking history');
  }
});

export default router;
