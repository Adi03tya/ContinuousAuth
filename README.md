# ContinuousAuth – Behavior‑Based Authentication System

## 💡 About the Project

As mobile banking usage soars, traditional one‑time authentication methods (passwords, PINs, biometrics) leave sessions vulnerable to hijacking or credential compromise. **ContinuousAuth** implements **behavior‑based authentication (BBA)** to monitor and verify users in real time—seamlessly blending robust security with user convenience.

---

## 📋 Problem Statement

Cybercriminals exploit compromised credentials or session vulnerabilities post‑login to commit fraud or unauthorized transactions. We need a system that:

- Learns each user’s unique interaction patterns
- Detects anomalies indicative of fraud
- Responds adaptively (e.g., require re‑verification or pause high‑risk actions)
- Respects privacy and conserves device resources

---

## 🔑 Key Behavioral Traits

| Trait              | Description                              | Data Source               |
| ------------------ | ---------------------------------------- | ------------------------- |
| Typing dynamics    | Rhythm, speed, pause signatures          | On‑screen keyboard events |
| Touch pressure     | Finger touch force patterns              | Touchscreen API           |
| Swipe gestures     | Direction, velocity, trajectory          | Touchscreen API           |
| Navigation flow    | Sequence and timing between key screens  | App navigation events     |
| Device handling    | Micro‑movements and orientation changes  | Accelerometer & gyroscope |
| Geo‑fencing trends | Typical location patterns (home, office) | GPS + Wi‑Fi SSID data     |

---

## ⚙️ Architecture & Tech Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL, Drizzle ORM
- **Authentication:** express-session, passport (OIDC)
- **Machine Learning:** Autoencoder, One‑class SVM or Isolation Forest (on-device inference)
- **Frontend:** Vite + React Native (or native iOS/Android)

---

## 🚀 Getting Started

### 1. Unzip the Project

1. Download the provided ContinuousAuth.zip file.

2. Extract its contents into your desired folder:

```bash
unzip ContinuousAuth.zip    # Linux/macOS
Expand-Archive ContinuousAuth.zip -DestinationPath ContinuousAuth  # Windows PowerShell
```
3. Change into the project directory:

```bash
cd ContinuousAuth
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env   # Linux/macOS
   copy .env.example .env  # Windows PowerShell
   ```
2. Edit `.env`:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
   SESSION_SECRET=your_session_secret
   REPLIT_DOMAINS=http://localhost:5173
   ```

### 4. Run the Application

- **Development:**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm run build
  npm start
  ```

Server runs at `http://localhost:3000` by default.

---

## 📈 Continuous Anomaly Detection Workflow

1. **Data Collection & Preprocessing**: Capture interaction/sensor data in sliding windows, extract feature vectors (typing speed, swipe velocity, orientation variance).
2. **Model Training**: Use unsupervised methods (Autoencoder, Isolation Forest) to learn “normal” behavior.
3. **Online Adaptation**: Periodically retrain on-device during low‑risk periods to adapt to genuine behavior drift (e.g., travel).
4. **Anomaly Scoring & Response**:
   - Low score: full access
   - Medium score: frictionless re‑PIN
   - High score: session lock or biometric re‑auth
5. **Threshold Adjustment**: Dynamically raise thresholds when geofence shifts to reduce false positives.

---

## 🔐 Privacy & Efficiency

- **On‑device inference**: No raw data leaves the device.
- **Data minimization**: Store only aggregated summaries.
- **Duty cycling**: Batch process windows, reduce sampling frequency during idle.
- **Compliance**: Aligns with DPDP/GDPR, AES‑256 and TLS 1.3 encryption, tamper‑evident audit logs.

---

## 🎯 Outcomes & Metrics

- **Detection Accuracy**: ≥ 90% true positive, ≤ 5% false positives
- **User Impact**: < 2 seconds additional friction on borderline anomalies
- **Resource Overhead**: < 2% CPU, < 1 MB RAM, minimal battery drain

---

## 🚀 Next Steps

- **Federated Learning** for global model improvements without central data.
- **Behavior Graphs** for richer contextual embeddings.
- **A/B Testing** with real users to fine‑tune thresholds and policies.

---

## 👤 Authors

Aditya Gupta
Deepanshu Rai
Amandeep Singh Rayat
Aashish Vishwakarma
Deepanshu Chourasia 

---

## 📄 License

MIT

