import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'agenda-service', status: 'ok' }));
const port = Number(process.env.PORT || 3004);
app.listen(port, () => console.log(`agenda-service running on ${port}`));
