const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const pool = require("./db");
require("dotenv").config();

module.exports = function (passport) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const [users] = await pool.query(
          "SELECT * FROM Users WHERE user_id = ?",
          [jwt_payload.user_id]
        );
        if (!users.length) {
          return done(null, false);
        }
        const user = users[0];
        return done(null, {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          branch_id: user.branch_id,
        });
      } catch (error) {
        return done(error, false);
      }
    })
  );
};
