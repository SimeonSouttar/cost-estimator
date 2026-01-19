import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { name, is_active } = body;

        const updates = [];
        const args = [];

        if (name !== undefined) {
            updates.push('name = ?');
            args.push(name);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            args.push(is_active);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        args.push(id);
        const sql = `UPDATE rate_cards SET ${updates.join(', ')} WHERE id = ?`;

        await db.execute({ sql, args });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        // Option: Soft delete or check for usage?
        // For now, let's just delete the rate card. 
        // Note: We might want to handle roles attached to it. 
        // If we delete a rate card, should we delete its roles? Yes, usually.
        // But if estimates rely on those roles... estimates copy role data or link?
        // Estimate roles link to `roles` table via `role_id` and `internal_role_id`.
        // If we delete the role from `roles` table, constraint might fail or cascade.
        // `estimate_roles` has FOREIGN KEY(role_id) REFERENCES roles(id).
        // So we can't easily delete roles that are used in estimates unless we soft delete.

        // For this iteration, we will implement a soft delete via the PUT is_active flag mainly.
        // But if the user explicitly calls delete, we try to DELETE.
        // If it fails due to FK, we return error.

        await db.execute({
            sql: 'DELETE FROM rate_cards WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Likely SQLITE_CONSTRAINT error if roles exist and we enforce FKs (we haven't strictly enforced FK on roles->rate_cards yet but we added the column).
        // Actually we didn't add FK constraint in the ALTER TABLE command, so it will delete fine, leaving orphaned roles.
        // Let's delete the roles too to be clean.

        try {
            await db.execute({
                sql: 'DELETE FROM roles WHERE rate_card_id = ?',
                args: [id]
            });
            await db.execute({
                sql: 'DELETE FROM rate_cards WHERE id = ?',
                args: [id]
            });
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ error: 'Cannot delete rate card because it is in use.' }, { status: 400 });
        }
    }
}
