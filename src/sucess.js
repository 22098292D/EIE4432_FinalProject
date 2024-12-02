import express from 'express';
import { getAllEvents } from './eventdb.js';
import { addTicket } from './ticketdb.js';
import { updateSelected } from './mapdb.js';
const router = express.Router();
