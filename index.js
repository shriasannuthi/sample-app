const express = require('express');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');});

// Route where all API traffic will come
app.post('/api', async (req, res) => {
    const { route } = req.body;
 
        if (route === '/balance') {
            const userId = req.body.userId;

            if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
            }
            try{
                const response = await axios.post('http://localhost:3000/balance', { userId })
                return res.json(response.data);
            }
            catch(error){
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
            try{
                const response = await axios.post('http://localhost:3000/transactions', { userId })
                return res.json(response.data);
            }
            catch(error){
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
    fs.readFile('transactions.json', 'utf8', (err, data) => {

        if (err) {
            return res.status(500).json({ error: 'Error reading user data' });
        }
        
        const transactions = JSON.parse(data).filter(t => t.senderId === userId || t.receiverId === userId);
       
        if (!transactions) {
            return res.status(404).json({ error: 'No transaction found' });
        }
        const transaction = (transactions.map(t => {
            return {...t, amount: t.senderId === userId ? -t.amount : t.amount};
        })
    );
    

    const message = transaction.slice(-5);
    return res.json({ message });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
