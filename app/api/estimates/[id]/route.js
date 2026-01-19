import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Next.js App Router dynamic route handler
// Next.js App Router dynamic route handler
export async function GET(request, { params }) {
    // Await params as they are async in latest Next.js versions
    const { id } = await params;

    try {
        const estRs = await db.execute({
            sql: 'SELECT * FROM estimates WHERE id = ?',
            args: [id]
        });
        const estimate = estRs.rows[0];

        if (!estimate) {
            return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
        }

        // Fetch tasks
        const tasksRs = await db.execute({
            sql: `SELECT id, description, days 
                  FROM estimate_tasks 
                  WHERE estimate_id = ?`,
            args: [id]
        });
        const tasks = tasksRs.rows;

        // Fetch task roles
        const taskRolesRs = await db.execute({
            sql: `SELECT 
                    etr.task_id,
                    sold_role.name as sold_role_name,
                    sold_role.charge_out_rate as sell_rate,
                    cost_role.name as cost_role_name,
                    cost_role.internal_rate as cost_rate
                FROM estimate_task_roles etr
                JOIN estimate_roles er ON etr.estimate_role_id = er.id
                JOIN roles sold_role ON er.role_id = sold_role.id
                JOIN roles cost_role ON er.internal_role_id = cost_role.id
                WHERE etr.task_id IN (SELECT id FROM estimate_tasks WHERE estimate_id = ?)`,
            args: [id]
        });
        const taskRoles = taskRolesRs.rows;

        // Group roles by task
        const tasksWithRoles = tasks.map(task => {
            const roles = taskRoles.filter(tr => tr.task_id === task.id);
            return { ...task, roles };
        });

        return NextResponse.json({ ...estimate, tasks: tasksWithRoles });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
