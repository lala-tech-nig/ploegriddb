// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// File-based DB
const dbFile = path.join(__dirname, "db.json");

// Initialize DB if not exists
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ landlords: [], organizations: [] }, null, 2));
}

// Helper functions for DB
const readDB = () => JSON.parse(fs.readFileSync(dbFile, "utf-8"));
const writeDB = (data) => fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadFolder));

// ===== GET ROUTES =====
app.get("/", (req, res) => {
  res.send("PoleGrid Services API running!");
});

// Get all landlords
app.get("/api/landlords", (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.landlords });
});

// Get all organizations
app.get("/api/organizations", (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.organizations });
});

// ===== POST ROUTES =====
// Landlord registration
app.post(
  "/api/landlord/register",
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "supportingDocs", maxCount: 5 },
  ]),
  (req, res) => {
    const formData = req.body;
    const files = req.files;

    // Add file paths to formData
    formData.idPhoto = files.idPhoto ? files.idPhoto[0].filename : null;
    formData.supportingDocs = files.supportingDocs
      ? files.supportingDocs.map((f) => f.filename)
      : [];

    // Update DB
    const db = readDB();
    db.landlords.push(formData);
    writeDB(db);

    res.json({
      success: true,
      message: "Landlord registered and saved to DB!",
      data: formData,
    });
  }
);

// Organization registration
app.post(
  "/api/organization/register",
  upload.array("documents", 10),
  (req, res) => {
    const formData = req.body;
    const files = req.files;

    formData.documents = files ? files.map((f) => f.filename) : [];

    // Update DB
    const db = readDB();
    db.organizations.push(formData);
    writeDB(db);

    res.json({
      success: true,
      message: "Organization registered and saved to DB!",
      data: formData,
    });
  }
);

// Generic file upload route
app.post("/api/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file)
    return res.status(400).json({ success: false, message: "No file uploaded" });

  res.json({
    success: true,
    message: "File uploaded successfully!",
    filePath: `/uploads/${file.filename}`,
  });
});

// ===== 404 handler =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
