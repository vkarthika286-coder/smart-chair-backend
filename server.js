require("dotenv").config()

const express = require("express")
const cors = require("cors")
const db = require("./db")

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

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

    res.json(results[0] || null)
  })
})

// Add employee
app.post("/employees", (req, res) => {
  const name = req.body.name || req.body.employeeName
  const department = req.body.department
  const height = req.body.height || null
  const weight = req.body.weight || null
  const chair_id = req.body.chair_id || req.body.chairId

  if (!name || !department || !chair_id) {
    return res.status(400).json({
      error: "Name, department and chair ID are required",
      received: req.body
    })
  }

  const lastSql = `
    SELECT employee_id 
    FROM employees 
    ORDER BY id DESC 
    LIMIT 1
  `

  db.query(lastSql, (err, results) => {
    if (err) {
      console.log("Last employee error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    let nextNumber = 1

    if (results.length > 0 && results[0].employee_id) {
      const lastNumber = parseInt(results[0].employee_id.replace("EMP", ""))
      nextNumber = lastNumber + 1
    }

    const employee_id = `EMP${String(nextNumber).padStart(3, "0")}`
    const rfid_id = `RFID${String(nextNumber).padStart(3, "0")}`

    const checkSql = "SELECT * FROM employees WHERE chair_id = ?"

    db.query(checkSql, [chair_id], (checkErr, existing) => {
      if (checkErr) {
        console.log("Chair check error:", checkErr)
        return res.status(500).json({ error: "Database error" })
      }

      if (existing.length > 0) {
        return res.status(409).json({
          error: "Chair ID already assigned"
        })
      }

      const insertSql = `
        INSERT INTO employees 
        (employee_id, rfid_id, name, department, height, weight, chair_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `

      db.query(
        insertSql,
        [employee_id, rfid_id, name, department, height, weight, chair_id],
        (insertErr, result) => {
          if (insertErr) {
            console.log("Add employee error:", insertErr)
            return res.status(500).json({
              error: "Failed to add employee"
            })
          }

          res.json({
            message: "Employee added successfully",
            id: result.insertId,
            employee_id,
            rfid_id
          })
        }
      )
    })
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

// Assign chair
app.post("/assign-chair", (req, res) => {
  const employee_id = req.body.employee_id || req.body.employeeId
  const chair_id = req.body.chair_id || req.body.chairId

  const sql = "UPDATE employees SET chair_id = ? WHERE employee_id = ?"

  db.query(sql, [chair_id, employee_id], (err) => {
    if (err) {
      console.log("Assign chair error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json({ message: "Chair assigned successfully" })
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})