const JwtStrategy = require('passport-jwt').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('users');
const keys = require('./config');

const opts = {};
opts.secretOrKey = keys.secretOrKey;
const cookieExtractor = function(req) {
    var token = null;
    if(req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
};
opts.jwtFromRequest = cookieExtractor;

module.exports = (passport) => {
    passport.use(
        new JwtStrategy(opts, (jwt_payload, done)=> {
            User.findById(jwt_payload.id).then(user => {
                if(user){
                    return done(null, user);
                }
                return done(null, false);
            })
        })
    );
};