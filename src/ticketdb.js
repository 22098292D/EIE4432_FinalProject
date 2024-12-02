import fs from 'fs/promises';
import client from './dbclient.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function init_db() {
  try {
    const tickets = client.db('CinemaWeb').collection('tickets');

    const count = await tickets.countDocuments();

    if (count === 0) {
      const filePath = join(__dirname, '..', 'tickets.json');
      const data = await fs.readFile(filePath, 'utf8');
      const ticketsList = JSON.parse(data);

      const result = await tickets.insertMany(ticketsList);
      console.log(`Added ${result.insertedCount} tickets`);
    } else {
      console.log('Tickets collection is already populated');
    }
    const updateData = {
      userId: 'Zerox',
      movieTitle: 'Oppenheimer',
      ticketClass: 'Second Class',
      date: '2024-10-31',
      time: '19:30 - 21:30',
      venue: 'Hall A',
      seat: 'C4',
      price: 100.0,
      bookingTime: '2023-12-26T10:30:00Z',
    };
    //addTicket(updateData).then((res) => console.log(res));
    //getTicketsById('Zerox').then((res) => console.log(res));
  } catch (err) {
    console.error('Unable to initialize the database!');
    console.error(err);
  }
}

init_db().catch(console.dir);

export const ticketsDB = client.db('CinemaWeb').collection('tickets');

export async function addTicket(ticket) {
  try {
    const result = await ticketsDB.insertOne(ticket);
    return result;
  } catch (err) {
    console.error('Error adding ticket:', err);
    throw err;
  }
}

export async function getAllTickets() {
  try {
    const tickets = await ticketsDB.find({}).sort({ _id: -1 }).toArray();
    return tickets;
  } catch (err) {
    console.error('Error getting tickets:', err);
    throw err;
  }
}

export async function getTicketsById(userId) {
  try {
    // Input validation
    if (!userId) {
      throw new Error('userId is required');
    }

    // Query tickets collection/table
    const tickets = await ticketsDB.find({ userId: userId }).sort({ _id: -1 }).toArray();

    return tickets;
  } catch (err) {
    console.error('Error getting tickets:', err);
    throw err;
  }
}
