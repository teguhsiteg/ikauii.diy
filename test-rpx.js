import { getToken, getRates, getRpxConfig } from "./lib/rpx.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testRpx() {
  try {
    console.log("Testing RPX Token...");
    const username = "demo"; // dummy if not loaded
    const password = "demo"; // dummy if not loaded
    // Try to get token using dummy or read from env if available
    // But since getRpxConfig needs firebase, we might not be able to run this script easily without firebase-admin initializing.
    
    // Instead of using firebase, let's just test signature with the private key
    const { generateSignature } = await import("./lib/rpx.js");
    const sig = generateSignature({ test: "data" });
    console.log("Signature generated successfully:", sig.substring(0, 50) + "...");
    console.log("Success! No crypto errors.");
  } catch (error) {
    console.error("Test Failed:", error);
  }
}

testRpx();
