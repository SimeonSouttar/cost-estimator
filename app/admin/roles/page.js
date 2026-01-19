'use client';

import { useState, useEffect } from 'react';

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({ name: '', internal_rate: '', charge_out_rate: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles');
            if (!res.ok) throw new Error('Failed to fetch roles');
            const data = await res.json();
            setRoles(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create role');
            }
            setFormData({ name: '', internal_rate: '', charge_out_rate: '' });
            fetchRoles();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 0' }}>
            <div className="flex justify-between items-center mb-8">
                <h1>Manage Roles</h1>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Add Role Form */}
                <section>
                    <div className="card">
                        <h3>Add New Role</h3>
                        <form onSubmit={handleSubmit} className="mt-4">
                            <div className="form-group">
                                <label>Role Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Senior Developer"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Internal Rate ($/day)</label>
                                <input
                                    type="number"
                                    value={formData.internal_rate}
                                    onChange={(e) => setFormData({ ...formData, internal_rate: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Charge Out Rate ($/day)</label>
                                <input
                                    type="number"
                                    value={formData.charge_out_rate}
                                    onChange={(e) => setFormData({ ...formData, charge_out_rate: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Role</button>
                        </form>
                    </div>
                </section>

                {/* Roles List */}
                <section>
                    <div className="card">
                        <h3>Existing Roles</h3>
                        <div className="mt-4">
                            {loading ? (
                                <p>Loading...</p>
                            ) : roles.length === 0 ? (
                                <p style={{ color: 'var(--secondary)' }}>No roles defined yet.</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Internal Rate</th>
                                            <th>Charge Out Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.map((role) => (
                                            <tr key={role.id}>
                                                <td style={{ fontWeight: 500 }}>{role.name}</td>
                                                <td>${role.internal_rate}</td>
                                                <td>${role.charge_out_rate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
