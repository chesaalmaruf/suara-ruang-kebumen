import type { IncomingMessage, ServerResponse } from 'http';
import {
  isMongoConfigured,
  getReportsCollection,
  getInMemoryReports,
  insertInMemoryReport,
  updateInMemoryReport,
  deleteInMemoryReport,
} from './_lib/mongodb.ts';
import { LEGACY_DUMMY_IDS } from '../src/data/initialData.ts';

async function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body && Object.keys((req as any).body).length > 0) {
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
      const data = getInMemoryReports();
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'fallback',
          message: 'MONGODB_URI not configured. Serving in-memory data.',
          data,
        })
      );
      return;
    }

    try {
      const collection = await getReportsCollection();

      // Clean up any legacy dummy seed documents that were previously auto-seeded
      if (LEGACY_DUMMY_IDS.length > 0) {
        await collection.deleteMany({ id: { $in: LEGACY_DUMMY_IDS } });
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
      console.warn('[AI Studio] MongoDB unreachable, serving in-memory fallback:', err.message);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'fallback_on_error',
          error: err.message,
          data: getInMemoryReports(),
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

    insertInMemoryReport(newReport);

    if (!configured) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'local_fallback',
          message: 'Saved in in-memory fallback (MongoDB not configured)',
          data: newReport,
        })
      );
      return;
    }

    try {
      const collection = await getReportsCollection();
      await collection.insertOne({ ...newReport });

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
      console.warn('[AI Studio] MongoDB insert failed, kept in-memory:', err.message);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'local_fallback',
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

    updateInMemoryReport(id, updates);

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
      console.warn('[AI Studio] MongoDB update failed, kept in-memory:', err.message);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          source: 'local_fallback',
          data: { id, ...updates },
        })
      );
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

    deleteInMemoryReport(reportId);

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
      console.warn('[AI Studio] MongoDB delete failed, deleted in-memory:', err.message);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, source: 'local_fallback', deletedId: reportId }));
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
