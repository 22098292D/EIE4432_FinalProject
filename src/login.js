import express from 'express';
import multer from 'multer';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { validate_user, update_user, fetch_user, userID_exist, update_user2 } from './userdb.js';
import { getTicketsById } from './ticketdb.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const route = express.Router();

const form = multer();

route.use(express.json());
route.use(express.urlencoded({ extended: true }));

route.post('/login', async (req, res) => {
  const { userID, password } = req.body;
  if (!userID || !password) {
    return res.status(400).json({ status: 'failed', message: 'Username and password are required' });
  }

  const user = await validate_user(userID, password);
  if (!user) {
    return res.status(401).json({ status: 'failed', message: 'Invalid username or password' });
  }

  req.session.logged = true;
  req.session.username = user.userID;
  req.session.user = {
    userID: user.userID,
  };
  res.json({
    status: 'success',
    user: { userID: user.userID },
  });
});
// 添加新的路由用于获取预订历史
route.get('/bookings', async (req, res) => {
  console.log('Bookings route hit, session:', req.session); // 调试日志
  try {
    if (!req.session.logged || !req.session.username) {
      return res.json({
        status: 'error',
        message: 'User not authenticated',
      });
    }

    const userId = req.session.username;
    console.log('Fetching bookings for user:', userId); // 调试日志

    const bookings = await getTicketsById(userId);
    console.log('Retrieved bookings:', bookings); // 调试日志

    // 确保设置正确的 Content-Type
    res.setHeader('Content-Type', 'application/json');
    res.json({
      status: 'success',
      bookings: bookings,
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      status: 'error',
      message: 'Failed to fetch booking history',
    });
  }
});
route.get('/bookings/:userId', async (req, res) => {
  console.log('Bookings route hit, session:', req.session);

  try {
    if (!req.session.logged || !req.session.username) {
      return res.json({
        status: 'error',
        message: 'User not authenticated',
      });
    }

    const userId = req.params.userId;
    console.log('Fetching bookings for user:', userId); // 调试日志

    const bookings = await getTicketsById(userId);
    console.log('Retrieved bookings:', bookings); // 调试日志

    // 确保设置正确的 Content-Type
    res.setHeader('Content-Type', 'application/json');
    res.json({
      status: 'success',
      bookings: bookings,
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      status: 'error',
      message: 'Failed to fetch booking history',
    });
  }
});
route.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await fetch_user(userId);

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    res.json({
      status: 'success',
      user: {
        userID: user.userID,
        nickname: user.nickname,
        email: user.email,
        gender: user.gender,
        birthdate: user.birthdate,
        avatar: user.avatar,
        discount: user.discount,
      },
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Internal server error',
    });
  }
});
route.post('/register', async (req, res) => {
  const { avatar, userID, password, nickname, email, gender, birthdate } = req.body;
  if (!userID || !password) {
    return res.status(400).json({ status: 'failed', message: 'UserID and password are required' });
  }

  if (userID.length < 3) {
    return res.status(400).json({
      status: 'failed',
      message: 'Username must be at least 3 characters',
    });
  }

  const exists = await userID_exist(userID);

  if (exists) {
    return res.status(400).json({
      status: 'failed',
      message: `userID ${userID} already exists`,
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must be at least 8 characters',
    });
  }

  const success = await update_user(userID, password, {
    avatar,
    nickname,
    email,
    gender,
    birthdate,
    discount: {
      10: 0,
      20: 0,
      50: 0,
      free: 0,
    },
  });
  if (success) {
    res.json({ status: 'success', message: 'User registered successfully' });
  } else {
    res.status(500).json({ status: 'failed', message: 'Failed to register user' });
  }
});

route.get('/me', async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }

  try {
    const user = await fetch_user(req.session.username); // 从数据库中获取用户信息
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    return res.json({
      status: 'success',
      user: {
        userID: user.userID,
        password: user.password,
        nickname: user.nickname,
        email: user.email,
        gender: user.gender,
        birthdate: user.birthdate,
        avatar: user.avatar,
        discount: user.discount, // 包含优惠券信息
      },
    });
  } catch (error) {
    console.error('User information retrieval error:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Internal server error',
    });
  }
});

route.post('/logout', (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }

  // 清除会话
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        status: 'failed',
        message: 'Logout failed',
      });
    }

    // 设置响应头清除客户端 cookie
    res.clearCookie('connect.sid');

    return res.json({
      status: 'success',
      message: 'Logged out successfully',
      action: 'clearLocalStorage',
    });
  });
});

route.post('/update', async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({ status: 'failed', message: 'Unauthorized' });
  }

  const { userID, password, nickname, email, gender, birthdate } = req.body;

  try {
    const success = await update_user(userID, password, {
      nickname,
      email,
      gender,
      birthdate,
    });

    if (success) {
      return res.json({ status: 'success', message: 'User information updated successfully' });
    } else {
      return res.status(500).json({ status: 'failed', message: 'Failed to update user information' });
    }
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ status: 'failed', message: 'Internal server error' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'static/img'); // 存储到根目录下的 static/img 文件夹
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.session.username}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

route.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  if (!req.session.logged) {
    return res.status(401).json({ status: 'failed', message: 'Unauthorized' });
  }

  try {
    const filePath = `/static/img/${req.file.filename}`; // 更新头像路径
    const success = await update_user2(req.session.username, { avatar: filePath });
    if (success) {
      res.json({ status: 'success', avatar: filePath });
    } else {
      res.status(500).json({ status: 'failed', message: 'Failed to update avatar' });
    }
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ status: 'failed', message: 'Internal server error' });
  }
});

export default route;
