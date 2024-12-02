import fs from 'fs/promises';
import client from './dbclient.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const maps = client.db('CinemaWeb').collection('maps');

async function init_db() {
  try {
    const maps = client.db('CinemaWeb').collection('maps');

    const count = await maps.countDocuments();

    if (count === 0) {
      const filePath = join(__dirname, '..', 'maps.json');
      const data = await fs.readFile(filePath, 'utf8');
      const mapsList = JSON.parse(data);

      const result = await maps.insertMany(mapsList);

      console.log(`Added ${result.insertedCount} maps`);
    } else {
      console.log('Maps collection is already populated');
    }
  } catch (err) {
    console.error('Unable to initialize the database!');
    console.error(err);
  } finally {
    //test
  }
}

// 获取座位信息的函数
async function getMap(mapID) {
  try {
    return await maps.findOne({ mapID: mapID });
  } catch (err) {
    console.error('Unable to fetch from database!');
    return null;
  }
}

async function newMap(mapID) {
  try {
    // 查询 mapID 为 0 的文档，作为新文档的模板
    const templateMap = await maps.findOne({ mapID: 0 });

    if (!templateMap) {
      console.error('Template map with mapID 0 not found!');
      return false;
    }

    // 创建新文档，复制 mapInfo 并设置新的 mapID
    const newMapData = {
      mapID: mapID, // 新的 mapID
      mapInfo: templateMap.mapInfo, // 复制模板文档的 mapInfo
    };

    // 插入新文档到集合中
    const result = await maps.insertOne(newMapData);

    if (result.acknowledged) {
      console.log(`New map with mapID ${mapID} added successfully.`);
      return true;
    } else {
      console.error('Failed to add the new map!');
      return false;
    }
  } catch (err) {
    console.error('Unable to add the new map!', err);
    return false;
  }
}

// 更新座位任意信息的函数
async function updateSeat0(mapID, seatID, updatedFields) {
  try {
    const updateDoc = {};
    for (const [key, value] of Object.entries(updatedFields)) {
      updateDoc[`mapInfo.${seatID}.${key}`] = value;
    }
    const result = await maps.updateOne({ mapID: mapID }, { $set: updateDoc });

    return result.upsertedCount === 1 || result.modifiedCount === 1;
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function updateExist(mapID, seatID, exist) {
  try {
    updateSeat0(mapID, seatID, { exist: exist });
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function updateSelected(mapID, seatID, userID) {
  try {
    updateSeat0(mapID, seatID, { selected: true, userID: userID });
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function updateLuxury(mapID, seatID, L) {
  try {
    updateSeat0(mapID, seatID, { luxury: L });
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function searchID(mapID) {
  try {
    // 查询数据库，查找是否存在指定 mapID 的文档
    const mapData = await maps.findOne({ mapID: mapID });

    if (mapData) {
      return true;
    } else {
      // 如果未找到，返回 false
      return false;
    }
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

// Function to check the number of remaining selectable seats for a given mapID
async function checkRestSeat(mapID) {
  try {
    // Fetch the map document based on mapID
    const mapData = await maps.findOne({ mapID: mapID });

    if (!mapData) {
      console.error(`Map with ID ${mapID} not found.`);
      return 0;
    }

    // Extract mapInfo and filter seats
    const mapInfo = mapData.mapInfo;
    const remainingSeats = Object.values(mapInfo).filter((seat) => seat.exist === true && seat.selected === false);

    // Return the count of remaining selectable seats
    return remainingSeats.length;
  } catch (err) {
    console.error(`Error checking remaining seats for mapID ${mapID}:`, err);
    return 0;
  }
}

checkRestSeat(1).then((remainingSeats) => {
  console.log(`Remaining selectable seats: ${remainingSeats}`);
});

// getMap(0).then((res) => console.log(res));

// 导出函数
export {
  maps as default,
  getMap,
  updateSeat0,
  updateExist,
  updateSelected,
  updateLuxury,
  newMap,
  searchID,
  checkRestSeat,
};

// Run the initialization function
init_db().catch(console.dir);
