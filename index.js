const express = require('express');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'assets' directory
app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Route where all API traffic will come
app.post('/api', async (req, res) => {
    const { route } = req.body;

    if (route === '/balance') {
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        try {
            const response = await axios.post('http://localhost:3000/balance', { userId });
            return res.json(response.data);
        } catch (error) {
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    } else if (route === '/transactions') {
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        try {
            const response = await axios.post('http://localhost:3000/transactions', { userId });
            return res.json(response.data);
        } catch (error) {
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    } else {
        res.status(400).json({ error: 'Invalid route' });
    }
});

// Endpoint to return current bank balance
app.post('/balance', (req, res) => {
    const userId = parseInt(req.body.userId, 10);

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    fs.readFile('data/user.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading user data' });
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.userId === userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const message = `Your current bank balance is ${user.currentBalance}`;
        return res.json({ message });
    });
});

// Endpoint to return last 5 transactions
app.post('/transactions', (req, res) => {
    const userId = parseInt(req.body.userId, 10);

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('userId', userId);
    fs.readFile('data/transactions.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading user data' });
        }

        const transactions = JSON.parse(data).filter(t => t.senderId === userId || t.receiverId === userId);
        console.log('transactions', transactions);

        if (!transactions) {
            return res.status(404).json({ error: 'No transaction found' });
        }
        const transaction = (transactions.map(t => {
            return { ...t, amount: t.senderId === userId ? -t.amount : t.amount };
        })
        );

        const message = transaction.slice(-5);
        return res.json({ message });
    });
});
// Endpoint to return next upcoming credit card bill
app.post('/bill', (req, res) => {
    const userId = parseInt(req.body.userId, 10);

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    fs.readFile('data/bills.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading credit card bill data' });
        }

        const bills = JSON.parse(data).filter(b => b.userId === userId);
        if (!bills || bills.length === 0) {
            return res.status(404).json({ error: 'No upcoming credit card bill found' });
        }

        const nextBill = bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
        const message = `Your next credit card bill of ${nextBill.amount} is due on ${nextBill.dueDate}`;
        return res.json({ message });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
