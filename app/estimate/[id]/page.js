'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ViewEstimate() {
    const params = useParams();
    const id = params.id;

    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [targetMargin, setTargetMargin] = useState(30);

    useEffect(() => {
        if (id) fetchEstimate(id);
        fetchSettings();
    }, [id]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setTargetMargin(parseFloat(data.targetMargin));
            }
        } catch (e) {
            console.error('Failed to load settings');
        }
    };

    const fetchEstimate = async (estId) => {
        try {
            const res = await fetch(`/api/estimates/${estId}`);
            if (!res.ok) throw new Error('Failed to fetch estimate');
            const data = await res.json();
            setEstimate(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container p-8">Loading...</div>;
    if (error) return <div className="container p-8 text-red-500">Error: {error}</div>;
    if (!estimate) return <div className="container p-8">Estimate not found</div>;

    // Calculate Totals
    // Tasks now have an array of roles. We need to sum up costs for all roles.
    let totalCost = 0;
    let totalSell = 0;

    estimate.tasks.forEach(t => {
        // t.days applies to all roles
        t.roles.forEach(role => {
            totalCost += t.days * role.cost_rate;
            totalSell += t.days * role.sell_rate;
        });
    });

    const margin = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

    return (
        <main className="container" style={{ padding: '2rem 0' }}>
            <div className="mb-4">
                <Link href="/" className="text-blue-500 hover:underline">← Back to Dashboard</Link>
            </div>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{estimate.project_name}</h1>
                    <p className="text-gray-600 text-xl">{estimate.client_name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Type: {estimate.type}</span>
                        <span>•</span>
                        <span>Start: {new Date(estimate.start_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Duration: {estimate.duration} {estimate.duration_unit}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Currency</div>
                    <div className="font-bold">{estimate.currency}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Financial Summary */}
                <div className="card">
                    <h3 className="mb-4 text-xl font-bold">Financial Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Total Revenue (Sell)</span>
                            <span className="font-bold text-green-700">{estimate.currency} {totalSell.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between p-2">
                            <span>Total Cost</span>
                            <span className="font-bold text-red-700">{estimate.currency} {totalCost.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between p-2 border-t mt-2">
                            <span>Net Margin</span>
                            <span className="font-bold">{estimate.currency} {(totalSell - totalCost).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-blue-50 rounded mt-2">
                            <span>Margin % (Target: {targetMargin}%)</span>
                            <span className={`font-bold ${margin < targetMargin ? 'text-red-600' : 'text-blue-700'}`}>{margin.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Tasks Breakdown */}
                <div className="card">
                    <h3 className="mb-4 text-xl font-bold">Scope of Work</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {estimate.tasks.map((task, i) => (
                            <div key={i} className="border-b pb-2 last:border-0">
                                <div className="font-medium">{task.description}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {task.roles.map((role, rIndex) => (
                                        <div key={rIndex} className="flex justify-between mb-1">
                                            <span>{role.sold_role_name} ({task.days} days)</span>
                                            {role.sold_role_name !== role.cost_role_name && (
                                                <span className="text-amber-600 text-xs bg-amber-50 px-1 rounded">Mapped to {role.cost_role_name}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
