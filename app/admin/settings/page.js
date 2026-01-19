'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [targetMargin, setTargetMargin] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setTargetMargin(data.targetMargin);
                setLoading(false);
            });
    }, []);

    const saveSettings = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetMargin })
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

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
            <h1 className="text-2xl font-bold mb-6">Application Settings</h1>

            <div className="card">
                <div className="form-group mb-4">
                    <label className="block mb-2 font-medium">Target Profit Margin (%)</label>
                    <p className="text-sm text-gray-500 mb-2">Estimates with a margin below this value will be highlighted in red.</p>
                    <input
                        type="number"
                        value={targetMargin}
                        onChange={e => setTargetMargin(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div className="flex justify-between items-center mt-6">
                    <span className={`text-sm ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>{message}</span>
                    <button onClick={saveSettings} className="btn btn-primary">Save Settings</button>
                </div>
            </div>
        </div>
    );
}
