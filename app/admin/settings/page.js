'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [targetMargin, setTargetMargin] = useState('');
    const [defaultCurrency, setDefaultCurrency] = useState('GBP');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Roles State
    const [roles, setRoles] = useState([]);
    const [roleForm, setRoleForm] = useState({ name: '', internal_rate: '', charge_out_rate: '' });
    const [roleError, setRoleError] = useState(null);

    useEffect(() => {
        fetchSettings();
        fetchRoles();
    }, []);

    const fetchSettings = () => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setTargetMargin(data.targetMargin);
                setDefaultCurrency(data.defaultCurrency);
                setLoading(false);
            });
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles');
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (e) {
            console.error('Failed to fetch roles');
        }
    };

    const saveSettings = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetMargin, defaultCurrency })
            });
            if (res.ok) {
                setMessage('Settings saved successfully');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to save settings');
            }
        } catch (e) {
            setMessage('Error saving settings');
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        setRoleError(null);
        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleForm),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create role');
            }
            setRoleForm({ name: '', internal_rate: '', charge_out_rate: '' });
            fetchRoles();
            setMessage('Role added successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setRoleError(err.message);
        }
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: defaultCurrency,
        }).format(amount);
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SETTINGS CARD */}
                <div className="card h-fit">
                    <h2 className="text-xl font-bold mb-4">Application Settings</h2>
                    <div className="form-group mb-4">
                        <label className="block mb-2 font-medium">Global Currency</label>
                        <p className="text-sm text-gray-500 mb-2">Default currency for all estimates.</p>
                        <select
                            value={defaultCurrency}
                            onChange={e => setDefaultCurrency(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="GBP">GBP (£)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>

                    <div className="form-group mb-4">
                        <label className="block mb-2 font-medium">Target Profit Margin (%)</label>
                        <p className="text-sm text-gray-500 mb-2">Low margin alerts trigger below this %.</p>
                        <input
                            type="number"
                            value={targetMargin}
                            onChange={e => setTargetMargin(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <span className={`text-sm ${message.includes('Success') || message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</span>
                        <button onClick={saveSettings} className="btn btn-primary">Save Settings</button>
                    </div>
                </div>

                {/* ADD ROLE CARD */}
                <div className="card h-fit">
                    <h2 className="text-xl font-bold mb-4">Add New Role</h2>
                    <form onSubmit={handleRoleSubmit}>
                        <div className="form-group mb-4">
                            <label className="block mb-2 font-medium">Role Name</label>
                            <input
                                type="text"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                placeholder="e.g. Senior Developer"
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group mb-4">
                                <label className="block mb-2 font-medium bg-red-50 text-red-800 px-2 py-0.5 rounded w-fit text-sm">Cost Rate ({defaultCurrency})</label>
                                <input
                                    type="number"
                                    value={roleForm.internal_rate}
                                    onChange={(e) => setRoleForm({ ...roleForm, internal_rate: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="block mb-2 font-medium bg-green-50 text-green-800 px-2 py-0.5 rounded w-fit text-sm">Sell Rate ({defaultCurrency})</label>
                                <input
                                    type="number"
                                    value={roleForm.charge_out_rate}
                                    onChange={(e) => setRoleForm({ ...roleForm, charge_out_rate: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        </div>
                        {roleError && <p className="text-red-600 mb-4">{roleError}</p>}
                        <button type="submit" className="btn btn-secondary w-full">Add Role</button>
                    </form>
                </div>
            </div>

            {/* EXISTING ROLES LIST */}
            <div className="card mt-8">
                <h2 className="text-xl font-bold mb-4">Existing Roles</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-600 text-sm">
                                <th className="p-3">Role Name</th>
                                <th className="p-3 text-right">Internal Cost</th>
                                <th className="p-3 text-right">Charge Out (Sell)</th>
                                <th className="p-3 text-right">Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-4 text-center text-gray-500">No roles defined. Add one above.</td>
                                </tr>
                            ) : roles.map((role) => {
                                const margin = role.charge_out_rate > 0
                                    ? ((role.charge_out_rate - role.internal_rate) / role.charge_out_rate * 100).toFixed(0)
                                    : 0;
                                return (
                                    <tr key={role.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-medium">{role.name}</td>
                                        <td className="p-3 text-right text-red-600">{formatCurrency(role.internal_rate)}</td>
                                        <td className="p-3 text-right text-green-600">{formatCurrency(role.charge_out_rate)}</td>
                                        <td className="p-3 text-right font-bold text-blue-600">{margin}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
