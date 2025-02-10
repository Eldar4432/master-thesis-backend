const jwt = require("jsonwebtoken");
const secretKey = "your_secret_key"; // Должен быть таким же, как в `server.js`

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), secretKey);
    req.user = verified; // Добавляем данные пользователя в `req`
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
