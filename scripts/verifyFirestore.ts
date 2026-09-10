import firebaseConfig from '../firebase-applet-config.json';

const PROJECT_ID = firebaseConfig.projectId;
const DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
const API_KEY = firebaseConfig.apiKey;

async function countCollection(colName: string): Promise<number> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:runQuery?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: colName }],
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Query failed for ${colName}: ${errText}`);
  }

  const results = await response.json();
  const docs = Array.isArray(results) ? results.filter((r) => r.document) : [];
  return docs.length;
}

async function verify() {
  console.log('--- Verifying Live Cloud Firestore Documents ---');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}\n`);

  const collections = [
    'categories',
    'users',
    'salons',
    'services',
    'technicians',
    'working_hours',
    'appointments',
    'reviews',
    'reels',
    'promotions',
    'announcements',
    'products',
    'product_orders',
  ];

  let grandTotal = 0;

  for (const col of collections) {
    try {
      const count = await countCollection(col);
      console.log(`✓ Collection "${col}": ${count} live documents confirmed`);
      grandTotal += count;
    } catch (err: any) {
      console.error(`✗ Collection "${col}" query error:`, err.message);
    }
  }

  console.log(`\n🎉 Grand Total: ${grandTotal} live documents verified in Firestore!`);
}

verify().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
