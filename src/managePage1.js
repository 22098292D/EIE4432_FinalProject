import express from 'express';
import multer from 'multer';
import { addEvent, updateEvent, deleteEvent, getAllEvents, getMaxId } from './eventdb.js';
import { getMap, newMap, searchID, updateExist, updateLuxury } from './mapdb.js'; // Assuming mapdb.js contains these functions
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..'); // 返回上一级到根目录
const uploadDir = path.join(rootDir, 'static', 'img'); // Set upload directory to static/img

// 创建上传目录（如果不存在）
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'movie-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// 配置multer上传
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});
const route = express.Router();
const form = multer();

route.use(express.json());
route.use(express.urlencoded({ extended: true }));
// 添加到其他路由旁边
route.get('/', async (req, res) => {
  try {
    const events = await getAllEvents();
    console.log('Fetched events:', events); // 添加调试日志
    res.render('managePage1', {
      events: events || [], // 确保即使没有数据也传递空数组
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

route.get('/managePage1.html', async (req, res) => {
  try {
    const events = await getAllEvents();
    console.log('Fetched events for /managePage1.html:', events); // 调试日志
    res.render('managePage1', {
      events: events || [], // 确保即使没有数据也传递空数组
    });
  } catch (error) {
    console.error('Error fetching events for /managePage1.html:', error);
    res.status(500).send('Error fetching events');
  }
});

route.post('/auth/upload', (req, res) => {
  // 打印上传目录路径用于调试
  console.log('Upload directory:', uploadDir);

  upload.single('image')(req, res, (err) => {
    res.setHeader('Content-Type', 'application/json');

    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          status: 'error',
          message: 'File upload error: ' + err.message,
        });
      } else {
        return res.status(500).json({
          status: 'error',
          message: err.message,
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    try {
      // 返回图片路径，这里使用相对于根目录的路径
      const filePath = `img/${req.file.filename}`;
      return res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        path: filePath,
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: filePath,
        },
      });
    } catch (error) {
      console.error('Response error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error processing upload response',
        error: error.message,
      });
    }
  });
});
// 添加新电影场次
route.post('/auth/add', form.none(), async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }

  try {
    console.log('Received add event request body:', req.body);

    const eventData = {
      _id: parseInt(req.body.index),
      movieTitle: req.body.movieTitle || 'Untitled Movie',
      director: req.body.director || 'Unknown Director',
      venue: req.body.venue || 'A', // 默认使用 A 场馆
      description: req.body.description || 'No description available.',
      firstClassPrice: parseInt(req.body.firstClassPrice) || 100, // 默认价格 100
      secondClassPrice: parseInt(req.body.secondClassPrice) || 80, // 默认价格 80
      showDate: req.body.showDate || new Date().toISOString().split('T')[0], // 默认今天
      startTime: req.body.startTime || '00:00', // 默认晚上7点
      endTime: req.body.endTime || '00:00', // 默认晚上9点
      imageUrl: 'img/default-poster.jpg',
    };

    const result = await addEvent(eventData);
    return res.json({
      status: 'success',
      message: 'Event added successfully',
      data: result,
    });
  } catch (error) {
    console.error('Add event processing error:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Server error',
      error: error.message,
    });
  }
});

// 更新电影场次
route.post('/auth/eventupdate', form.none(), async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }

  try {
    console.log('Received update request body:', req.body);

    // 确保 index 是单个值而不是数组
    const movieId = Array.isArray(req.body.index) ? req.body.index[0] : req.body.index;

    const updateData = {
      movieTitle: req.body.movieTitle,
      director: req.body.director || '',
      venue: req.body.venue,
      description: req.body.description,
      firstClassPrice: parseInt(req.body.firstClassPrice),
      secondClassPrice: parseInt(req.body.secondClassPrice),
      showDate: req.body.showDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      imageUrl: req.body.imageUrl,
    };

    console.log('Processing update for movie ID:', movieId);
    console.log('Update data:', updateData);

    // 验证必填字段
    const requiredFields = [
      'movieTitle',
      'venue',
      'description',
      'firstClassPrice',
      'secondClassPrice',
      'showDate',
      'startTime',
      'endTime',
    ];

    const missingFields = requiredFields.filter((field) => !updateData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'failed',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const result = await updateEvent(parseInt(movieId), updateData);
    return res.json({
      status: 'success',
      message: 'Event updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Update event processing error:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Server error',
      error: error.message,
    });
  }
});
route.get('/events/maxId', async (req, res) => {
  try {
    const maxId = await getMaxId();
    res.json({ maxId: maxId });
  } catch (error) {
    console.error('Error getting max ID:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Error getting max ID',
    });
  }
});
// 删除电影场次

