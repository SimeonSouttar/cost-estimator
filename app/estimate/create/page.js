'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CURRENCIES = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€'
};

export default function CreateEstimatePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        projectName: '',
        clientName: '',
        type: 'Time and Materials',
        startDate: '',
        duration: '',
        durationUnit: 'weeks',
        currency: 'GBP',
        projectRoles: [], // { roleId, internalRoleId, roleName, internalRoleName, internalRate, chargeRate }
        tasks: [] // { description, projectRoleIndex, days }
    });

    useEffect(() => {
        fetch('/api/roles')
            .then(res => res.json())
            .then(data => {
                setAvailableRoles(data);
                setLoading(false);
            })
            .catch(err => setError('Failed to load roles'));
    }, []);

    const handleNext = () => {
        if (step === 1) {
            if (!formData.projectName || !formData.clientName || !formData.startDate || !formData.duration) {
                alert('Please fill in all required fields');
                return;
            }
        }
        if (step === 2 && formData.projectRoles.length === 0) {
            alert('Please add at least one role');
            return;
        }
        if (step === 3 && formData.tasks.length === 0) {
            alert('Please add at least one task');
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    // --- Step 2 Helpers ---
    // --- Step 2 Helpers ---
    const addProjectRole = (roleId) => {
        const role = availableRoles.find(r => r.id == roleId);
        if (!role) return;

        // Default mapping: Internal Role = Sold Role
        const newProjectRole = {
            roleId: role.id,
            internalRoleId: role.id,
            roleName: role.name,
            // UI Helpers
            internalRate: role.internal_rate,
            chargeRate: role.charge_out_rate
        };

        setFormData({
            ...formData,
            projectRoles: [...formData.projectRoles, newProjectRole]
        });
    };

    const updateProjectRoleMapping = (index, internalRoleId) => {
        const newRoles = [...formData.projectRoles];
        const internalRole = availableRoles.find(r => r.id == internalRoleId);
        if (!internalRole) return;

        newRoles[index].internalRoleId = internalRole.id;
        newRoles[index].internalRate = internalRole.internal_rate;
        setFormData({ ...formData, projectRoles: newRoles });
    };

    const removeProjectRole = (index) => {
        const newRoles = formData.projectRoles.filter((_, i) => i !== index);
        // Remove this index from any tasks and shift others down
        const newTasks = formData.tasks.map(t => ({
            ...t,
            projectRoleIndices: t.projectRoleIndices
                .filter(roleIdx => roleIdx !== index)
                .map(roleIdx => roleIdx > index ? roleIdx - 1 : roleIdx)
        }));

        setFormData({ ...formData, projectRoles: newRoles, tasks: newTasks });
    };

    // --- Step 3 Helpers ---
    const addTask = () => {
        setFormData({
            ...formData,
            tasks: [...formData.tasks, { description: '', projectRoleIndices: [], days: '' }]
        });
    };

    const updateTask = (index, field, value) => {
        const newTasks = [...formData.tasks];
        newTasks[index][field] = value;
        setFormData({ ...formData, tasks: newTasks });
    };

    const toggleTaskRole = (taskIndex, roleIndex) => {
        const newTasks = [...formData.tasks];
        const currentIndices = newTasks[taskIndex].projectRoleIndices || [];

        if (currentIndices.includes(roleIndex)) {
            newTasks[taskIndex].projectRoleIndices = currentIndices.filter(i => i !== roleIndex);
        } else {
            newTasks[taskIndex].projectRoleIndices = [...currentIndices, roleIndex].sort();
        }
        setFormData({ ...formData, tasks: newTasks });
    };

    const removeTask = (index) => {
        const newTasks = formData.tasks.filter((_, i) => i !== index);
        setFormData({ ...formData, tasks: newTasks });
    };

    // --- Calculations ---
    const getWorkingDays = () => {
        const d = parseFloat(formData.duration) || 0;
        if (formData.durationUnit === 'weeks') return d * 5;
        if (formData.durationUnit === 'months') return d * 21; // approx
        return d;
    }

    const calculateCosts = () => {
        let internalTotal = 0;
        let chargeTotal = 0;

        const breakdown = formData.tasks.map(task => {
            const days = parseFloat(task.days) || 0;
            let taskInternal = 0;
            let taskCharge = 0;
            const roleNames = [];

            if (task.projectRoleIndices && task.projectRoleIndices.length > 0) {
                task.projectRoleIndices.forEach(idx => {
                    const roleConfig = formData.projectRoles[idx];
                    if (roleConfig) {
                        const cost = days * roleConfig.internalRate;
                        const sell = days * roleConfig.chargeRate;
                        taskInternal += cost;
                        taskCharge += sell;
                        roleNames.push(roleConfig.roleName);
                    }
                });
            }

            internalTotal += taskInternal;
            chargeTotal += taskCharge;

            const margin = taskCharge > 0 ? ((taskCharge - taskInternal) / taskCharge * 100) : 0;

            return {
                ...task,
                roleNames: roleNames.join(', '),
                internal: taskInternal,
                charge: taskCharge,
                days,
                margin
            };
        });

        const totalMargin = chargeTotal > 0 ? ((chargeTotal - internalTotal) / chargeTotal * 100) : 0;

        return { internalTotal, chargeTotal, breakdown, totalMargin };
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch('/api/estimates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to save estimate');
            router.push('/');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="container mt-4">Loading...</div>;

    const symbol = CURRENCIES[formData.currency] || '£';

    const getStepTitle = (currentStep) => {
        switch (currentStep) {
            case 1: return 'Create Estimate - Project Information';
            case 2: return 'Create Estimate - Add Roles';
            case 3: return 'Create Estimate - Add Tasks';
            case 4: return 'Create Estimate - Confirm';
            default: return 'Create Estimate';
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 0', maxWidth: '900px' }}>
            <h1 className="mb-8">{getStepTitle(step)}</h1>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem' }}>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} style={{
                        height: '4px',
                        flex: 1,
                        backgroundColor: s <= step ? 'var(--primary)' : 'var(--card-border)',
                        borderRadius: '2px'
                    }} />
                ))}
            </div>

            <div className="card">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h3>Project Information</h3>
                        <div className="flex gap-4">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Currency</label>
                                <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                            <div style={{ flex: 2 }}></div>
                        </div>

                        <div className="form-group">
                            <label>Project Name</label>
                            <input type="text" value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Client Name</label>
                            <input type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Project Type</label>
                            <select style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option>Fixed Price</option>
                                <option>Time and Materials</option>
                            </select>
                        </div>
                        <div className="flex gap-4 items-end">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Start Date</label>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Duration</label>
                                <div className="flex gap-2">
                                    <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="10" />
                                    <select value={formData.durationUnit} onChange={e => setFormData({ ...formData, durationUnit: e.target.value })} style={{ width: '100px' }}>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1, paddingBottom: '0.8rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                Approx. {getWorkingDays()} Working Days
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <h3>Project Roles & Rates</h3>
                        <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Define the roles for this project. You can map a sold role to a different internal role for cost calculation.</p>

                        <div className="form-group flex gap-2">
                            <select id="role-picker" style={{ flex: 1 }}>
                                <option value="">Select a role to add...</option>
                                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <button type="button" className="btn btn-secondary" onClick={() => {
                                const select = document.getElementById('role-picker');
                                if (select.value) {
                                    addProjectRole(select.value);
                                    select.value = "";
                                }
                            }}>Add Role</button>
                        </div>

                        <div className="mt-4">
                            {formData.projectRoles.length === 0 ? <p>No roles added yet.</p> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {formData.projectRoles.map((role, index) => (
                                        <div key={index} style={{ border: '1px solid var(--card-border)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 style={{ margin: 0 }}>{role.roleName} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--secondary)' }}>(Sold As)</span></h4>
                                                <button onClick={() => removeProjectRole(index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Remove</button>
                                            </div>
                                            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Internal Mapping</label>
                                                    <select
                                                        value={role.internalRoleId}
                                                        onChange={(e) => updateProjectRoleMapping(index, e.target.value)}
                                                    >
                                                        {availableRoles.map(r => (
                                                            <option key={r.id} value={r.id}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Internal Cost ({symbol}/day)</label>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={`${symbol}${role.internalRate}`}
                                                        style={{ background: 'var(--background)', color: 'var(--secondary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem' }}>Charge Out ({symbol}/day)</label>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={`${symbol}${role.chargeRate}`}
                                                        style={{ background: 'var(--background)', color: 'var(--secondary)' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3>Define Tasks</h3>
                            <button onClick={addTask} className="btn btn-secondary">+ Add Task</button>
                        </div>
                        {formData.tasks.length === 0 ? (
                            <p style={{ color: 'var(--secondary)', textAlign: 'center', padding: '2rem' }}>No tasks added yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {formData.tasks.map((task, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                                        <div style={{ flex: 3 }}>
                                            <label style={{ fontSize: '0.8rem' }}>Description</label>
                                            <input type="text" value={task.description} onChange={e => updateTask(index, 'description', e.target.value)} placeholder="Task description" />
                                        </div>
                                        <div style={{ flex: 3 }}>
                                            <label style={{ fontSize: '0.8rem' }}>Assigned Project Roles</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {formData.projectRoles.map((role, roleIndex) => {
                                                    const isSelected = task.projectRoleIndices && task.projectRoleIndices.includes(roleIndex);
                                                    return (
                                                        <button
                                                            key={roleIndex}
                                                            onClick={() => toggleTaskRole(index, roleIndex)}
                                                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                                                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', opacity: isSelected ? 1 : 0.6 }}
                                                        >
                                                            {role.roleName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {(!task.projectRoleIndices || task.projectRoleIndices.length === 0) && (
                                                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Select at least one role</p>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem' }}>Days</label>
                                            <input type="number" value={task.days} onChange={e => updateTask(index, 'days', e.target.value)} placeholder="0" />
                                        </div>
                                        <div style={{ paddingTop: '1.7rem' }}>
                                            <button onClick={() => removeTask(index)} className="btn btn-danger" style={{ padding: '0.5rem' }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-fade-in">
                        <h3>Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <p style={{ color: 'var(--secondary)' }}>Project</p>
                                <h4>{formData.projectName}</h4>
                                <p style={{ color: 'var(--secondary)' }}>Client</p>
                                <h4>{formData.clientName}</h4>
                            </div>
                            <div>
                                <p style={{ color: 'var(--secondary)' }}>Timeline</p>
                                <h4>{formData.startDate} • {formData.duration} {formData.durationUnit}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>({getWorkingDays()} working days)</p>
                            </div>
                        </div>

                        <h4>Cost Breakdown</h4>
                        <table style={{ marginBottom: '2rem', width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Task</th>
                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Roles</th>
                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Days</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Internal Cost</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Charge Out</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculateCosts().breakdown.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                        <td style={{ padding: '0.5rem' }}>{item.description}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.roleNames}</td>
                                        <td style={{ padding: '0.5rem' }}>{item.days}</td>
                                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{symbol}{item.internal.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{symbol}{item.charge.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', padding: '0.5rem', color: item.margin < 30 ? 'var(--danger)' : 'var(--success)' }}>
                                            {item.margin.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ fontWeight: 'bold', background: 'var(--background)' }}>
                                    <td colSpan={3} style={{ padding: '0.5rem' }}>Total</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--secondary)' }}>{symbol}{calculateCosts().internalTotal.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--success)' }}>{symbol}{calculateCosts().chargeTotal.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{calculateCosts().totalMargin.toFixed(1)}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}

                <div className="flex justify-between mt-8">
                    {step > 1 ? (
                        <button onClick={handleBack} className="btn btn-secondary">Back</button>
                    ) : <div />}

                    {step < 4 ? (
                        <button onClick={handleNext} className="btn btn-primary">Next</button>
                    ) : (
                        <button onClick={handleSubmit} className="btn btn-primary" style={{ background: 'var(--success)' }}>Create Estimate</button>
                    )}
                </div>
            </div>
        </main>
    );
}
