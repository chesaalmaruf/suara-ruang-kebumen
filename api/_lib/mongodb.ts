import { MongoClient, type Db, type Collection, type MongoClientOptions } from 'mongodb';
import { INITIAL_REPORTS } from '../../src/data/initialData.ts';
import type { ReportItem } from '../../src/types/index.ts';

// In-memory fallback store when MongoDB is unconfigured or unreachable
let memoryReportsStore: ReportItem[] = structuredClone(INITIAL_REPORTS);

export function getInMemoryReports(): ReportItem[] {
  return [...memoryReportsStore].sort(
    (a, b) => (b.sawScores?.totalSaw ?? 0) - (a.sawScores?.totalSaw ?? 0)
  );
}

export function insertInMemoryReport(report: ReportItem): ReportItem {
  memoryReportsStore = [report, ...memoryReportsStore.filter(r => r.id !== report.id)];
  return report;
}

export function updateInMemoryReport(id: string, updates: Partial<ReportItem>): ReportItem | null {
  let updatedItem: ReportItem | null = null;
  memoryReportsStore = memoryReportsStore.map(r => {
    if (r.id === id) {
      updatedItem = { ...r, ...updates };
      return updatedItem;
    }
    return r;
  });
  return updatedItem;
}

export function deleteInMemoryReport(id: string): boolean {
  const before = memoryReportsStore.length;
  memoryReportsStore = memoryReportsStore.filter(r => r.id !== id);
  return memoryReportsStore.length < before;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientUri: string | undefined;
}

function cleanEnvValue(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']+|["']+$/g, '').trim();
}

/**
 * Normalizes MongoDB URI and encodes unescaped special characters in credentials if needed
 */
export function getNormalizedMongoUri(): string {
  const raw = cleanEnvValue(process.env.MONGODB_URI);
  if (!raw) return '';

  // Handle unencoded '@' inside password (e.g. mongodb+srv://user:p@ss@cluster0.mongodb.net/...)
  const schemeMatch = raw.match(/^(mongodb(?:\+srv)?:\/\/)(.+)$/);
  if (!schemeMatch) return raw;

  const [, scheme, rest] = schemeMatch;
  const slashIdx = rest.indexOf('/');
  const authority = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
  const pathAndQuery = slashIdx === -1 ? '' : rest.slice(slashIdx);

  const lastAtIdx = authority.lastIndexOf('@');
  if (lastAtIdx !== -1) {
    const userInfo = authority.slice(0, lastAtIdx);
    const hostPart = authority.slice(lastAtIdx + 1);
    const colonIdx = userInfo.indexOf(':');
    if (colonIdx !== -1) {
      const rawUser = userInfo.slice(0, colonIdx);
      const rawPass = userInfo.slice(colonIdx + 1);
      // Decode first so already-encoded strings are not double-encoded
      const safeDecode = (s: string) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      };
      const encodedUser = encodeURIComponent(safeDecode(rawUser));
      const encodedPass = encodeURIComponent(safeDecode(rawPass));
      return `${scheme}${encodedUser}:${encodedPass}@${hostPart}${pathAndQuery}`;
    }
  }

  return raw;
}

export function getResolvedDbName(): string {
  const explicitDb = cleanEnvValue(process.env.MONGODB_DB);
  if (explicitDb) return explicitDb;

  const uri = getNormalizedMongoUri();
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (match && match[1] && match[1].trim().length > 0) {
    return match[1].trim();
  }

  return 'suararuang_kebumen';
}

export function isMongoConfigured(): boolean {
  const uri = getNormalizedMongoUri();
  if (!uri) return false;
  if (
    uri.includes('cluster0.xxxxx') ||
    uri.includes('<password>') ||
    uri.includes('<username>') ||
    uri.includes('your_mongodb_uri')
  ) {
    return false;
  }
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = getNormalizedMongoUri();
  if (!isMongoConfigured()) {
    throw new Error('MONGODB_URI is not set or invalid in environment variables');
  }

  const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: process.env.VERCEL ? 10000 : 5000,
    connectTimeoutMS: process.env.VERCEL ? 10000 : 5000,
    socketTimeoutMS: 25000,
  };

  if (!globalThis._mongoClientPromise || globalThis._mongoClientUri !== uri) {
    const client = new MongoClient(uri, options);
    globalThis._mongoClientUri = uri;
    globalThis._mongoClientPromise = client.connect().catch(err => {
      globalThis._mongoClientPromise = undefined;
      globalThis._mongoClientUri = undefined;
      throw err;
    });
  }

  return globalThis._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getResolvedDbName());
}

export async function getReportsCollection(): Promise<Collection<any>> {
  const db = await getDatabase();
  return db.collection('reports');
}
