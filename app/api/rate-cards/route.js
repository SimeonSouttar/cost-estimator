import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const rs = await db.execute('SELECT * FROM rate_cards ORDER BY created_at DESC');
        return NextResponse.json(rs.rows);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const rs = await db.execute({
            sql: 'INSERT INTO rate_cards (name) VALUES (?)',
            args: [name]
        });

        // rs.lastInsertRowid is BigInt
        const newId = rs.lastInsertRowid.toString();

        return NextResponse.json({ id: newId, name, is_active: 1 }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
