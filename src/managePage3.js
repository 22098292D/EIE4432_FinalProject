import express from 'express';
import users from './userdb.js';
import { validate_user, update_user, fetch_user, userID_exist, update_user2 } from './userdb.js';
const router = express.Router();

// Get all users except admin
router.get('/users', async (req, res) => {
  try {
    const allUsers = await users
      .find(
        { userID: { $ne: 'admin' } }, // Exclude admin user
        {
          projection: {
            userID: 1,
            nickname: 1,
            email: 1,
            gender: 1,
            birthdate: 1,
            _id: 0,
          },
        }
      )
      .toArray();

    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (except admin)
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await users.findOne(
      {
        $and: [{ userID: req.params.userId }, { userID: { $ne: 'admin' } }],
      },
      {
        projection: {
          userID: 1,
          discount: 1,
          nickname: 1,
          email: 1,
          gender: 1,
          birthdate: 1,
          _id: 0,
        },
      }
    );

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/api/users/:userID/use-discount', async (req, res) => {
  try {
    const { discountType } = req.body;
    const user = await fetch_user(req.params.userID);

    if (!user || !user.discount || user.discount[discountType] <= 0) {
      return res.status(400).json({ error: 'Invalid or no remaining discount' });
    }

    // Update discount count
    user.discount[discountType] -= 1;
    await update_user2(req.params.userID, { discount: user.discount });

    res.json({ success: true, remainingDiscount: user.discount[discountType] });
  } catch (error) {
    console.error('Error using discount:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
export default router;
