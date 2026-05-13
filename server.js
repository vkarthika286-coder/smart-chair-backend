require("dotenv").config()

const express = require("express")
const cors = require("cors")
const db = require("./db")

const app = express()

// CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://smart-chair-frontend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}))

app.use(express.json())

const PORT = process.env.PORT || 5000

// Home Route
app.get("/", (req, res) => {
  res.send("Smart Chair Backend is running")
})

// Get Employees
app.get("/employees", (req, res) => {
  const sql = "SELECT * FROM employees"

  db.query(sql, (err, results) => {
    if (err) {
      console.log(err)
      res.status(500).json({
        error: "Database error"
      })
    } else {
      res.json(results)
    }
  })
})

// Get Single Employee
// Get all employees
app.get("/employees", (req, res) => {
  db.query("SELECT * FROM employees", (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results)
  })
})

// Get single employee
app.get("/employees/:id", (req, res) => {
  const sql = "SELECT * FROM employees WHERE id = ?"

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results[0])
  })
})