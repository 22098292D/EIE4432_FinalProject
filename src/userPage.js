import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTicketsById } from './ticketdb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.get('/userPage', (req, res) => {
  if (!req.session.logged) {
    return res.redirect('/homePage.html');
  }
  res.sendFile(path.join(__dirname, '../static/userPage.html'));
});

export default router;
