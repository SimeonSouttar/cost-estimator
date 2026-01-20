'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function Home() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/estimates')
      .then(res => res.json())
      .then(data => {
        setEstimates(data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault(); // Prevent link navigation
    if (!confirm('Are you sure you want to delete this estimate?')) return;

    try {
      const res = await fetch(`/api/estimates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEstimates(estimates.filter(est => est.id !== id));
      } else {
        alert('Failed to delete estimate');
      }
    } catch (err) {
      alert('Error deleting estimate');
    }
  };

  const filtered = estimates.filter(e =>
    e.project_name.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="container" style={{ padding: '4rem 1.5rem' }}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1>Unlock the potential<br />of your estimates</h1>
          <p className="text-muted font-h3 mt-4" style={{ maxWidth: '600px' }}>
            Drive smarter decisions with precision costing. Turn your insights into action and strategies into measurable results.
          </p>
        </div>
        <Link href="/estimate/create">
          <Button variant="primary">Start New Estimate</Button>
        </Link>
      </div>

      <Card className="mb-8">
        <input
          type="text"
          placeholder="Search estimates by project or client name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem' }}
        />
      </Card>

      <div className="grid">
        {loading ? <p>Loading...</p> : filtered.length === 0 ? (
          <p className="text-muted">No estimates found. Start a new one!</p>
        ) : (
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(est => (
              <Link key={est.id} href={`/estimate/${est.id}`}>
                <Card className="hover:border-primary transition-colors flex justify-between items-center group relative overflow-hidden">
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>{est.project_name}</h3>
                    <p className="text-primary font-medium">{est.client_name}</p>
                    <p className="text-muted font-small mt-4">
                      Created: {new Date(est.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-muted font-medium block">Duration</span>
                    <span className="font-h3">{est.duration} {est.duration_unit}</span>
                  </div>

                  {/* Delete Button (appears on hover) */}
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                    <Button
                      variant="danger"
                      onClick={(e) => handleDelete(e, est.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity font-small"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
