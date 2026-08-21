import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTzOffsetFromRequest } from '../lib/dayRange';
import {
  waterService,
  parseAmount,
  MAX_LOG_AMOUNT_ML,
} from '../modules/water/water.service';
import { DomainError } from '../modules/common/domain-error';

export const logWater = async (req: AuthRequest, res: Response) => {
  try {
    const amount = parseAmount(req.body?.amount);
    if (amount === null) {
      return res.status(400).json({
        error: `Valid amount is required (1–${MAX_LOG_AMOUNT_ML} ml, integer)`,
      });
    }

    const result = await waterService.logWater(
      req.userId!,
      amount,
      getTzOffsetFromRequest(req)
    );

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Log Water Error:', error);
    return res.status(500).json({ error: 'Failed to log water' });
  }
};

export const getDailyMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const dateStr = typeof req.query.date === 'string' ? req.query.date : undefined;
    const metrics = await waterService.getDailyMetrics(
      req.userId!,
      dateStr,
      getTzOffsetFromRequest(req)
    );
    return res.json({ success: true, ...metrics });
  } catch (error) {
    console.error('Get Metrics Error:', error);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

export const revertLog = async (req: AuthRequest, res: Response) => {
  try {
    const result = await waterService.revertLog(
      req.userId!,
      getTzOffsetFromRequest(req)
    );
    return res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Revert Log Error:', error);
    return res.status(500).json({ error: 'Failed to revert log' });
  }
};

export const getRangeMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const totals = await waterService.getRangeMetrics(
      req.userId!,
      String(startDate),
      String(endDate),
      getTzOffsetFromRequest(req)
    );

    return res.json({ success: true, totals });
  } catch (error) {
    console.error('Get Range Metrics Error:', error);
    return res.status(500).json({ error: 'Failed to fetch range metrics' });
  }
};

export const getStatsGraph = async (req: AuthRequest, res: Response) => {
  try {
    const { mode, refDate } = req.query;
    if (!mode || !refDate) {
      return res.status(400).json({ error: 'Mode and refDate are required' });
    }

    const data = await waterService.getStatsGraph(
      req.userId!,
      String(mode),
      String(refDate),
      getTzOffsetFromRequest(req)
    );

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Stats Graph Error:', error);
    return res.status(500).json({ error: 'Failed to fetch graph data' });
  }
};
