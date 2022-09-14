const admin = require("firebase-admin");

// serviceAccountPath = "./serviceAccountKey.json"
// try {
//   if (fs.existsSync(serviceAccountPath)) {
//     const serviceAccount = require(serviceAccountPath);
//   }
// } catch(err) {
//     const serviceAccount = process.env.FIREBASE_ACCOUNT_KEY;
//     console.log("->>",serviceAccount)
//     console.log("->>",process.env.DB_HOST)
//     if (!serviceAccount){
//       throw 'No service account credentials were provided';
//     }
// }

module.exports = admin.initializeApp({
  credential: admin.credential.cert(process.env.FIREBASE_ACCOUNT_KEY),
});

const db = admin.firestore();

module.exports = db;
