const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/User");
const Job = require("./models/Job");
const app = express();
const port = 5001;

// Подключение к MongoDB
mongoose
  .connect("mongodb://localhost:27017/jobsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Настройка CORS
app.use(
  cors({
    origin: "http://localhost:3000", // Указание адреса фронтенда
    methods: "GET,POST,PUT,DELETE", // Разрешенные методы
    allowedHeaders: "Content-Type, Authorization", // Разрешенные заголовки
    credentials: true, // Если нужно поддерживать куки или авторизацию
  })
);

// Middleware для парсинга JSON в запросах
app.use(express.json());

// Простой маршрут для корня
app.get("/", (req, res) => {
  res.send("Welcome to the Job Portal API!");
});

// Регистрация нового пользователя
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
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
      name, // Используем name вместо username
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

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "your_secret_key",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Защищенные маршруты

// Middleware для проверки JWT
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

// Добавление новой вакансии (только для работодателя)
app.post("/jobs", authenticateRole("employer"), async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requirements,
      responsibilities,
    } = req.body;

    const job = new Job({
      title,
      company,
      location,
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
    });

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получение всех вакансий
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
