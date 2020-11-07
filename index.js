const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const users = require('./routes/users');
var {mongoose} = require('./config');
const passport = require('passport');
const app = express();
require('./passport')(passport);
// const router = express.Router();
const port = process.env.PORT || 5000;

// app.get('/', (req, res) => {
//     res.send('Hello');
// })

const publicPath = path.join(__dirname, './views');
app.set('view engine', 'pug');
app.use(express.static(publicPath));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(passport.initialize());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(users);
app.listen(port, console.log(`The server is running on ${port}`));