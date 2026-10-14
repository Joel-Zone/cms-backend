
const dns = require("node:dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const errorMiddleware = require("./middleware/errorMiddleware");

const contentRoutes = require("./routes/contentRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Allow requests from the React frontend
  
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to parse JSON request bodies
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Root route
app.get("/", (req, res) => {
  res.send("CMS Backend API is running");
});

// API routes
app.use("/api/content", contentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/media", mediaRoutes);

// Error-handling middleware
app.use(errorMiddleware);

// Connect to MongoDB, then start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
