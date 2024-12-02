import dotenv from 'dotenv';

// Configure dotenv to load environment variables from .env file
dotenv.config();

// Check if CONNECTION_STR is defined
if (!process.env.CONNECTION_STR) {
  console.error('CONNECTION_STR is not defined');
  process.exit(1);
}

// Export configuration object
export default {
  CONNECTION_STR: process.env.CONNECTION_STR,
};
