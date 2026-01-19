import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const rs = await db.execute('SELECT key, value FROM settings');
        const settings = {};
        rs.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        return NextResponse.json({
            targetMargin: settings.target_margin_percent ? parseFloat(settings.target_margin_percent) : 30,
            defaultCurrency: settings.default_currency || 'GBP'
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        // Handle Target Margin
        if (body.targetMargin !== undefined) {
            await db.execute({
                sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                args: ['target_margin_percent', String(body.targetMargin)]
            });
        }

        // Handle Default Currency
        if (body.defaultCurrency !== undefined) {
            await db.execute({
                sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                args: ['default_currency', String(body.defaultCurrency)]
            });
        }

        return NextResponse.json({ message: 'Settings updated' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
