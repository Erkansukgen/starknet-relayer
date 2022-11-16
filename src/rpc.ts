import fetch from 'cross-fetch';
import express from 'express';
import { timedFundingRound } from './strategies';

global.fetch = fetch;

const router = express.Router();

router.post('/timed_funding_round', async (req, res) => {
  const { id, method, params } = req.body;
  return await timedFundingRound.rpc[method](id, params, res);
});

export default router;
