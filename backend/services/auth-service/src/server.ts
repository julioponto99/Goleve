import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'auth-service', status: 'ok' }));
const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`auth-service running on ${port}`));
