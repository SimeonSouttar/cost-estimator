import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rateCardId = searchParams.get('rate_card_id');

    try {
        let sql = 'SELECT * FROM roles';
        const args = [];

        if (rateCardId) {
            sql += ' WHERE rate_card_id = ?';
            args.push(rateCardId);
        }

        const rs = await db.execute({ sql, args });
        return NextResponse.json(rs.rows);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, internal_rate, charge_out_rate, rate_card_id } = body;

        if (!name || !internal_rate || !charge_out_rate || !rate_card_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const rs = await db.execute({
            sql: 'INSERT INTO roles (name, internal_rate, charge_out_rate, rate_card_id) VALUES (?, ?, ?, ?)',
            args: [name, internal_rate, charge_out_rate, rate_card_id]
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
