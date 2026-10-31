import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'notification-service', status: 'ok' }));
const port = Number(process.env.PORT || 3010);
app.listen(port, () => console.log(`notification-service running on ${port}`));
