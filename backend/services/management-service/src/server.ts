import express from 'express';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'management-service', status: 'ok' }));
const port = Number(process.env.PORT || 3008);
app.listen(port, () => console.log(`management-service running on ${port}`));
