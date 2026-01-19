import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const rs = await db.execute('SELECT * FROM roles');
        return NextResponse.json(rs.rows);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, internal_rate, charge_out_rate } = body;

        if (!name || !internal_rate || !charge_out_rate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const rs = await db.execute({
            sql: 'INSERT INTO roles (name, internal_rate, charge_out_rate) VALUES (?, ?, ?)',
            args: [name, internal_rate, charge_out_rate]
        });

        // rs.lastInsertRowid is BigInt in LibSQL. JSON.stringify fails on BigInt.
        const newId = rs.lastInsertRowid.toString();

        return NextResponse.json({ id: newId, ...body }, { status: 201 });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
