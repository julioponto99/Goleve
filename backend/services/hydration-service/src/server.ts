import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'hydration-service', status: 'ok' }));
const port = Number(process.env.PORT || 3006);
app.listen(port, () => console.log(`hydration-service running on ${port}`));
