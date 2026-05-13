const db = require("./db")

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateSensorData() {
  const heartRate = getRandom(65, 105)
  const temperature = getRandom(28, 36)
  const leftPressure = getRandom(350, 900)
  const rightPressure = getRandom(350, 900)
  const postureScore = getRandom(60, 95)
  const backAngle = getRandom(5, 35)
  const pressureDiff = Math.abs(leftPressure - rightPressure)

  let postureStatus = "Good"
  if (postureScore < 70 || pressureDiff > 250) postureStatus = "Bad"
  else if (postureScore < 82 || pressureDiff > 150) postureStatus = "Moderate"

  let userState = "Relaxed"
  if (heartRate <= 80 && postureStatus === "Good") userState = "Relaxed"
  else if (heartRate <= 90) userState = "Focused"
  else if (heartRate <= 100) userState = "Determined"
  else if (postureStatus === "Bad") userState = "Stressed"
  else userState = "Tensed"

  const chairAction =
    userState === "Relaxed"
      ? "Maintain Settings"
      : userState === "Focused"
      ? "Work Mode Enabled"
      : userState === "Determined"
      ? "Lumbar Support Increased"
      : userState === "Stressed"
      ? "Posture Alert Triggered"
      : "Comfort Mode Activated"

  return {
    heartRate,
    temperature,
    leftPressure,
    rightPressure,
    postureScore,
    backAngle,
    postureStatus,
    userState,
    chairAction,
    fanStatus: temperature > 32 ? "ON" : "OFF",
    vibrationAlert: postureStatus === "Bad" ? "ON" : "OFF",
    productivityScore:
      postureStatus === "Good" ? getRandom(80, 95) : getRandom(55, 75)
  }
}

function startSensorSimulation() {
  console.log("Sensor simulation started")

  setInterval(() => {
    db.query(
      "SELECT * FROM chairs WHERE status = 'Assigned'",
      (err, chairs) => {
        if (err) {
          console.log("Chair fetch failed:", err)
          return
        }

        chairs.forEach((chair) => {
          const data = generateSensorData()

          const updateSql = `
            UPDATE chairs
            SET
              heart_rate = ?,
              temperature = ?,
              left_pressure = ?,
              right_pressure = ?,
              current_posture_score = ?,
              back_angle = ?,
              posture_status = ?,
              current_user_state = ?,
              chair_action = ?,
              fan_status = ?,
              vibration_alert = ?,
              productivity_score = ?
            WHERE chair_id = ?
          `

          db.query(
            updateSql,
            [
              data.heartRate,
              data.temperature,
              data.leftPressure,
              data.rightPressure,
              data.postureScore,
              data.backAngle,
              data.postureStatus,
              data.userState,
              data.chairAction,
              data.fanStatus,
              data.vibrationAlert,
              data.productivityScore,
              chair.chair_id
            ],
            (updateErr) => {
              if (updateErr) {
                console.log("Sensor update failed:", updateErr)
                return
              }

              const historySql = `
                INSERT INTO sensor_readings (
                  chair_id,
                  employee_id,
                  rfid_tag,
                  left_pressure,
                  right_pressure,
                  heart_rate,
                  temperature,
                  posture_score,
                  posture_status,
                  user_state,
                  chair_action,
                  productivity_score
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `

              db.query(
                historySql,
                [
                  chair.chair_id,
                  chair.current_employee_id,
                  chair.current_rfid,
                  data.leftPressure,
                  data.rightPressure,
                  data.heartRate,
                  data.temperature,
                  data.postureScore,
                  data.postureStatus,
                  data.userState,
                  data.chairAction,
                  data.productivityScore
                ],
                () => {
                  console.log(
                    `${chair.chair_id} updated for ${chair.current_employee_id}`
                  )
                }
              )
            }
          )
        })
      }
    )
  }, 10000)
}

module.exports = startSensorSimulation