// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

// ===== OPEN CORS FOR ALL DOMAINS =====
app.use(
  cors({
    origin: "*", // Allow ANY DOMAIN
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_")
    ),
});
const upload = multer({ storage });

// File-based DB
const dbFile = path.join(__dirname, "db.json");

// Initialize DB if not exists
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(
    dbFile,
    JSON.stringify(
      { landlords: [], organizations: [], contact: [] },
      null,
      2
    )
  );
}

// Helper functions
const readDB = () => JSON.parse(fs.readFileSync(dbFile, "utf-8"));
const writeDB = (data) =>
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(uploadFolder));

/* ===========================
        GET ROUTES
=========================== */
app.get("/", (req, res) => {
  res.send("PoleGrid Services API running!");
});

app.get("/api/landlords", (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.landlords });
});

app.get("/api/organizations", (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.organizations });
});

/* ===========================
        CONTACT ROUTES
=========================== */
app.get("/api/contact", (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.contact || [] });
});

app.post("/api/contact/create", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required",
    });
  }

  const newMessage = {
    _id: Date.now().toString(),
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
  };

  const db = readDB();
  db.contact.push(newMessage);
  writeDB(db);

  res.json({
    success: true,
    message: "Contact message sent successfully!",
    data: newMessage,
  });
});

/* ===========================
    LANDLORD POST ROUTE
=========================== */
app.post(
  "/api/landlord/register",
  upload.fields([
    { name: "ownershipDoc", maxCount: 1 },
    { name: "idPhoto", maxCount: 1 },
  ]),
  (req, res) => {
    const {
      fullName,
      email,
      phoneNumber,
      sex,
      propertyOwnerName,
      propertyAddress,
      nearestBusStop,
      localGovernment,
      state,
      propertyType,
      serviceType,
    } = req.body;

    if (!fullName || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and phone number are required",
      });
    }

    const ownershipFile = req.files["ownershipDoc"]
      ? `/uploads/${req.files["ownershipDoc"][0].filename}`
      : null;

    const idFile = req.files["idPhoto"]
      ? `/uploads/${req.files["idPhoto"][0].filename}`
      : null;

    const newLandlord = {
      _id: Date.now().toString(),
      fullName,
      email,
      phoneNumber,
      sex,
      propertyOwnerName,
      propertyAddress,
      nearestBusStop,
      localGovernment,
      state,
      propertyType,
      serviceType,
      ownershipDoc: ownershipFile,
      idPhoto: idFile,
      createdAt: new Date().toISOString(),
    };

    const db = readDB();
    db.landlords.push(newLandlord);
    writeDB(db);

    res.json({
      success: true,
      message: "Landlord registered successfully!",
      data: newLandlord,
    });
  }
);

/* ===========================
   ORGANIZATION POST ROUTE
=========================== */ 
app.post("/api/organization/register", upload.none(), (req, res) => {
  const {
    organizationName,
    emailAddress,
    phoneNumber,
    address,
    organizationType,
    otherOrganizationType,
    contactPersonName,
    designation,
    contactPersonEmail,
    contactPersonPhone,
    registrationProcess,
    otherPurpose,
  } = req.body;

  const requiredFields = [
    organizationName,
    emailAddress,
    phoneNumber,
    address,
    organizationType,
    contactPersonName,
    designation,
    contactPersonEmail,
    contactPersonPhone,
    registrationProcess,
  ];

  if (requiredFields.includes(undefined) || requiredFields.includes("")) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be filled",
    });
  }

  const newOrg = {
    _id: Date.now().toString(),
    organizationName,
    emailAddress,
    phoneNumber,
    address,
    organizationType,
    otherOrganizationType,
    contactPersonName,
    designation,
    contactPersonEmail,
    contactPersonPhone,
    registrationProcess,
    otherPurpose,
    createdAt: new Date().toISOString(),
  };

  const db = readDB();
  db.organizations.push(newOrg);
  writeDB(db);

  res.json({
    success: true,
    message: "Organization registered successfully!",
    data: newOrg,
  });
});

/* ===========================
         404 Handler
=========================== */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/* ===========================
       START SERVER
=========================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