route.post('/auth/delete', form.none(), async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }

  try {
    console.log('Delete request body:', req.body); // 调试日志

    const movieId = parseInt(req.body.index);
    if (isNaN(movieId)) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid movie ID',
      });
    }

    const result = await deleteEvent(movieId);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'Movie not found',
      });
    }

    return res.json({
      status: 'success',
      message: 'Movie deleted successfully',
    });
  } catch (error) {
    console.error('Delete event processing error:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Server error',
      error: error.message,
    });
  }
});

// 获取所有电影场次
route.get('/events', async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }

  try {
    const events = await getAllEvents();
    return res.json({
      status: 'success',
      data: events,
    });
  } catch (error) {
    console.error('Fetch events error:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Server error',
      error: error.message,
    });
  }
});

// Add a route to handle managing the seat map
route.get('/manageMap/:id', async (req, res) => {
  const eventId = parseInt(req.params.id); // 从URL中获取event ID
  try {
    const mapData = await getMap(eventId); // 查询maps数据库是否有该mapID的数据

    if (mapData) {
      console.log(`Loaded existing map data for mapID ${eventId}`);
      res.render('manageMap', {
        mapID: eventId,
        mapInfo: mapData.mapInfo,
        message: `Map data loaded for mapID ${eventId}`,
      });
    } else {
      console.log(`No map found for mapID ${eventId}, creating a new map.`);
      const newMapSuccess = await newMap(eventId); // 使用 newMap 函数创建新地图
      if (newMapSuccess) {
        const newMapData = await getMap(eventId); // 再次获取新建的地图数据
        res.render('manageMap', {
          mapID: eventId,
          mapInfo: newMapData.mapInfo,
          message: `New map created for mapID ${eventId}`,
        });
      } else {
        res.status(500).send('Error creating new map');
      }
    }
  } catch (error) {
    console.error('Error managing map:', error);
    res.status(500).send('Error managing map');
  }
});

route.post('/updateSeat', async (req, res) => {
  const { mapID, seatID, exist } = req.body;

  try {
    // 更新数据库中的座位状态
    const result = await updateExist(mapID, seatID, exist);
    if (result) {
      return res.json({ status: 'success', message: 'Seat status updated successfully' });
    } else {
      return res.status(500).json({ status: 'failed', message: 'Failed to update seat status' });
    }
  } catch (error) {
    console.error('Error updating seat:', error);
    res.status(500).json({ status: 'failed', message: 'Server error' });
  }
});

route.post('/updateluxury', async (req, res) => {
  const { mapID, seatID, luxury } = req.body;
  // console.log('Current mapID:', mapID);
  // console.log('Current seatID:', seatID);
  // console.log('Current ', luxury);

  const mapid = parseInt(mapID, 10);
  console.log('Current mapID:', mapID);
  console.log('Current seatID:', seatID);
  console.log('Current ', luxury);

  try {
    // 更新座位的 luxury 属性
    const updateResult = await updateLuxury(mapid, seatID, luxury);

    if (updateResult) {
      res.json({ status: 'success', message: 'Luxury attribute updated successfully.' });
    } else {
      return res.status(500).json({ status: 'success', message: 'Success to update luxury seat status' });
    }
  } catch (error) {
    console.error('Error updating luxury attribute:', error);
    res.status(500).json({ status: 'failed', message: 'Server error.' });
  }
});

route.get('/UserMap/:id', async (req, res) => {
  const eventId = parseInt(req.params.id); // 从URL中获取event ID
  try {
    const mapData = await getMap(eventId); // 查询maps数据库是否有该mapID的数据

    if (mapData) {
      console.log(`Loaded existing map data for mapID ${eventId}`);
      res.render('UserMap', {
        mapID: eventId,
        mapInfo: mapData.mapInfo,
        message: `Map data loaded for mapID ${eventId}`,
      });
    }
  } catch (error) {
    console.error('Error managing map:', error);
    res.status(500).send('Error managing map');
  }
});

export default route;
