import 'dotenv/config.js';
import { createDbPool } from './db.js';
import ErrorProcessor from './errorProcessor.js';
import googleaiSearch from './googleai.js';


const pool = createDbPool();
const processor = new ErrorProcessor(pool, googleaiSearch);

async function run() {
  try {
    await processor.processOne();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Processing failed', error);
    try {
      await pool.end();
    } catch (endError) {
      console.error('Pool shutdown failed', endError);
    }
    process.exit(1);
  }
}

run();
