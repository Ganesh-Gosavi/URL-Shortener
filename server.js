// Import required modules
const express = require("express"); // Express framework for building web applications
const mongoose = require("mongoose"); // Mongoose library for interacting with MongoDB
const ShortUrl = require("./models/shortUrl"); // Import the ShortUrl model for database operations
const validator = require("validator"); // Validator library for URL validation
const rateLimit = require("express-rate-limit"); // For rate-limiting requests

const app = express(); // Initialize an Express application

// Rate limiting: 100 requests per minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute
  message: "Too many requests, please try again later.",
});

app.use(limiter); // Apply rate limiter globally

// Connect to the MongoDB database
mongoose
  .connect(
    "mongodb+srv://ganagosavi92:rkhj2U15p0z5G9tR@cluster0.oyqakwz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true, // Use the new URL string parser
      useUnifiedTopology: true, // Use the new server discovery and monitoring engine
    }
  )
  .then(() => console.log("Database connected successfully!")) // Log success message for database connection
  .catch((error) => console.error("Database connection failed:", error)); // Log error message if connection fails

// Set the view engine to EJS for rendering HTML pages
app.set("view engine", "ejs");

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: false }));

// Route to display the homepage with all short URLs
app.get("/", async (req, res) => {
  // Fetch all short URLs from the database
  const shortUrls = await ShortUrl.find();

  // Render the 'index.ejs' view and pass the list of short URLs to the template
  res.render("index", { shortUrls: shortUrls });
});

// Route to handle form submissions for creating new short URLs
app.post("/shortUrls", async (req, res) => {
  const { fullUrl } = req.body;

  // Validate the URL before storing it
  if (!validator.isURL(fullUrl)) {
    return res.status(400).send("Invalid URL.");
  }

  try {
    // Create a new short URL document in the database using the full URL from the form input
    await ShortUrl.create({ full: fullUrl });

    // Redirect back to the homepage to display the updated list of short URLs
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Error creating short URL.");
  }
});

// Route to handle redirection based on the short URL
app.get("/:shortUrl", async (req, res) => {
  // Find the corresponding short URL document in the database
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });

  // If the short URL is not found, return a 404 error
  if (shortUrl == null) return res.sendStatus(404);

  // Increment the click count for the short URL and update the last accessed timestamp
  shortUrl.clicks++;
  shortUrl.lastAccessed = new Date(); // Store the last accessed timestamp
  await shortUrl.save();

  // Redirect the user to the original full URL
  res.redirect(shortUrl.full);
});

// Route to fetch statistics for a short URL
app.get("/stats/:shortUrl", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });

    // If the short URL is not found, return a 404 error
    if (!shortUrl) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // Respond with the statistics
    res.json({
      originalUrl: shortUrl.full,
      shortUrl: shortUrl.short,
      clicks: shortUrl.clicks,
      lastAccessed: shortUrl.lastAccessed,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Start the server on port 5000 (or the port specified in the environment variables)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
