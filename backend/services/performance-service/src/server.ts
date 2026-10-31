import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'performance-service', status: 'ok' }));
const port = Number(process.env.PORT || 3005);
app.listen(port, () => console.log(`performance-service running on ${port}`));
