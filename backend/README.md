# Online Voting System - Backend API

Production-ready backend API service for the Online Voting & Election Portal built with **Express**, **TypeScript**, and **MongoDB (Mongoose)**.

---

## 🛠️ Features

- **Admin & Voter Authentication**: Secure JWT-based sessions with password hashing (`bcryptjs`).
- **Voter Registration & Verification**: Duplicate verification on Aadhaar, Voter ID, and Passport; age eligibility enforcement (`>= 18`).
- **Candidate Management**: Assembly and Parliament candidacy with party uniqueness constraints.
- **Election Scheduling**: Schedule management, real-time live window status (`not_started`, `active`, `ended`).
- **Secure Secret Ballot**: Cryptographic HMAC voter hashing prevents double voting while ensuring secret vote tallying.
- **Aggregated Results & Analytics**: Real-time constituency vote counts, percentage breakdown, and voter turnout statistics.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
A `.env` file is already created. You can customize variables if needed:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/voting_system
JWT_SECRET=voting_system_secure_jwt_secret_key_2026_xyz
CORS_ORIGIN=http://localhost:5173
ADMIN_DEFAULT_USERNAME=abubakkar
ADMIN_DEFAULT_PASSWORD=10092004
```

### 3. Seed Default Admin & Sample Data (Optional)
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

The API will be available at: `http://localhost:5000`

---

## 📡 API Endpoints

### 🏥 System Health
- `GET /api/health` - Server health check.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/admin/login` | Admin login (`username`, `password`) |
| `GET` | `/api/auth/admin/me` | Current authenticated admin profile (Bearer Token) |
| `POST` | `/api/auth/user/login` | Voter login via 12-digit Aadhaar number |
| `GET` | `/api/auth/user/me` | Current voter profile & status (Bearer Token) |

### 👥 Voter Management (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all registered voters (supports `?search=`, `?state=`, `?country=`) |
| `GET` | `/api/users/check-duplicate` | Real-time duplicate check (`?field=aadhaar&value=...`) |
| `POST` | `/api/users` | Register a new voter |
| `GET` | `/api/users/:id` | Get voter details |
| `PUT` | `/api/users/:id` | Update voter details |
| `DELETE` | `/api/users/:id` | Delete voter |

### 🏛️ Candidate Management (`/api/candidates`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/candidates` | List candidates (supports `?electionType=`, `?state=`, `?constituency=`) |
| `POST` | `/api/candidates` | Register a new candidate (party uniqueness enforced) |
| `GET` | `/api/candidates/:id` | Get candidate details |
| `PUT` | `/api/candidates/:id` | Edit candidate details |
| `DELETE` | `/api/candidates/:id` | Remove candidate |

### 📅 Election Scheduling (`/api/election`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/election/schedule` | Get active schedule & dynamic status (`active`, `ended`, etc.) |
| `POST` | `/api/election/schedule` | Schedule or start an election |
| `PATCH` | `/api/election/schedule/status` | Update election status (`active`, `ended`) |
| `DELETE` | `/api/election/schedule` | Clear current schedule |

### 🗳️ Voting & Results (`/api/votes`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/votes` | Cast a vote (checks window, eligibility, prevents double vote) |
| `GET` | `/api/votes/results` | Constituency results with vote counts & percentages |
| `GET` | `/api/votes/stats` | Admin dashboard overview (turnout %, votes cast) |

---

## 🏗️ Project Architecture

```
backend/
├── src/
│   ├── config/          # DB connection & environment config
│   ├── controllers/     # Business logic for all modules
│   ├── middlewares/     # JWT authentication & error handling
│   ├── models/          # Mongoose schemas (Admin, User, Candidate, Schedule, Vote)
│   ├── routes/          # Express route definitions
│   ├── utils/           # JWT generator & database seeder
│   ├── app.ts           # Express application configuration
│   └── server.ts        # Entry point & bootstrap
├── .env                 # Active environment file
├── package.json         # Scripts and dependencies
└── tsconfig.json        # TypeScript configuration
```
