// server.js

// Import required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import middleware
const { protect } = require('./middleware/authMiddleware');

// Initialize the app
const app = express();
const port = process.env.PORT || 3000;

// Use middleware
app.use(cors());
app.use(express.json());

// --- Simple In-Memory Data Storage ---
const products = [
    {
      "id": 1,
      "name": "Smartphone",
      "price": 12000,
      "image": "../images/phone.jpg",
      "description": "A sleek smartphone with great performance and long-lasting battery.",
      "stock": 10
    },
    {
      "id": 2,
      "name": "Headphones",
      "price": 2000,
      "image": "../images/headphones.jpg",
      "description": "High-quality wireless headphones with noise cancellation.",
      "stock": 15
    },
    {
      "id": 3,
      "name": "Laptop",
      "price": 55000,
      "image": "../images/laptop.jpg",
      "description": "Powerful laptop with 16GB RAM, 512GB SSD, and the latest processor.",
      "stock": 15
    },
    {
      "id": 4,
      "name": "Smartwatch",
      "price": 4000,
      "image": "../images/watch.jpg",
      "description": "Fitness smartwatch with heart rate monitor and GPS.",
      "stock": 8
    },
    {
        "id":5,
        "name":"T-Shirt",
        "price": 800,
        "image": "../images/tshirt.jpg",
        "description": "A comfortable and stylish cotton t-shirt.",
        "stock": 10
    },
    {
        "id":6,
        "name":"Jeans",
        "price":600,
        "image": "../images/Jeans.jpg",
        "description": "Classic fit denim jeans for everyday wear.",
        "stock": 10
    },
    {
        "id":7,
        "name":"Tv",
        "price":20000,
        "image":"../images/Tv.jpg",
        "description": "A advance feature tv with ai assistant",
        "stock": 10
    },
    {
        "id":8,
        "name":"furniture",
        "price":15000,
        "image":"../images/furniture.jpg",
        "description":"A soft and comfortable furniture to use",
        "stock": 15
    },
    {
        "id":9,
        "name":"Toys",
        "price":500,
        "image":"../images/Toys.jpg",
        "description":"A child playing toy",
        "stock": 15
    },
];

const users = [];
const orders = [];

// --- API Endpoints ---
// GET request to fetch all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// GET request to fetch a single product by its ID
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// User Authentication (using in-memory array)
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = { id: users.length + 1, name, email, password: hashedPassword };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.status(201).json({ message: 'User registered successfully', token });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.status(200).json({ message: 'Logged in successfully', token });
});

// POST request to handle the checkout process
app.post('/api/checkout', protect, (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user;

    if (!items || items.length === 0 || !shippingAddress || !paymentMethod) {
        return res.status(400).json({ message: "Invalid order data." });
    }

    const totalPrice = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const newOrder = {
        orderId: orders.length + 1,
        userId,
        items,
        totalPrice,
        shippingAddress,
        paymentMethod,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };
    orders.push(newOrder);

    res.status(200).json({ message: "Order placed successfully! Thank you." });
});

// GET request to fetch a user's orders
app.get('/api/orders', protect, (req, res) => {
    const userId = req.user;
    const userOrders = orders.filter(order => order.userId === userId);
    res.status(200).json(userOrders);
});

// GET request to fetch a user's profile
app.get('/api/profile', protect, (req, res) => {
    const userId = req.user;
    const user = users.find(u => u.id === userId);

    if (user) {
        const userProfile = {
            name: user.name,
            email: user.email,
        };
        res.status(200).json(userProfile);
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});