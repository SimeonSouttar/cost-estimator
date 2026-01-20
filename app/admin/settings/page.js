'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function SettingsPage() {
    const [targetMargin, setTargetMargin] = useState('');
    const [defaultCurrency, setDefaultCurrency] = useState('GBP');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Rate Cards State
    const [rateCards, setRateCards] = useState([]);
    const [selectedRateCard, setSelectedRateCard] = useState(null);
    const [newRateCardName, setNewRateCardName] = useState('');

    // Roles State
    const [roles, setRoles] = useState([]);
    const [roleForm, setRoleForm] = useState({ name: '', internal_rate: '', charge_out_rate: '' });
    const [roleError, setRoleError] = useState(null);

    useEffect(() => {
        fetchSettings();
        fetchRateCards();
    }, []);

    useEffect(() => {
        if (selectedRateCard) {
            fetchRoles(selectedRateCard.id);
        } else {
            setRoles([]);
        }
    }, [selectedRateCard]);

    const fetchSettings = () => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setTargetMargin(data.targetMargin);
                setDefaultCurrency(data.defaultCurrency);
                setLoading(false);
            });
    };

    const fetchRateCards = async () => {
        try {
            const res = await fetch('/api/rate-cards');
            if (res.ok) {
                const data = await res.json();
                setRateCards(data);
                // Default to the first one or maintain selection if exists
                if (data.length > 0 && !selectedRateCard) {
                    setSelectedRateCard(data[0]);
                } else if (selectedRateCard) {
                    // Refresh selected object data
                    const updated = data.find(rc => rc.id === selectedRateCard.id);
                    if (updated) setSelectedRateCard(updated);
                }
            }
        } catch (e) {
            console.error('Failed to fetch rate cards');
        }
    };

    const fetchRoles = async (rateCardId) => {
        if (!rateCardId) return;
        try {
            const res = await fetch(`/api/roles?rate_card_id=${rateCardId}`);
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

    const handleCreateRateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/rate-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newRateCardName })
            });
            if (res.ok) {
                const newCard = await res.json();
                await fetchRateCards();
                setSelectedRateCard(newCard); // Switch to new card
                setNewRateCardName('');
                setMessage('Rate Card created');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (e) {
            setMessage('Error creating rate card');
        }
    };

    const toggleRateCardStatus = async (card) => {
        const newStatus = card.is_active ? 0 : 1;
        try {
            await fetch(`/api/rate-cards/${card.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newStatus })
            });
            fetchRateCards();
        } catch (e) {
            console.error('Failed to update status');
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        setRoleError(null);
        if (!selectedRateCard) {
            setRoleError('No Rate Card selected');
            return;
        }

        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...roleForm, rate_card_id: selectedRateCard.id }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create role');
            }
            setRoleForm({ name: '', internal_rate: '', charge_out_rate: '' });
            fetchRoles(selectedRateCard.id);
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
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <h1 className="mb-8">Admin Dashboard</h1>

            {/* RATE CARD MANAGER */}
            <Card className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold m-0">Rate Cards</h2>
                </div>

                <div className="flex gap-6 items-end mb-8">
                    <div className="form-group mb-0 flex-[2]">
                        <label className="block mb-2 font-medium">Select Rate Card to Manage</label>
                        <select
                            value={selectedRateCard?.id || ''}
                            onChange={(e) => {
                                const card = rateCards.find(rc => rc.id == e.target.value);
                                setSelectedRateCard(card);
                            }}
                        >
                            {rateCards.map(rc => (
                                <option key={rc.id} value={rc.id}>
                                    {rc.name} {rc.is_active ? '' : '(Inactive)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        {selectedRateCard && (
                            <Button
                                onClick={() => toggleRateCardStatus(selectedRateCard)}
                                variant={selectedRateCard.is_active ? 'danger' : 'primary'}
                            >
                                {selectedRateCard.is_active ? 'Disable Card' : 'Activate Card'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border-t pt-6" style={{ borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4">Create New Rate Card</h3>
                    <form onSubmit={handleCreateRateCard} className="flex gap-4 items-end">
                        <div className="form-group mb-0 flex-1">
                            <label className="block mb-2 font-medium">Name</label>
                            <input
                                type="text"
                                value={newRateCardName}
                                onChange={e => setNewRateCardName(e.target.value)}
                                placeholder="e.g. 2025 Standard Rates"
                                required
                            />
                        </div>
                        <Button type="submit" variant="secondary">Create Card</Button>
                    </form>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SETTINGS CARD */}
                <Card className="h-fit">
                    <h2 className="text-xl font-bold mb-6">Application Settings</h2>
                    <div className="form-group mb-6">
                        <label className="block mb-2 font-medium">Global Currency</label>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Default currency for all estimates.</p>
                        <select
                            value={defaultCurrency}
                            onChange={e => setDefaultCurrency(e.target.value)}
                        >
                            <option value="GBP">GBP (£)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>

                    <div className="form-group mb-6">
                        <label className="block mb-2 font-medium">Target Profit Margin (%)</label>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Low margin alerts trigger below this %.</p>
                        <input
                            type="number"
                            value={targetMargin}
                            onChange={e => setTargetMargin(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <span className={`text-sm ${message.includes('Success') || message.includes('created') || message.includes('added') ? 'text-green-500' : 'text-red-500'}`}>{message}</span>
                        <Button onClick={saveSettings} variant="primary">Save Settings</Button>
                    </div>
                </Card>

                {/* ADD ROLE CARD */}
                <Card className="h-fit">
                    <h2 className="text-xl font-bold mb-6">Add Role to {selectedRateCard?.name}</h2>
                    <form onSubmit={handleRoleSubmit}>
                        <div className="form-group mb-6">
                            <label className="block mb-2 font-medium">Role Name</label>
                            <input
                                type="text"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                placeholder="e.g. Senior Developer"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group mb-4">
                                <label className="block mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Cost Rate ({defaultCurrency})</label>
                                <input
                                    type="number"
                                    value={roleForm.internal_rate}
                                    onChange={(e) => setRoleForm({ ...roleForm, internal_rate: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="block mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Sell Rate ({defaultCurrency})</label>
                                <input
                                    type="number"
                                    value={roleForm.charge_out_rate}
                                    onChange={(e) => setRoleForm({ ...roleForm, charge_out_rate: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        {roleError && <p className="text-red-500 mb-4">{roleError}</p>}
                        <Button type="submit" disabled={!selectedRateCard} variant="secondary" className="w-full">Add Role</Button>
                    </form>
                </Card>
            </div>

            {/* EXISTING ROLES LIST */}
            <Card className="mt-16">
                <h2 className="text-xl font-bold mb-6">Roles in {selectedRateCard?.name}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                                <th className="p-3 uppercase text-xs tracking-wider">Role Name</th>
                                <th className="p-3 text-right uppercase text-xs tracking-wider">Internal Cost</th>
                                <th className="p-3 text-right uppercase text-xs tracking-wider">Charge Out (Sell)</th>
                                <th className="p-3 text-right uppercase text-xs tracking-wider">Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>No roles found for this rate card.</td>
                                </tr>
                            ) : roles.map((role) => {
                                const margin = role.charge_out_rate > 0
                                    ? ((role.charge_out_rate - role.internal_rate) / role.charge_out_rate * 100).toFixed(0)
                                    : 0;
                                return (
                                    <tr key={role.id} className="border-b last:border-0 hover:bg-slate-800/50 transition-colors" style={{ borderColor: 'var(--card-border)' }}>
                                        <td className="p-3 font-medium">{role.name}</td>
                                        <td className="p-3 text-right text-red-500">{formatCurrency(role.internal_rate)}</td>
                                        <td className="p-3 text-right text-green-500">{formatCurrency(role.charge_out_rate)}</td>
                                        <td className="p-3 text-right font-bold text-primary">{margin}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
