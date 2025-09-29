import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

// 🔗 Connect to Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ✅ Root test
app.get("/", (req, res) => {
  res.send("IFG Backend running ✅");
});


// ----------------- CONTACTS -----------------
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const result = await pool.query(
      "INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, message]
    );
    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});


// ----------------- USERS -----------------
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
      [name, email, phone, hashedPassword]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(400).json({ success: false, error: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});


// ----------------- COMPETITIONS -----------------
app.post("/api/competition", async (req, res) => {
  try {
    const { user_id, idea_title, description } = req.body;

    const result = await pool.query(
      "INSERT INTO competitions (user_id, idea_title, description) VALUES ($1, $2, $3) RETURNING *",
      [user_id, idea_title, description]
    );

    res.json({ success: true, entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Competition entry failed" });
  }
});


// ----------------- SERVER -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 IFG Backend running on port ${PORT}`));
