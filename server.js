// =========================================================================
// TCEMate Campus Collaboration Portal - Node.js Backend Server (server.js)
// =========================================================================

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS & No-Cache Headers (Prevents 304 Not Modified caching in Edge/Chrome)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Serve static TCEMate HTML, CSS, and JS files
app.use(express.static(path.join(__dirname)));

// Mock Student Users Database
const usersDatabase = [
    { id: "123", regNo: "24IT045", name: "Sanjaypriyan S", department: "Information Technology", year: "3rd Year", section: "A" },
    { id: "124", regNo: "24CSE012", name: "Anita R", department: "Computer Science", year: "3rd Year", section: "B" },
    { id: "125", regNo: "24ECE088", name: "Praveen M", department: "Electronics & Comm.", year: "2nd Year", section: "A" }
];

// Async database query simulation
const fetchUserData = (id) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (id === 'error') {
                reject(new Error("Simulated TCEMate database crash"));
            }
            const foundUser = usersDatabase.find(u => u.id === id || u.regNo === id);
            resolve(foundUser || null);
        }, 500);
    });
};

// =========================================================================
// DEBUGGING ROUTE HANDLERS
// =========================================================================

// Route 1: Get User Profile by ID / Register Number (BUGGY STARTER STATE FOR LAB)
// BUG 4 (Missing async/await & missing try/catch): Causes unhandled rejection process crash on /api/user/error | FIX: Add async/await and wrap in try/catch
app.get('/api/user/:id', (req, res) => {
    const userPromise = fetchUserData(req.params.id);

    userPromise.then(user => {
        if (!user) {
            // BUG 5 (Incorrect HTTP Status Code): Returns 200 for missing user | FIX: Change res.status(200) to res.status(404)
            return res.status(200).json({
                error: "User not found"
            });
        }
        res.status(200).json(user);
    });
    // Missing .catch() wrapper causes server crash on rejection
});

// Route 2: Get All TCEMate Project Listings
app.get('/api/listings', (req, res) => {
    res.status(200).json([
        { id: 1, title: "AI Consortium Internship Portal", department: "IT", status: "open", timeLabel: "2h ago" },
        { id: 2, title: "TCE Campus Navigation App", department: "CSE", status: "open", timeLabel: "1d ago" }
    ]);
});

// Start Server
app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` 🚀 TCEMate Node.js Backend Server running at: http://localhost:${PORT}`);
    console.log(` 📄 Serving TCEMate frontend files from: ${__dirname}`);
    console.log(` 🛠️  API Endpoints:`);
    console.log(`    - Get User: http://localhost:${PORT}/api/user/123`);
    console.log(`    - Get Missing User (Status Test): http://localhost:${PORT}/api/user/999`);
    console.log(`    - Trigger Exception: http://localhost:${PORT}/api/user/error`);
    console.log(`================================================================`);
});
