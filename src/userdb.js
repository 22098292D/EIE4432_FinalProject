import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import client from './dbclient.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = client.db('CinemaWeb').collection('users');

async function init_db() {
  try {
    console.log(getCurrentTime());

    const count = await users.countDocuments();

    if (count === 0) {
      const data = await fs.readFile(path.join(__dirname, '../users.json'), 'utf8');

      const userArray = JSON.parse(data);

      const result = await users.insertMany(userArray);

      console.log(`Added ${result.insertedCount} users`);
    }
    //findAllUsers().then((res) => console.log(res));
    // updateDiscount('22096749d', '10', true);
  } catch (err) {
    console.error('Unable to initialize the database!');
    console.error('Error details:', err);
    process.exit(1);
  }
}
function getCurrentTime() {
  const now = new Date();

  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

async function validate_user(userID, password) {
  if (!userID || !password) {
    return false;
  }

  try {
    const user = await users.findOne({
      userID: userID,
    });

    if (!user) return false;

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    return isMatch ? user : null;
  } catch (err) {
    console.error('Unable to fetch from database!');
    return false;
  }
}

async function findAllUsers() {
  try {
    const user = await users.find({}).toArray();
    return user;
  } catch (err) {
    console.error('Unable to fetch from database!' + err.message);
    return false;
  }
}
async function update_user(userID, password, additionalFields = {}) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10
    const result = await users.updateOne(
      { userID },
      {
        $set: {
          userID,
          hashedPassword,
          ...additionalFields,
        },
      },
      { upsert: true }
    );

    return result.upsertedCount === 1 || result.modifiedCount === 1;
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function update_user2(userID, additionalFields = {}) {
  try {
    const result = await users.updateOne(
      { userID },
      {
        $set: {
          userID,
          ...additionalFields,
        },
      },
      { upsert: true }
    );

    return result.upsertedCount === 1 || result.modifiedCount === 1;
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function fetch_user(userID) {
  try {
    return await users.findOne({ userID: userID });
  } catch (err) {
    console.error('Unable to fetch from database!');
    return null;
  }
}
async function userID_exist(userID) {
  try {
    const user = await fetch_user(userID);
    return user !== null;
  } catch (err) {
    console.error('Unable to fetch from database!');
    return false;
  }
}
async function updateDiscount(userID, discountType, condition) {
  try {
    // 首先检查用户是否存在以及当前折扣值
    const currentUser = await users.findOne({ userID: userID });
    if (!currentUser) {
      console.warn(`User ${userID} not found.`);
      return false;
    }

    // 检查是否需要更新
    const currentValue = currentUser.discount?.[discountType] || 0;
    const newValue = currentValue + (condition ? 1 : -1);

    if (currentValue === newValue) {
      console.log(`No update needed for user ${userID}, value already at ${currentValue}`);
      return true;
    }

    const updateResult = await users.updateOne(
      { userID: userID },
      {
        $inc: {
          [`discount.${discountType}`]: condition ? 1 : -1,
        },
      }
    );

    console.log(`Update result for ${userID}:`, updateResult);
    return updateResult.modifiedCount === 1;
  } catch (err) {
    console.error(`Error updating discount for user ${userID}:`, err);
    return false;
  }
}
init_db().catch(console.dir);

export {
  users as default,
  validate_user,
  update_user,
  fetch_user,
  userID_exist,
  update_user2,
  findAllUsers,
  updateDiscount,
};
