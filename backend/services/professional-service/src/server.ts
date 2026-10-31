import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'professional-service', status: 'ok' }));
const port = Number(process.env.PORT || 3007);
app.listen(port, () => console.log(`professional-service running on ${port}`));
