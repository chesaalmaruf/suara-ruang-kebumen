import type { IncomingMessage, ServerResponse } from 'http';
import { isMongoConfigured, getDatabase, getResolvedDbName } from './_lib/mongodb.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const configured = isMongoConfigured();

  if (!configured) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'ok',
        database: 'not_configured',
        message: 'MONGODB_URI is not set. Application is using LocalStorage fallback.',
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'ok',
        database: 'connected',
        dbName: getResolvedDbName(),
        provider: 'MongoDB Atlas',
        message: 'Successfully connected to MongoDB database.',
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error: any) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'degraded',
        database: 'connection_error',
        error: error?.message || 'Failed to connect to MongoDB',
        message: 'MongoDB connection failed. Application is using LocalStorage fallback.',
        timestamp: new Date().toISOString(),
      })
    );
  }
}
