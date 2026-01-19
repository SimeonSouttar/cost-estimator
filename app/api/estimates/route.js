import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let query = 'SELECT * FROM estimates ORDER BY created_at DESC';
        let params = [];

        if (search) {
            query = 'SELECT * FROM estimates WHERE project_name LIKE ? OR client_name LIKE ? ORDER BY created_at DESC';
            params = [`%${search}%`, `%${search}%`];
        }

        const estimates = db.prepare(query).all(...params);
        return NextResponse.json(estimates);
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
            projectRoles, // Array of { roleId, internalRoleId }
            tasks // Array of { description, projectRoleIndex, days } 
            // Note: projectRoleIndex is the index in the projectRoles array sent from client
        } = body;

        if (!projectName || !clientName || !type || !startDate || !duration) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const insertEstimate = db.transaction(() => {
            // 1. Insert Estimate
            const stmt = db.prepare(`
            INSERT INTO estimates (project_name, client_name, type, start_date, duration, duration_unit, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
            const info = stmt.run(projectName, clientName, type, startDate, duration, durationUnit || 'weeks', currency || 'GBP');
            const estimateId = info.lastInsertRowid;

            // 2. Insert Estimate Roles and keep track of their new IDs
            const roleStmt = db.prepare(`
            INSERT INTO estimate_roles (estimate_id, role_id, internal_role_id)
            VALUES (?, ?, ?)
        `);

            // Map created for linking tasks to the specific estimate_role entry
            const roleIndexToIdMap = {};

            if (projectRoles && Array.isArray(projectRoles)) {
                projectRoles.forEach((role, index) => {
                    const result = roleStmt.run(estimateId, role.roleId, role.internalRoleId || role.roleId);
                    roleIndexToIdMap[index] = result.lastInsertRowid;
                });
            }

            // 3. Insert Tasks
            const taskStmt = db.prepare(`
                INSERT INTO estimate_tasks (estimate_id, description, days)
                VALUES (?, ?, ?)
            `);

            const taskRoleStmt = db.prepare(`
                INSERT INTO estimate_task_roles (task_id, estimate_role_id)
                VALUES (?, ?)
            `);

            if (tasks && Array.isArray(tasks)) {
                for (const task of tasks) {
                    const info = taskStmt.run(estimateId, task.description, task.days);
                    const taskId = info.lastInsertRowid;

                    // task.roleIndices is an array of indices into projectRoles array
                    // We must map them to estimateRoleIds
                    if (task.projectRoleIndices && Array.isArray(task.projectRoleIndices)) {
                        for (const index of task.projectRoleIndices) {
                            const estimateRoleId = roleIndexToIdMap[index];
                            if (!estimateRoleId) {
                                throw new Error(`Invalid role reference for task: ${task.description}`);
                            }
                            taskRoleStmt.run(taskId, estimateRoleId);
                        }
                    }
                }
            }
            return estimateId;
        });

        const newEstimateId = insertEstimate();
        return NextResponse.json({ id: newEstimateId, message: 'Estimate created successfully' }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
