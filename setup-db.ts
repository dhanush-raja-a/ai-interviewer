import { initDatabase } from './lib/db';
import dotenv from 'dotenv';

// Load the local .env file which contains TiDB credentials
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

console.log("Connecting to TiDB: ", process.env.DB_HOST);
console.log("Initializing database schema...");

initDatabase().then(() => {
   console.log("SUCCESS! All tables (users, sessions, questions, answers) have been created in TiDB!");
   process.exit(0);
}).catch(e => {
   console.error("FATAL ERROR creating tables in TiDB:", e);
   process.exit(1);
});
