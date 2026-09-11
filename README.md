# TCEMate Team Collaboration Portal

TCEMate is a college team-collaboration portal for students of Thiagarajar College of Engineering. The project started as a static AngularJS front end and has been extended with a Node.js + Express backend and MongoDB persistence while keeping the original UI structure and AngularJS architecture intact.

## Project overview

- Frontend: AngularJS, HTML, CSS
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT with bcrypt password hashing
- Local API base URL: http://localhost:5000/api

## Folder structure

```text
.
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── data.js
│   └── angular-methods.js
├── index.html
├── login.html
├── browse.html
├── create-listing.html
├── create-post.html
├── forum.html
├── manage-applicants.html
├── my-interests.html
├── notifications.html
├── profile.html
├── profile-view.html
├── script.js
├── style.css
├── record_md/
├── wireframes/
├── .gitignore
└── README.md
```

## Technologies

- AngularJS 1.x
- Express.js
- MongoDB MongoDB Atlas or local MongoDB instance
- Mongoose
- JWT
- bcryptjs
- CORS and dotenv

## MongoDB setup

1. Install MongoDB locally or create a MongoDB Atlas cluster.
2. Copy `backend/.env.example` to `backend/.env`.
3. Add a valid MongoDB URI in `MONGO_URI`.
4. Set a JWT secret in `JWT_SECRET`.

Example:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tcemate
PORT=5000
JWT_SECRET=your_secure_secret
```

> Do not commit real credentials or secrets.

## Environment variables

Backend variables are defined in `backend/.env`:

- `MONGO_URI`: MongoDB connection string
- `PORT`: Backend port (default 5000)
- `JWT_SECRET`: Secret used to sign JWT tokens

## How to run the backend

```bash
cd backend
npm install
npm run dev
```

The server listens on `http://localhost:5000` by default.

## How to run the frontend

Use a local static HTTP server instead of opening the pages as `file://`.

Examples:

```bash
cd TCEMate-Team-Collaboration-Portal
python -m http.server 8000
```

Then open:

- http://localhost:8000/login.html
- http://localhost:8000/index.html

Alternatively use a VS Code Live Server extension.

## API endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users/me`
- `PUT /api/users/me`

### Projects

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Discussions

- `GET /api/discussions`
- `GET /api/discussions/:id`
- `POST /api/discussions`
- `PUT /api/discussions/:id`
- `DELETE /api/discussions/:id`

### Applicants

- `GET /api/applicants`
- `POST /api/applicants`
- `PUT /api/applicants/:id`
- `DELETE /api/applicants/:id`

### Interests

- `GET /api/interests`
- `POST /api/interests`
- `PUT /api/interests/:id`
- `DELETE /api/interests/:id`

### Notifications

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

### Health

- `GET /api/health`

## Authentication flow

1. User signs up or logs in via AngularJS UI.
2. Backend validates email, password, and duplicates.
3. Server issues a JWT token.
4. Frontend stores the token and attaches it in the `Authorization` header for protected API calls.
5. Protected endpoints use middleware to verify the token and attach the logged-in user.

## Database collections

The MongoDB schema is organized around these collections:

- `users`
- `projects`
- `discussions`
- `applicants`
- `interests`
- `notifications`

## Testing instructions

### Backend health check

```bash
curl http://localhost:5000/api/health
```

### Manual API testing

- Use Postman or curl to hit the auth and CRUD routes.
- Verify signup, duplicate-email rejection, login, JWT-based access, profile updates, project creation, forum posts, and notifications.

### Important note

This project does not ship with a production-ready MongoDB credential. You must provide your own MongoDB Atlas or local connection string in `backend/.env` before the app can fully persist data.
