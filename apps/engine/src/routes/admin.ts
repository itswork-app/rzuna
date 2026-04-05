import { FastifyInstance } from 'fastify';
import { TuningService, ScoringConfig } from '../core/services/tuning.service.js';
import { validateApiKey } from '../middleware/auth.js';
import { db, users, eq } from '@rzuna/database';
import { env } from '../utils/env.js';

/**
 * 🏛️ Admin Routes: Godmode Tuning (V22.2)
 * Allows authorized admins to adjust engine weights and thresholds in real-time.
 */
export const adminRoutes = async (fastify: FastifyInstance, options: { tuner: TuningService }) => {
  const { tuner } = options;

  // 🛡️ Protect all admin routes with API Key
  fastify.addHook('preHandler', validateApiKey);

  // 🛡️ Extra check: Ensure user is a whitelisted ADMIN wallet
  fastify.addHook('preHandler', async (request: any, reply: any) => {
    const adminWallets = (env.GODMODE_ADMIN_WALLETS || '').split(',');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.apiKey.userId))
      .limit(1);

    if (!user || !adminWallets.includes(user.walletAddress)) {
      return reply
        .status(403)
        .send({ error: 'FORBIDDEN', message: 'Godmode requires Admin Wallet authorization' });
    }
  });

  /**
   * 📊 GET /admin/tuning
   * Returns current scoring configuration and history snapshots.
   */
  fastify.get('/admin/tuning', async (request: any, reply: any) => {
    const current = tuner.getConfig();
    const history = await tuner.getHistory();

    return {
      current,
      history,
    };
  });

  /**
   * 🛠️ POST /admin/tuning
   * Updates global scoring weights and thresholds instantly.
   */
  fastify.post('/admin/tuning', async (request: any, reply: any) => {
    const newConfig = request.body as ScoringConfig;

    if (!newConfig.version || !newConfig.weights || !newConfig.l1Threshold) {
      return reply
        .status(400)
        .send({ error: 'INVALID_CONFIG', message: 'Missing required fields' });
    }

    await tuner.updateConfig(newConfig, `ADMIN:${request.apiKey.userId}`);

    return {
      status: 'success',
      message: `Config updated to v${newConfig.version}`,
      config: tuner.getConfig(),
    };
  });
};
