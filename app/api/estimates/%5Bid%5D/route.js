import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;

    try {
        const estimate = db.prepare('SELECT * FROM estimates WHERE id = ?').get(id);

        if (!estimate) {
            return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
        }

        // Fetch Roles Configuration for this estimate
        const estimateRoles = db.prepare(`
        SELECT 
            er.id,
            er.role_id,
            er.internal_role_id,
            r_sold.name as role_name,
            r_sold.charge_out_rate,
            r_internal.name as internal_role_name,
            r_internal.internal_rate
        FROM estimate_roles er
        JOIN roles r_sold ON er.role_id = r_sold.id
        JOIN roles r_internal ON er.internal_role_id = r_internal.id
        WHERE er.estimate_id = ?
    `).all(id);

        // Fetch Tasks linked to the Estimate Roles
        const tasks = db.prepare(`
        SELECT 
            et.id,
            et.description,
            et.days,
            r_sold.name as role_name,
            r_sold.charge_out_rate,
            r_internal.internal_rate
        FROM estimate_tasks et
        JOIN estimate_roles er ON et.estimate_role_id = er.id
        JOIN roles r_sold ON er.role_id = r_sold.id
        JOIN roles r_internal ON er.internal_role_id = r_internal.id
        WHERE et.estimate_id = ?
    `).all(id);

        return NextResponse.json({ ...estimate, estimateRoles, tasks });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
