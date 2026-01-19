import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const rs = await db.execute({
            sql: 'SELECT value FROM settings WHERE key = ?',
            args: ['target_margin_percent']
        });
        const targetMargin = rs.rows.length > 0 ? parseFloat(rs.rows[0].value) : 30; // Default to 30 if not set

        return NextResponse.json({ targetMargin });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { targetMargin } = await request.json();

        if (targetMargin === undefined || targetMargin === null) {
            return NextResponse.json({ error: 'Missing targetMargin' }, { status: 400 });
        }

        await db.execute({
            sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            args: ['target_margin_percent', String(targetMargin)]
        });

        return NextResponse.json({ message: 'Settings updated' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
