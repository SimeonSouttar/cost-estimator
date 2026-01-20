'use client';
import { useState, useEffect, use } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function EstimateDetails({ params }) {
    const { id } = use(params);
    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [targetMargin, setTargetMargin] = useState(30);
    const [currencyCode, setCurrencyCode] = useState('GBP');

    useEffect(() => {
        // Fetch Settings first for global currency
        fetch('/api/settings')
            .then(res => res.json())
            .then(settings => {
                setTargetMargin(settings.targetMargin || 30);
                setCurrencyCode(settings.defaultCurrency || 'GBP');
            })
            .catch(console.error);

        fetch(`/api/estimates/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Estimate not found');
                return res.json();
            })
            .then(data => {
                setEstimate(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="container py-10 text-center">Loading...</div>;
    if (error) return <div className="container py-10 text-center text-danger">Error: {error}</div>;
    if (!estimate) return <div className="container py-10 text-center">Estimate not found</div>;

    // Financial Calculations
    let totalRevenue = 0;
    let totalCost = 0;

    estimate.tasks.forEach(task => {
        task.roles.forEach(role => {
            // Days applies to each role on the task
            // Revenue = Charge Rate * Days
            totalRevenue += role.sell_rate * task.days;
            // Cost = Internal Rate * Days
            totalCost += role.cost_rate * task.days;
        });
    });

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const isLowMargin = margin < targetMargin;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    };

    return (
        <div className="min-h-screen">
            <main className="container py-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1>{estimate.project_name}</h1>
                        <p className="text-xl text-primary">{estimate.client_name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted">Duration: {estimate.duration} {estimate.duration_unit}</p>
                        <p className="text-muted">Start: {estimate.start_date}</p>
                    </div>
                </div>

                {/* Financial Summary Table */}
                <Card className="mb-10 max-w-3xl mx-auto">
                    <h2 className="mb-6 border-b pb-4 border-card">Financial Overview</h2>
                    <table className="w-full text-left">
                        <tbody>
                            <tr>
                                <td className="py-4 font-medium text-muted">Total Revenue</td>
                                <td className="py-4 text-right font-bold text-lg text-success">{formatCurrency(totalRevenue)}</td>
                            </tr>
                            <tr>
                                <td className="py-4 font-medium text-muted">Total Cost</td>
                                <td className="py-4 text-right font-medium text-muted">{formatCurrency(totalCost)}</td>
                            </tr>
                            <tr>
                                <td className="py-4 font-medium text-muted">Project Profit</td>
                                <td className="py-4 text-right font-bold text-lg text-primary">{formatCurrency(profit)}</td>
                            </tr>
                            <tr>
                                <td className="py-4 font-medium text-muted">Net Margin</td>
                                <td className="py-4 text-right">
                                    <span className={`font-bold text-lg ${isLowMargin ? 'text-danger' : 'text-secondary'}`}>
                                        {margin.toFixed(1)}%
                                    </span>
                                    {isLowMargin && (
                                        <div className="text-danger font-small mt-1">
                                            Below Target ({targetMargin}%)
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </Card>

                {/* Scope of Work */}
                <div className="flex gap-large" style={{ flexDirection: 'column' }}>
                    <h2 className="font-h2">Scope of Work Breakdown</h2>
                    {estimate.tasks.map((task, index) => (
                        <Card key={index} className="overflow-hidden !p-0">
                            <div className="border-b px-6 py-4 flex justify-between items-center border-card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="font-semibold text-lg m-0">{task.description}</h3>
                                <div className="text-sm font-medium px-3 py-1 rounded border border-card text-muted">
                                    {task.days} Days Total
                                </div>
                            </div>
                            <div className="p-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-card">
                                            <th className="text-left pb-3 font-medium uppercase text-xs tracking-wider">Role</th>
                                            <th className="text-right pb-3 font-medium uppercase text-xs tracking-wider">Day Rate</th>
                                            <th className="text-right pb-3 font-medium uppercase text-xs tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ divideColor: 'var(--card-border)' }}>
                                        {task.roles.map((role, rIndex) => (
                                            <tr key={rIndex}>
                                                <td className="py-3">
                                                    <div className="font-medium text-main">{role.sold_role_name}</div>
                                                    {role.sold_role_name !== role.cost_role_name && (
                                                        <div className="text-xs mt-0.5 text-muted">Internal: {role.cost_role_name}</div>
                                                    )}
                                                </td>
                                                <td className="text-right py-3 text-muted">{formatCurrency(role.sell_rate)}</td>
                                                <td className="text-right py-3 font-medium text-primary">
                                                    {formatCurrency(role.sell_rate * task.days)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
