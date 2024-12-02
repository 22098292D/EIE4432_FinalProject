import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import login from './login.js';
import movieRoute from './managePage1.js';
import filmDetailsRoute from './filmDetails.js';
import bookingRouter from './managePage2.js';
import UserInfoRouter from './userPage.js';
import bookingRoutes from './booking.js';
import userRouter from './managePage3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'group_project',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);
const authMiddleware = (req, res, next) => {
  const protectedRoutes = ['/managePage1', '/managePage1.html', '/bookingHistory', '/userPage'];

  if (protectedRoutes.some((route) => req.path.startsWith(route))) {
    if (!req.session.logged) {
      return res.redirect('/homePage.html');
    }
  }
  next();
};
app.get('/', (req, res) => {
  if (req.session.logged) {
    res.redirect('/userPage');
  } else {
    res.redirect('/homePage.html');
  }
});

app.use(authMiddleware);

app.use('/api', userRouter);
app.use('/api', bookingRoutes);

app.use('/auth', login);
app.use('/', bookingRouter);
app.use('/', UserInfoRouter);
app.use('/', movieRoute);
app.use('/', filmDetailsRoute);

app.use(express.static(path.join(__dirname, '../static')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../views')));

app.get('/managePage2.html', (req, res) => {
  res.redirect('/bookingHistory');
});

const PORT = 8080;
app.listen(PORT, () => {
  const currentDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Hong_Kong',
  });
  console.log(`Server started at http://127.0.0.1:${PORT}`);
  console.log(`Current Date and Time (HKT): ${currentDate}`);
});
