'use client';
import { useState, useEffect, use } from 'react';


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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!estimate) return <div>Estimate not found</div>;

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
        <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto py-10 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{estimate.project_name}</h1>
                        <p className="text-gray-600">{estimate.client_name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Duration: {estimate.duration} {estimate.duration_unit}</p>
                        <p className="text-sm text-gray-500">Start: {estimate.start_date}</p>
                    </div>
                </div>

                {/* Financial Summary Table - Vertical Layout */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-10 max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Financial Overview</h2>
                    <table className="w-full text-left">
                        <tbody>
                            <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="py-4 font-medium text-gray-600">Total Revenue</td>
                                <td className="py-4 text-right font-bold text-gray-900 text-lg">{formatCurrency(totalRevenue)}</td>
                            </tr>
                            <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="py-4 font-medium text-gray-600">Total Cost</td>
                                <td className="py-4 text-right font-medium text-gray-700">{formatCurrency(totalCost)}</td>
                            </tr>
                            <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="py-4 font-medium text-gray-600">Project Profit</td>
                                <td className="py-4 text-right font-bold text-green-600 text-lg">{formatCurrency(profit)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 font-medium text-gray-600">Net Margin</td>
                                <td className="py-4 text-right">
                                    <span className={`font-bold text-lg ${isLowMargin ? 'text-red-600' : 'text-blue-600'}`}>
                                        {margin.toFixed(1)}%
                                    </span>
                                    {isLowMargin && (
                                        <div className="text-xs text-red-500 mt-1">
                                            Below Target ({targetMargin}%)
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Scope of Work */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-gray-800">Scope of Work Breakdown</h2>
                    {estimate.tasks.map((task, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-gray-900">{task.description}</h3>
                                <div className="text-sm font-medium bg-white text-gray-600 px-3 py-1 rounded border border-gray-200 shadow-sm">
                                    {task.days} Days Total
                                </div>
                            </div>
                            <div className="p-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-500 border-b">
                                            <th className="text-left pb-3 font-medium uppercase text-xs tracking-wider">Role</th>
                                            <th className="text-right pb-3 font-medium uppercase text-xs tracking-wider">Day Rate</th>
                                            <th className="text-right pb-3 font-medium uppercase text-xs tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {task.roles.map((role, rIndex) => (
                                            <tr key={rIndex} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3">
                                                    <div className="font-medium text-gray-900">{role.sold_role_name}</div>
                                                    {role.sold_role_name !== role.cost_role_name && (
                                                        <div className="text-xs text-gray-400 mt-0.5">Internal: {role.cost_role_name}</div>
                                                    )}
                                                </td>
                                                <td className="text-right py-3 text-gray-600">{formatCurrency(role.sell_rate)}</td>
                                                <td className="text-right py-3 font-medium text-gray-900">
                                                    {formatCurrency(role.sell_rate * task.days)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
