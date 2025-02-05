const express = require("express");
const mongoose = require("mongoose");
const Job = require("./models/Job");

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

// Получение всех вакансий
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Создание новой вакансии
app.post("/jobs", async (req, res) => {
  const job = new Job({
    title: req.body.title,
    company: req.body.company,
    location: req.body.location,
    description: req.body.description,
    requirements: req.body.requirements,
    responsibilities: req.body.responsibilities,
  });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
