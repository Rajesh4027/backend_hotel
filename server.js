require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['https://maduragrandeur1.netlify.app', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ message: "Madura Grandeur Backend API is running" });
});

app.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "MG_" + Date.now()
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error creating order" });
    }
});

app.post("/verify-payment", (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const digest = hmac.digest("hex");

        if (digest === razorpay_signature) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error verifying payment" });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;