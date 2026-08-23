import { dbAdmin } from '../lib/firebase-admin';

async function test() {
  try {
    const snap = await dbAdmin.collection('users').limit(1).get();
    console.log('Firebase OK:', snap.empty ? 'Empty' : 'Has data');
  } catch (error) {
    console.error('Firebase Error:', error);
  }
}

test();
