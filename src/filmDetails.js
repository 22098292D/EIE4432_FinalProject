import express from 'express';
import { getAllEvents } from './eventdb.js';

const route = express.Router();

route.get('/filmDetails', async (req, res) => {
  try {
    const events = await getAllEvents();
    console.log('Fetched events:', events);
    res.render('filmDetails', {
      events: events || [],
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

route.get('/filmDetails.html', async (req, res) => {
  try {
    const events = await getAllEvents();
    console.log('Fetched events for /filmDetails.html:', events);
    res.render('filmDetails', {
      events: events || [],
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

route.get('/search-suggestions', async (req, res) => {
  try {
    const searchTerm = req.query.term.toLowerCase();
    const events = await getAllEvents();

    const suggestions = events.reduce((acc, event) => {
      // Check title matches
      if (event.movieTitle.toLowerCase().includes(searchTerm)) {
        acc.push({
          text: event.movieTitle,
          type: 'title',
        });
      }

      // Check description matches
      if (event.description.toLowerCase().includes(searchTerm)) {
        // Get the relevant snippet from description
        const index = event.description.toLowerCase().indexOf(searchTerm);
        const snippet = event.description.slice(Math.max(0, index - 20), index + searchTerm.length + 20) + '...';
        acc.push({
          text: snippet,
          type: 'description',
        });
      }

      return acc;
    }, []);

    // Limit to top 5 suggestions
    res.json(suggestions.slice(0, 5));
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Error fetching suggestions' });
  }
});
export default route;
