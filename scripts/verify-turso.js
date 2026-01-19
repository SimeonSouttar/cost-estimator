import db, { initDb } from '../lib/db.js';

async function verify() {
    try {
        console.log('Initializing DB...');
        await initDb();
        console.log('DB Initialized.');

        console.log('Checking tables...');
        const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");

        const tables = result.rows.map(r => r.name);
        console.log('Tables found:', tables);

        const expected = ['roles', 'estimates', 'estimate_roles', 'estimate_tasks', 'estimate_task_roles', 'settings'];
        const missing = expected.filter(t => !tables.includes(t));

        if (missing.length === 0) {
            console.log('SUCCESS: All tables present on Turso.');
        } else {
            console.error('FAILURE: Missing tables:', missing);
            process.exit(1);
        }
    } catch (err) {
        console.error('CONNECTION ERROR:', err);
        process.exit(1);
    }
}

verify();
