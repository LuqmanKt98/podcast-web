// Fix missing speaker names in transcripts
// Run with: node fix_missing_speakers.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixTranscript() {
  const snapshot = await db.collection('episodes').get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let transcript = data.transcript;
    let modified = false;
    
    // Find paragraphs that start with timestamp but no speaker
    const lines = transcript.split('\n\n');
    const hosts = data.hosts || [];
    const guests = data.guests || [];
    const allSpeakers = [...hosts, ...guests];
    
    let lastSpeaker = null;
    const fixedLines = [];
    
    for (let line of lines) {
      // Check if line starts with timestamp but no speaker
      if (/^\[(\d{2}:\d{2}:\d{2})\]/.test(line)) {
        // Add last speaker name before timestamp
        if (lastSpeaker) {
          line = `${lastSpeaker}: ${line}`;
          modified = true;
        }
      } else {
        // Extract speaker name from line
        const match = line.match(/^([^:\[]+):/);
        if (match) {
          lastSpeaker = match[1].trim();
        }
      }
      fixedLines.push(line);
    }
    
    if (modified) {
      const fixedTranscript = fixedLines.join('\n\n');
      await doc.ref.update({ transcript: fixedTranscript });
      console.log(`Fixed: ${data.episodeTitle}`);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

fixTranscript().catch(console.error);
