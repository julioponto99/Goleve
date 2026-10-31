import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'training-service', status: 'ok' }));
const port = Number(process.env.PORT || 3003);
app.listen(port, () => console.log(`training-service running on ${port}`));
