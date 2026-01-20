'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

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
        projectRoles: [],
        tasks: []
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

    const addProjectRole = (roleId) => {
        const role = availableRoles.find(r => r.id == roleId);
        if (!role) return;

        const newProjectRole = {
            roleId: role.id,
            internalRoleId: role.id,
            roleName: role.name,
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
        const newTasks = formData.tasks.map(t => ({
            ...t,
            projectRoleIndices: t.projectRoleIndices
                .filter(roleIdx => roleIdx !== index)
                .map(roleIdx => roleIdx > index ? roleIdx - 1 : roleIdx)
        }));

        setFormData({ ...formData, projectRoles: newRoles, tasks: newTasks });
    };

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

    const getWorkingDays = () => {
        const d = parseFloat(formData.duration) || 0;
        if (formData.durationUnit === 'weeks') return d * 5;
        if (formData.durationUnit === 'months') return d * 21;
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

    if (loading) return <div className="container mt-4 text-center">Loading...</div>;

    const symbol = CURRENCIES[formData.currency] || '£';

    const getStepTitle = (currentStep) => {
        switch (currentStep) {
            case 1: return 'Project Information';
            case 2: return 'Add Roles';
            case 3: return 'Add Tasks';
            case 4: return 'Review & Confirm';
            default: return 'Create Estimate';
        }
    };

    return (
        <main className="container" style={{ padding: '4rem 0', maxWidth: '1000px' }}>
            <h1 className="mb-8 text-center">{getStepTitle(step)}</h1>

            {/* Progress Bar */}
            <div className="flex gap-small mb-8 items-center justify-center">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex-1 max-w-[100px] h-1 rounded-full relative" style={{ background: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
                        <div style={{
                            position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)',
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: s <= step ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            boxShadow: s <= step ? '0 0 10px var(--primary)' : 'none'
                        }} />
                    </div>
                ))}
            </div>

            <Card>
                {step === 1 && (
                    <div className="animate-fade-in flex flex-col gap-6">
                        <div className="flex gap-6">
                            <div className="form-group flex-1">
                                <label>Currency</label>
                                <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                            <div className="flex-[2]"></div>
                        </div>

                        <div className="form-group">
                            <label>Project Name</label>
                            <input type="text" value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} placeholder="e.g. Next-Gen Transformation" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="form-group">
                                <label>Client Name</label>
                                <input type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="form-group">
                                <label>Project Type</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option>Time and Materials</option>
                                    <option>Fixed Price</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 items-start">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <div className="flex gap-2">
                                    <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="10" />
                                    <select value={formData.durationUnit} onChange={e => setFormData({ ...formData, durationUnit: e.target.value })} style={{ width: '120px' }}>
                                        <option value="weeks">Weeks</option>
                                        <option value="days">Days</option>
                                        <option value="months">Months</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group flex justify-center items-center h-full pt-6">
                                <span className="text-secondary font-small" style={{ fontWeight: 600 }}>
                                    Target: {getWorkingDays()} Working Days
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3>Project Roles</h3>
                                <p className="text-muted">Map sold roles to internal resources.</p>
                            </div>
                        </div>

                        <div className="form-group flex gap-2 p-4 rounded-xl border-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <select id="role-picker" style={{ flex: 1, background: 'transparent', border: 'none' }}>
                                <option value="">Select a role to add...</option>
                                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <Button variant="secondary" onClick={() => {
                                const select = document.getElementById('role-picker');
                                if (select.value) {
                                    addProjectRole(select.value);
                                    select.value = "";
                                }
                            }}>+ Add Role</Button>
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                            {formData.projectRoles.length === 0 ? <p className="text-center text-muted">No roles added yet.</p> : (
                                formData.projectRoles.map((role, index) => (
                                    <Card key={index} className="!p-4 border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 style={{ margin: 0, fontSize: '1.25rem' }}>{role.roleName}</h4>
                                            <Button variant="danger" onClick={() => removeProjectRole(index)} className="!p-2 text-tiny">Remove</Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <label>Internal Resource Mapping</label>
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
                                                <label>Internal Cost ({symbol}/day)</label>
                                                <input type="text" readOnly value={`${symbol}${role.internalRate}`} className="bg-transparent border-none text-muted" />
                                            </div>
                                            <div>
                                                <label>Charge Out ({symbol}/day)</label>
                                                <input type="text" readOnly value={`${symbol}${role.chargeRate}`} className="bg-transparent border-none text-muted" />
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3>Scope & Tasks</h3>
                            <Button variant="secondary" onClick={addTask}>+ Add Task</Button>
                        </div>
                        {formData.tasks.length === 0 ? (
                            <p className="text-center py-8 text-muted border-2 border-dashed border-card rounded-main">No tasks defined. Add one to get started.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {formData.tasks.map((task, index) => (
                                    <div key={index} className="p-6 rounded-main bg-slate-900/50 border border-slate-700/50 relative group">
                                        <div className="flex gap-6 items-start">
                                            <div className="flex-[2]">
                                                <label>Task Description</label>
                                                <input
                                                    type="text"
                                                    value={task.description}
                                                    onChange={e => updateTask(index, 'description', e.target.value)}
                                                    placeholder="Describe the activity..."
                                                    className="font-medium"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label>Effort (Days)</label>
                                                <input
                                                    type="number"
                                                    value={task.days}
                                                    onChange={e => updateTask(index, 'days', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <Button variant="danger" onClick={() => removeTask(index)} className="absolute -top-3 -right-3 rounded-full w-8 h-8 !p-0 shadow-lg">✕</Button>
                                        </div>

                                        <div className="mt-4">
                                            <label>Assigned Roles</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.projectRoles.map((role, roleIndex) => {
                                                    const isSelected = task.projectRoleIndices && task.projectRoleIndices.includes(roleIndex);
                                                    return (
                                                        <button
                                                            key={roleIndex}
                                                            onClick={() => toggleTaskRole(index, roleIndex)}
                                                            className={`px-3 py-1 rounded-full font-tiny font-medium transition-all ${isSelected ? 'bg-primary text-black shadow-glow' : 'bg-slate-800 text-muted hover:bg-slate-700'}`}
                                                        >
                                                            {role.roleName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {(!task.projectRoleIndices || task.projectRoleIndices.length === 0) && (
                                                <p className="text-danger font-tiny mt-2">⚠ Assignment required</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-fade-in">
                        <h3 className="mb-6">Estimate Summary</h3>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <Card className="!bg-slate-800/50">
                                <label>Project Details</label>
                                <h4 className="mt-2 text-white">{formData.projectName}</h4>
                                <p className="text-primary">{formData.clientName}</p>
                            </Card>
                            <Card className="!bg-slate-800/50">
                                <label>Timeline</label>
                                <h4 className="mt-2 text-white">{formData.duration} {formData.durationUnit}</h4>
                                <p className="text-secondary">Starts {new Date(formData.startDate).toLocaleDateString()}</p>
                            </Card>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th>Task</th>
                                        <th>Roles</th>
                                        <th className="text-right">Time</th>
                                        <th className="text-right">Cost</th>
                                        <th className="text-right">Revenue</th>
                                        <th className="text-right">Margin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculateCosts().breakdown.map((item, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{item.description}</td>
                                            <td className="font-small text-muted">{item.roleNames}</td>
                                            <td className="text-right">{item.days}d</td>
                                            <td className="text-right text-muted">{symbol}{item.internal.toLocaleString()}</td>
                                            <td className="text-right font-medium">{symbol}{item.charge.toLocaleString()}</td>
                                            <td className="text-right font-bold" style={{ color: item.margin < 30 ? 'var(--danger)' : 'var(--secondary)' }}>
                                                {item.margin.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-800/50 font-h3">
                                        <td colSpan={3} className="font-bold">Total Project Value</td>
                                        <td className="text-right text-muted font-body">{symbol}{calculateCosts().internalTotal.toLocaleString()}</td>
                                        <td className="text-right text-success font-bold font-h3 drop-shadow-lg">{symbol}{calculateCosts().chargeTotal.toLocaleString()}</td>
                                        <td className="text-right text-primary font-bold">{calculateCosts().totalMargin.toFixed(1)}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {error && <div className="p-4 mt-6 bg-red-500/10 border border-red-500/50 rounded-xl text-danger text-center">{error}</div>}

                <div className="flex justify-between mt-10 pt-6 border-t border-card">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={handleBack}>← Back</Button>
                    ) : <div />}

                    {step < 4 ? (
                        <Button variant="primary" onClick={handleNext}>Next Step →</Button>
                    ) : (
                        <Button variant="primary" onClick={handleSubmit} className="!bg-green-500 hover:!bg-green-400 !shadow-green-500/50">Create Estimate</Button>
                    )}
                </div>
            </Card>
        </main>
    );
}
