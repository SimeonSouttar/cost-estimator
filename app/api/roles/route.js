import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const roles = db.prepare('SELECT * FROM roles ORDER BY name').all();
        return NextResponse.json(roles);
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

        const stmt = db.prepare('INSERT INTO roles (name, internal_rate, charge_out_rate) VALUES (?, ?, ?)');
        const result = stmt.run(name, internal_rate, charge_out_rate);

        return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
