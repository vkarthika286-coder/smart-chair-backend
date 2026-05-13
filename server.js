const PORT = process.env.PORT || 5000
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const db = require("./db")
const startSensorSimulation = require("./simulateSensors")

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Smart Chair Backend is running with MySQL")
})

// Employee login
app.post("/api/login", (req, res) => {
  const { employee_id, rfid_tag } = req.body

  const sql = `
    SELECT * FROM employees
    WHERE employee_id = ? AND rfid_tag = ?
  `

  db.query(sql, [employee_id, rfid_tag], (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Login failed" })
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid employee ID or RFID" })
    }

    res.json({
      message: "Login successful",
      user: results[0],
    })
  })
})

// Get all employees
app.get("/api/employees", (req, res) => {
  const sql = "SELECT * FROM employees"

  db.query(sql, (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Failed to fetch employees" })
    }

    res.json(results)
  })
})

// Get single employee
app.get("/api/employees/:id", (req, res) => {
  const employeeId = req.params.id

  const sql = "SELECT * FROM employees WHERE employee_id = ?"

  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Failed to fetch employee" })
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Employee not found" })
    }

    res.json(results[0])
  })
})

// Add employee
app.post("/api/employees", (req, res) => {
  const {
    employee_id,
    name,
    rfid_tag,
    department,
    height_cm,
    weight_kg,
    assigned_chair_id,
  } = req.body

  const sql = `
    INSERT INTO employees
    (employee_id, name, rfid_tag, department, height_cm, weight_kg, assigned_chair_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `

  db.query(
    sql,
    [
      employee_id,
      name,
      rfid_tag,
      department,
      height_cm,
      weight_kg,
      assigned_chair_id,
    ],
    (err) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ error: "Failed to add employee" })
      }

      res.json({ message: "Employee added successfully" })
    }
  )
})

// Get all chairs
app.get("/api/chairs", (req, res) => {
  const sql = "SELECT * FROM chairs"

  db.query(sql, (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Failed to fetch chairs" })
    }

    res.json(results)
  })
})

// Assign chair
app.post("/api/assign-chair", (req, res) => {
  const { employee_id, rfid_tag, chair_id } = req.body

  const updateChairSql = `
    UPDATE chairs
    SET status = 'Assigned',
        current_employee_id = ?,
        current_rfid = ?
    WHERE chair_id = ?
  `

  db.query(updateChairSql, [employee_id, rfid_tag, chair_id], (err) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Failed to assign chair" })
    }

    const updateEmployeeSql = `
      UPDATE employees
      SET assigned_chair_id = ?
      WHERE employee_id = ?
    `

    db.query(updateEmployeeSql, [chair_id, employee_id], (err2) => {
      if (err2) {
        console.log(err2)
        return res.status(500).json({ error: "Failed to update employee" })
      }

      const assignmentSql = `
        INSERT INTO chair_assignments
        (employee_id, chair_id, rfid_tag, status)
        VALUES (?, ?, ?, 'Active')
      `

      db.query(assignmentSql, [employee_id, chair_id, rfid_tag], (err3) => {
        if (err3) {
          console.log(err3)
          return res.status(500).json({ error: "Failed to save assignment" })
        }

        res.json({ message: "Chair assigned successfully" })
      })
    })
  })
})

// Sensor history
app.get("/api/sensor-history/:employee_id", (req, res) => {
  const employeeId = req.params.employee_id

  const sql = `
    SELECT *
    FROM sensor_readings
    WHERE employee_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `

  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: "Failed to fetch sensor history" })
    }

    res.json(results.reverse())
  })
})

// Optional old routes also work
app.get("/employees", (req, res) => {
  res.redirect("/api/employees")
})

app.get("/chairs", (req, res) => {
  res.redirect("/api/chairs")
})

//startSensorSimulation()


app.get("/", (req, res) => {
  res.send("Smart Chair Backend is running")
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})