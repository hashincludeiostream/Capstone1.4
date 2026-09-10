import firebaseConfig from '../firebase-applet-config.json';
import {
  seedCategories,
  seedUsers,
  seedSalons,
  seedServices,
  seedTechnicians,
  seedWorkingHours,
  seedAppointments,
  seedReviews,
  seedReels,
  seedPromotions,
  seedAnnouncements,
  seedProducts,
  seedProductOrders,
} from '../src/data/seedData';

const PROJECT_ID = firebaseConfig?.projectId || 'gen-lang-client-0593264091';
const DATABASE_ID = firebaseConfig?.firestoreDatabaseId || 'ai-studio-capstone14-f7575340-b666-4d9b-b5f4-cffdf3c32bbc';
const API_KEY = firebaseConfig?.apiKey || 'AIzaSyDy-J8AsXi4611lIgNnsGk41juwfF8le50';

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDocument(data: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return { fields };
}

async function commitBatch(writes: any[]) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:commit?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Commit failed (${response.status}): ${errText}`);
  }

  return response.json();
}

async function seed() {
  console.log(`🚀 Starting direct REST seed to Firebase project: ${PROJECT_ID}`);
  console.log(`📦 Database: ${DATABASE_ID}`);

  const collections = [
    { name: 'categories', data: seedCategories },
    { name: 'users', data: seedUsers },
    { name: 'salons', data: seedSalons },
    { name: 'services', data: seedServices },
    { name: 'technicians', data: seedTechnicians },
    { name: 'working_hours', data: seedWorkingHours },
    { name: 'appointments', data: seedAppointments },
    { name: 'reviews', data: seedReviews },
    { name: 'reels', data: seedReels },
    { name: 'promotions', data: seedPromotions },
    { name: 'announcements', data: seedAnnouncements },
    { name: 'products', data: seedProducts },
    { name: 'product_orders', data: seedProductOrders },
  ];

  let totalDocs = 0;
  const allWrites: any[] = [];

  for (const item of collections) {
    for (const record of item.data as any[]) {
      const docId = String(record.id);
      const docPath = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${item.name}/${docId}`;
      const docData = toFirestoreDocument(record);

      allWrites.push({
        update: {
          name: docPath,
          fields: docData.fields,
        },
      });
      totalDocs++;
    }
  }

  // Firestore commit supports up to 500 writes per batch
  const batchSize = 100;
  for (let i = 0; i < allWrites.length; i += batchSize) {
    const batch = allWrites.slice(i, i + batchSize);
    console.log(`Writing batch ${Math.floor(i / batchSize) + 1} (${batch.length} documents)...`);
    await commitBatch(batch);
  }

  console.log(`\n🎉 Successfully pushed ${totalDocs} documents directly to Cloud Firestore in project ${PROJECT_ID}!`);
}

seed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
