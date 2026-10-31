import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'api-gateway', status: 'ok' }));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`api-gateway running on ${port}`));
