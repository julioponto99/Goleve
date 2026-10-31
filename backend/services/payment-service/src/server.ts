import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'payment-service', status: 'ok' }));
const port = Number(process.env.PORT || 3009);
app.listen(port, () => console.log(`payment-service running on ${port}`));
