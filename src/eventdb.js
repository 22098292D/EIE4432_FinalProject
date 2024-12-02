import fs from 'fs/promises';
import client from './dbclient.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function init_db() {
  try {
    // Create a reference to the events collection
    const events = client.db('CinemaWeb').collection('events');

    // Check if the collection is empty
    const count = await events.countDocuments();

    if (count === 0) {
      // Read the local events database file
      const filePath = join(__dirname, '..', 'events.json');
      const data = await fs.readFile(filePath, 'utf8');
      const eventsList = JSON.parse(data);

      // Insert all events into the collection
      const result = await events.insertMany(eventsList);

      console.log(`Added ${result.insertedCount} events`);
    } else {
      console.log('Events collection is already populated');
    }
    // Test command here
    const updateData = {
      Mapid: 4,
      movieTitle: 'The Avengers: Kang Dynasty',
      director: 'Destin Daniel Cretton',
      venue: 'Venue A',
      description:
        "Earth's mightiest heroes face their greatest challenge yet as they confront Kang the Conqueror, a time-traveling entity threatening the very fabric of the multiverse.",
      firstClassPrice: 120,
      secondClassPrice: 90,
      showDate: '2024/12/25',
      startTime: '12:00',
      endTime: '14:30',
    };
  } catch (err) {
    console.error('Unable to initialize the database!');
    console.error(err);
  } finally {
    // Close the client connection
    //await client.close();
  }
}

// Run the initialization function
init_db().catch(console.dir);

// Export the database reference for use in other files
export const eventsDB = client.db('CinemaWeb').collection('events');

// CRUD Operations

// Create - Add a new event
export async function addEvent(event) {
  try {
    const result = await eventsDB.insertOne(event);
    return result;
  } catch (err) {
    console.error('Error adding event:', err);
    throw err;
  }
}

// Read - Get all events
export async function getAllEvents() {
  try {
    const events = await eventsDB.find({}).toArray();
    return events;
  } catch (err) {
    console.error('Error getting events:', err);
    throw err;
  }
}

// Read - Get event by ID
export async function getEventById(Id) {
  try {
    const event = await eventsDB.findOne({ _id: Id });
    return event;
  } catch (err) {
    console.error('Error getting event:', err);
    throw err;
  }
}

// Update - Update an event
export async function updateEvent(Id, updateData) {
  try {
    const result = await eventsDB.updateOne({ _id: Id }, { $set: updateData });
    return result;
  } catch (err) {
    console.error('Error updating event:', err);
    throw err;
  }
}

// Delete - Delete an event
export async function deleteEvent(Id) {
  try {
    const result = await eventsDB.deleteOne({ _id: Id });
    return result;
  } catch (err) {
    console.error('Error deleting event:', err);
    throw err;
  }
}
export async function getMaxId() {
  try {
    const result = await eventsDB.find().sort({ _id: -1 }).limit(1).toArray();
    return result.length > 0 ? result[0]._id : 0;
  } catch (err) {
    console.error('Error getting max ID:', err);
    throw err;
  }
}
