import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let sql = 'SELECT * FROM estimates ORDER BY created_at DESC';
        let args = [];

        if (search) {
            sql = 'SELECT * FROM estimates WHERE project_name LIKE ? OR client_name LIKE ? ORDER BY created_at DESC';
            args = [`%${search}%`, `%${search}%`];
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
        const {
            projectName,
            clientName,
            type,
            startDate,
            duration,
            durationUnit,
            currency,
            projectRoles,
            tasks
        } = body;

        if (!projectName || !clientName || !type || !startDate || !duration) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Start Transaction
        const tx = await db.transaction('write');

        try {
            // 1. Insert Estimate
            const estResult = await tx.execute({
                sql: `INSERT INTO estimates (project_name, client_name, type, start_date, duration, duration_unit, currency)
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [projectName, clientName, type, startDate, duration, durationUnit || 'weeks', currency || 'GBP']
            });

            // LibSQL returns lastInsertRowid as string or bigInt sometimes, safe to cast
            const estimateId = estResult.lastInsertRowid.toString();

            // 2. Insert Estimate Roles
            const roleIndexToIdMap = {};
            if (projectRoles && Array.isArray(projectRoles)) {
                for (const [index, role] of projectRoles.entries()) {
                    const roleRs = await tx.execute({
                        sql: `INSERT INTO estimate_roles (estimate_id, role_id, internal_role_id) VALUES (?, ?, ?)`,
                        args: [estimateId, role.roleId, role.internalRoleId || role.roleId]
                    });
                    roleIndexToIdMap[index] = roleRs.lastInsertRowid.toString();
                }
            }

            // 3. Insert Tasks
            if (tasks && Array.isArray(tasks)) {
                for (const task of tasks) {
                    const taskRs = await tx.execute({
                        sql: `INSERT INTO estimate_tasks (estimate_id, description, days) VALUES (?, ?, ?)`,
                        args: [estimateId, task.description, task.days]
                    });
                    const taskId = taskRs.lastInsertRowid.toString();

                    if (task.projectRoleIndices && Array.isArray(task.projectRoleIndices)) {
                        for (const index of task.projectRoleIndices) {
                            const estimateRoleId = roleIndexToIdMap[index];
                            if (!estimateRoleId) throw new Error(`Invalid role reference for task: ${task.description}`);

                            await tx.execute({
                                sql: `INSERT INTO estimate_task_roles (task_id, estimate_role_id) VALUES (?, ?)`,
                                args: [taskId, estimateRoleId]
                            });
                        }
                    }
                }
            }

            await tx.commit();
            return NextResponse.json({ id: estimateId, message: 'Estimate created successfully' }, { status: 201 });

        } catch (txError) {
            await tx.rollback();
            throw txError;
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
