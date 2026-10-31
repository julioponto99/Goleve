import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'ai-coach-service', status: 'ok' }));
const port = Number(process.env.PORT || 3011);
app.listen(port, () => console.log(`ai-coach-service running on ${port}`));
