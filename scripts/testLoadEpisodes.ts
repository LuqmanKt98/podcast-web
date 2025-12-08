import { loadEpisodes, clearCache } from '../lib/data';

async function main() {
  try {
    console.log('--- Firestore load test start ---');
    clearCache();

    console.time('first-load');
    const first = await loadEpisodes();
    console.timeEnd('first-load');
    console.log(`Episodes loaded (first): ${first.length}`);

    console.time('second-load (should be cached)');
    const second = await loadEpisodes();
    console.timeEnd('second-load (should be cached)');
    console.log(`Episodes loaded (second): ${second.length}`);

    console.log('Same reference (cache)?', first === second);
    console.log('--- Firestore load test end ---');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  }
}

main();

