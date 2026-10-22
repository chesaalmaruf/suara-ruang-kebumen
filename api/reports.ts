import type { IncomingMessage, ServerResponse } from 'http';
import { isMongoConfigured, getReportsCollection } from './lib/mongodb.ts';
import { INITIAL_REPORTS } from '../src/data/initialData.ts';

async function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    return typeof (req as any).body === 'string'
      ? JSON.parse((req as any).body)
      : (req as any).body;
  }
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const configured = isMongoConfigured();

  // Handle GET /api/reports
  if (req.method === 'GET') {
    if (!configured) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'fallback',
          message: 'MONGODB_URI not configured. Serving initial data.',
          data: INITIAL_REPORTS,
        })
      );
      return;
    }

    try {
      const collection = await getReportsCollection();
      const count = await collection.countDocuments();

      // Auto-seed collection if empty
      if (count === 0) {
        console.log('Seeding MongoDB with INITIAL_REPORTS...');
        await collection.insertMany(INITIAL_REPORTS as any);
      }

      const docs = await collection
        .find({})
        .sort({ 'sawScores.totalSaw': -1, createdAt: -1 })
        .toArray();

      // Clean up Mongo _id so it conforms to ReportItem
      const formatted = docs.map(doc => {
        const { _id, ...rest } = doc;
        return rest;
      });

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'mongodb',
          count: formatted.length,
          data: formatted,
        })
      );
    } catch (err: any) {
      console.error('Error querying MongoDB:', err);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'fallback_on_error',
          error: err.message,
          data: INITIAL_REPORTS,
        })
      );
    }
    return;
  }

  // Handle POST /api/reports (Submit new report)
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const newReport = body.report || body;

    if (!newReport || !newReport.id) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Invalid report data or missing ID' }));
      return;
    }

    if (!configured) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'local_fallback',
          message: 'Saved in client fallback (MongoDB not configured)',
          data: newReport,
        })
      );
      return;
    }

    try {
      const collection = await getReportsCollection();
      await collection.insertOne(newReport);

      res.statusCode = 201;
      res.end(
        JSON.stringify({
          success: true,
          source: 'mongodb',
          message: 'Laporan berhasil disimpan ke MongoDB!',
          data: newReport,
        })
      );
    } catch (err: any) {
      console.error('Error inserting report to MongoDB:', err);
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          success: false,
          error: err.message,
          data: newReport,
        })
      );
    }
    return;
  }

  // Handle PATCH /api/reports (Update report status / timeline)
  if (req.method === 'PATCH') {
    const body = await parseBody(req);
    const { id, ...updates } = body;

    if (!id) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Missing report id' }));
      return;
    }

    if (!configured) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'local_fallback',
          data: { id, ...updates },
        })
      );
      return;
    }

    try {
      const collection = await getReportsCollection();
      await collection.updateOne({ id }, { $set: updates });

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'mongodb',
          message: `Laporan ${id} berhasil diperbarui di MongoDB`,
          data: { id, ...updates },
        })
      );
    } catch (err: any) {
      console.error('Error updating report in MongoDB:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Handle DELETE /api/reports?id=...
  if (req.method === 'DELETE') {
    const url = new URL(req.url || '', 'http://localhost');
    const reportId = url.searchParams.get('id');

    if (!reportId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Missing report id param' }));
      return;
    }

    if (!configured) {
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, source: 'local_fallback', id: reportId }));
      return;
    }

    try {
      const collection = await getReportsCollection();
      await collection.deleteOne({ id: reportId });

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, source: 'mongodb', deletedId: reportId }));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
