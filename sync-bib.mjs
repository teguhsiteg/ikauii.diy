import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "dpwikadiy", // Replace with actual project ID if different
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncBibCounters() {
  console.log("Starting BIB counter synchronization...");
  try {
    const participantsSnap = await getDocs(collection(db, "offline_participants"));
    
    let maxCounters = {};

    participantsSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const nomorBIB = data.nomorBIB;
      const jarak = data.jarak;

      if (nomorBIB && jarak && typeof nomorBIB === 'string') {
        const jarakAngka = jarak.replace(/\D/g, "") || "9";
        const counterField = `lastBib${jarakAngka}K`;
        
        // Remove prefix 'K-' if it exists (from komunitas)
        let cleanBib = nomorBIB;
        if (cleanBib.startsWith('K-')) cleanBib = cleanBib.substring(2);
        
        // The format is usually {jarakAngka}{urut}. e.g. "5001" or "10001"
        const prefixLength = jarakAngka.length;
        if (cleanBib.startsWith(jarakAngka)) {
          const urutString = cleanBib.slice(prefixLength);
          const urut = parseInt(urutString, 10);
          
          if (!isNaN(urut)) {
             if (!maxCounters[counterField] || urut > maxCounters[counterField]) {
                 maxCounters[counterField] = urut;
             }
          }
        }
      }
    });

    console.log("Max counters found:", maxCounters);

    if (Object.keys(maxCounters).length > 0) {
      await setDoc(doc(db, "settings", "bib_counter"), maxCounters, { merge: true });
      console.log("Successfully updated settings/bib_counter in database!");
    } else {
      console.log("No valid BIBs found to sync.");
    }

  } catch (error) {
    console.error("Error syncing BIB counters:", error);
  }
}

syncBibCounters();
