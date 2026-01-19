'use client';
import { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';

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
            <Navbar />
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

                {/* Financial Summary Table */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 font-medium text-gray-600">Total Revenue</th>
                                    <th className="p-3 font-medium text-gray-600">Total Cost</th>
                                    <th className="p-3 font-medium text-gray-600">project Profit</th>
                                    <th className="p-3 font-medium text-gray-600">Margin %</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-3 text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</td>
                                    <td className="p-3 text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</td>
                                    <td className="p-3 text-lg font-bold text-green-600">{formatCurrency(profit)}</td>
                                    <td className={`p-3 text-lg font-bold ${isLowMargin ? 'text-red-600' : 'text-blue-600'}`}>
                                        {margin.toFixed(1)}%
                                        {isLowMargin && <span className="text-xs ml-2 bg-red-100 text-red-800 px-2 py-1 rounded">Below Target ({targetMargin}%)</span>}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Scope of Work */}
                <div className="bg-gray-100 rounded-lg p-6 mt-8">
                    <h2 className="text-xl font-semibold mb-6">Scope of Work Breakdown</h2>
                    <div className="space-y-6">
                        {estimate.tasks.map((task, index) => (
                            <div key={index} className="bg-white rounded shadow-sm overflow-hidden">
                                <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-800">{task.description}</h3>
                                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                        {task.days} Days
                                    </span>
                                </div>
                                <div className="p-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-500 border-b">
                                                <th className="text-left pb-2">Role</th>
                                                <th className="text-right pb-2">Rate ({currencyCode})</th>
                                                <th className="text-right pb-2">Cost Rate</th>
                                                <th className="text-right pb-2">Total Rev</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {task.roles.map((role, rIndex) => (
                                                <tr key={rIndex} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="py-2">
                                                        <div className="font-medium">{role.sold_role_name}</div>
                                                        {role.sold_role_name !== role.cost_role_name && (
                                                            <div className="text-xs text-gray-500">Mapped to: {role.cost_role_name}</div>
                                                        )}
                                                    </td>
                                                    <td className="text-right py-2">{formatCurrency(role.sell_rate)}</td>
                                                    <td className="text-right py-2 text-gray-500">{formatCurrency(role.cost_rate)}</td>
                                                    <td className="text-right py-2 font-medium">
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
                </div>
            </main>
        </div>
    );
}
