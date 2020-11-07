const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const path = require('path');
const User = require('../models/User');
const keys = require('../config');
const multer = require('multer');
const { createBrotliCompress } = require('zlib');
router.get('/', (req, res) => {
    res.sendFile((path.join(__dirname, '../views/index.html')));
});

router.get('/login', (req, res) => {
    res.render('login')
});

router.get('/signUp', (req, res) => {
    res.render('signup');
});

var storage = multer.diskStorage({
    destination: './uploads',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
})
var upload = multer({storage: storage});
router.post('/login', (req, res) => {
    const errors = {};
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email}).then(user => {
        if(!user){
            errors.email = "Invalid email"
            return res.status(404).render('login', {errors});
        }
        const name = user.name;
        bcrypt.compare(password, user.password).then(isMatch => {
            if(isMatch){
                const payload = {id: user.id, name: user.name};
                jwt.sign(payload, 
                    keys.secretOrKey,
                    {expiresIn: 3600},
                    (err, token) => {
                        res.cookie('jwt', token, {
                            expires: new Date(Date.now() + 3600 * 1000),
                            secure: false,
                            httpOnly: true,
                        });
                        return res.redirect('/home');
                    })
            }
            else{
                errors.password = "Password Incorrect!!"
                res.render('login', {errors});
            }
        })
    })
});

router.post('/signUp', upload.single('photo'), (req, res) => {
    const errors = {};
    User.findOne({email: req.body.email}).then (user => {
        if(user){
            console.log(user);
            errors.email = 'Email already in user!';
            return res.status(400).render('signup', {errors});
        }
        else{
            var filePath = './uploads/default.png'
            if(req.file) {
                filePath = req.file.path
            }
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                age: req.body.age,
                gender: req.body.gender,
                avatar: filePath,
                question: req.body.question,
                answer: req.body.answer
            });
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save().then(res.redirect('/login')).catch(err);
                });
            });
        }
    });
});

router.get('/home', function(req, res, next) {
    passport.authenticate('jwt', function(err, user) {
        if(err) { 
          return next(err); 
        }
        if(!user) { 
            return res.redirect('/login'); 
        }
        else{ 
            res.render('home', {user});
        }
    }) (req, res, next);
  });

  router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/home');
});

router.get('/forgetPassword', (req, res) => {
    res.render('forget');
})

router.post('/forgetPassword', (req, res) => {
    const email = req.body.email;
    const question = req.body.question;
    const answer = req.body.answer;
    const errors = {};
    User.findOne({email}).then(user => {
        if(!user){
            errors.email = "Email Not Found!!";
            return res.render('forget', {errors});
        }
        if(question !== user.question || answer.toLowerCase() !== user.answer.toLowerCase()){
            errors.security = "Security question/answer not matched!!";
            return res.render('forget', {errors});
        }
        user.password = req.body.password
        bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, (err, hash) => {
        if(err) throw err;
            user.password = hash;
            user.save()
            .then(res.redirect('/login'))
            .catch(err);
        });
    });
    })
})

module.exports = router;