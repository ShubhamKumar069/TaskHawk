const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const { UserModel, TodoModel } = require("./models/model");

mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://admin:f8OcJmaAXBj2RjpC@taskhawk.spi5cgo.mongodb.net/MultiUserTodoApp?retryWrites=true&w=majority"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Serve static files (HTML, CSS, JS) from src folder
app.use(express.static(path.join(__dirname, "src")));

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

const PORT = process.env.PORT || 5000;

// Register
app.post("/register", async (req, res) => {
  console.log("Register hit");
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;
    console.log("Checking existing user...");
    const existingUser = await UserModel.findOne({ email });
    console.log("Existing user:", existingUser);

    if (existingUser) return res.status(400).json({ message: "Email already exists!" });

    console.log("Hashing password...");
    const hashedPass = await bcrypt.hash(password, 12);
    console.log("Password hashed");

    const user = new UserModel({ name, email, password: hashedPass });
    console.log("Saving user...");
    await user.save();
    console.log("User saved");

    res.status(201).json({ message: "User created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) return res.status(401).json({ message: "Wrong password!" });

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "secretkey123",
      { expiresIn: "30d" }
    );

    res.status(200).json({ message: "Logged in successfully", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Auth middleware
const authMiddleWare = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No JWT token provided!" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey123");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Profile
app.get("/profile", authMiddleWare, async (req, res) => {
  const user = req.user;
  res.json({ message: "Profile fetched successfully", user });
});

// Create Todo
app.post("/createTodo", authMiddleWare, async (req, res) => {
  try {
    const { title, desc } = req.body;
    if (!title) return res.status(400).json({ message: "Title is Required!" });

    const userId = req.user.userId;
    const newTodo = await TodoModel.create({ title, desc, user: userId });
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's Todos
app.get("/myTodos", authMiddleWare, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todos = await TodoModel.find({ user: userId });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Todo
app.patch("/update/:id", authMiddleWare, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, desc } = req.body;
    const userId = req.user.userId;
    const todo = await TodoModel.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ message: "No todo found!" });

    if (title) todo.title = title;
    if (desc) todo.desc = desc;
    await todo.save();

    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Todo
app.delete("/delete/:id", authMiddleWare, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const todo = await TodoModel.findOneAndDelete({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ message: "No todo found!" });

    res.status(200).json({ message: "Todo Removed Successfully!", todo });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
