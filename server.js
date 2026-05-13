require("dotenv").config()

const express = require("express")
const cors = require("cors")
const db = require("./db")

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

// Home
app.get("/", (req, res) => {
  res.send("Smart Chair Backend is running")
})

// Get all employees
app.get("/employees", (req, res) => {
  db.query("SELECT * FROM employees", (err, results) => {
    if (err) {
      console.log("Employees error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results)
  })
})

// Get single employee
app.get("/employees/:id", (req, res) => {
  const sql = "SELECT * FROM employees WHERE id = ? OR employee_id = ?"

  db.query(sql, [req.params.id, req.params.id], (err, results) => {
    if (err) {
      console.log("Employee error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results[0])
  })
})

// Get chairs
app.get("/chairs", (req, res) => {
  db.query("SELECT * FROM chairs", (err, results) => {
    if (err) {
      console.log("Chairs error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results)
  })
})

// Sensor history
app.get("/sensor-history/:employeeId", (req, res) => {
  const sql = `
    SELECT * FROM sensor_history
    WHERE employee_id = ?
    ORDER BY created_at DESC
  `

  db.query(sql, [req.params.employeeId], (err, results) => {
    if (err) {
      console.log("Sensor history error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results)
  })
})

// Latest sensor data
app.get("/latest-sensor/:employeeId", (req, res) => {
  const sql = `
    SELECT * FROM sensor_history
    WHERE employee_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `

  db.query(sql, [req.params.employeeId], (err, results) => {
    if (err) {
      console.log("Latest sensor error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results[0] || null)
  })
})

// Add employee
app.post("/employees", (req, res) => {
  const {
    employee_id,
    name,
    email,
    department,
    chair_id
  } = req.body

  const sql = `
    INSERT INTO employees (employee_id, name, email, department, chair_id)
    VALUES (?, ?, ?, ?, ?)
  `

  db.query(
    sql,
    [employee_id, name, email, department, chair_id],
    (err, result) => {
      if (err) {
        console.log("Add employee error:", err)
        return res.status(500).json({ error: "Database error" })
      }

      res.json({
        message: "Employee added successfully",
        id: result.insertId
      })
    }
  )
})

// Assign chair
app.post("/assign-chair", (req, res) => {
  const { employee_id, chair_id } = req.body

  const sql = "UPDATE employees SET chair_id = ? WHERE employee_id = ?"

  db.query(sql, [chair_id, employee_id], (err) => {
    if (err) {
      console.log("Assign chair error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json({ message: "Chair assigned successfully" })
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})