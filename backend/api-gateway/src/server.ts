import { localDemo } from './local-demo';
import 'dotenv/config';
localDemo.policy();
import { createApp } from './app';

const app = createApp();
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`api-gateway running on ${port}`));
