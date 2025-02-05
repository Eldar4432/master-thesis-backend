// В server.js или в другом файле с маршрутом
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const app = express();
const port = 5000;

// Подключение к MongoDB
mongoose
  .connect("mongodb://localhost:27017/jobsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

app.use(express.json()); // Middleware для обработки JSON-запросов

// Регистрация нового пользователя
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Проверка, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание нового пользователя
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "jobseeker", // Роль по умолчанию — jobseeker
    });

    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получение списка пользователей (для админа)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
