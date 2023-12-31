import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rpc from './rpc';
import herodotus from './herodotus';
import pkg from '../package.json';

const app = express();
const PORT = process.env.PORT || 3000;
const commit = process.env.COMMIT_HASH || '';
const version = commit ? `${pkg.version}#${commit.substr(0, 7)}` : pkg.version;

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(cors({ maxAge: 86400 }));
app.use('/', rpc);
app.use('/herodotus', herodotus);

app.get('/', (_req, res) =>
  res.json({
    version,
    port: PORT,
    starknet_address: process.env.STARKNET_ADDRESS || '',
    eth_address: process.env.ETH_ADDRESS || '',
    herodotus_address: process.env.HERODOTUS_ADDRESS || ''
  })
);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
