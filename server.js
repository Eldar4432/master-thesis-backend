const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const app = express();
const port = 5001; // или другой порт

// Подключение к MongoDB
mongoose
  .connect("mongodb://localhost:27017/jobsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

app.use(express.json()); // Middleware для обработки JSON-запросов

// Простой маршрут для корня
app.get("/", (req, res) => {
  res.send("Welcome to the Job Portal API!");
});

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

const jwt = require("jsonwebtoken"); // Подключаем JWT
const secretKey = "your_secret_key"; // Лучше вынести в .env

// Логин пользователя
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Генерируем JWT-токен
    const token = jwt.sign({ id: user._id, role: user.role }, secretKey, {
      expiresIn: "7d", // Токен действует 7 дней
    });

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const authMiddleware = require("./models/middlewares/authMiddleware");
const roleMiddleware = require("./models/middlewares/roleMiddleware");

// Получение всех пользователей (только для админа)
app.get(
  "/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Добавление новой вакансии (только работодатель)
app.post(
  "/jobs",
  authMiddleware,
  roleMiddleware(["employer"]),
  async (req, res) => {
    try {
      const job = new Job(req.body);
      await job.save();
      res.status(201).json(job);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Вход пользователя
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "your_secret_key",
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const authenticateRole = (role) => {
  return (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }

    jwt.verify(token, "your_secret_key", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      if (decoded.role !== role) {
        return res.status(403).json({ message: "You don't have permission" });
      }

      req.user = decoded;
      next();
    });
  };
};

app.get("/admin", authenticateRole("admin"), (req, res) => {
  res.send("Welcome Admin!");
});

const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000", // Укажи URL твоего фронтенда
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
