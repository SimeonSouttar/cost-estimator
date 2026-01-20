'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function Home() {
  const [estimates, setEstimates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEstimates();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/estimates?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        setEstimates(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this estimate? This cannot be undone.')) {
      fetch(`/api/estimates/${id}`, { method: 'DELETE' })
        .then(() => fetchEstimates());
    }
  };

  return (
    <main className="container" style={{ padding: '4rem 0' }}>
      {/* Hero / Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1>Unlock the potential<br />of your estimates</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', fontSize: '1.25rem', marginTop: '1rem' }}>
            Drive smarter decisions with precision costing. Turn your insights into action and strategies into measurable results.
          </p>
        </div>
        <Link href="/estimate/create">
          <Button variant="primary">Start New Estimate</Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-8" style={{ padding: '1rem' }}>
        <input
          type="text"
          placeholder="Search estimates by project or client name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem' }}
        />
      </Card>

      {/* List */}
      <div className="grid">
        {loading ? <p>Loading...</p> : estimates.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No estimates found. Start a new one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {estimates.map(est => (
              <Link key={est.id} href={`/estimate/${est.id}`}>
                <Card className="hover:border-primary transition-colors flex justify-between items-center group relative overflow-hidden">
                  <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <h4 style={{ marginBottom: '0.25rem', color: 'var(--text-main)' }}>{est.project_name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{est.client_name} • <span style={{ color: 'var(--secondary)' }}>{est.type}</span></p>
                  </div>
                  <div className="text-right flex items-center gap-6" style={{ marginRight: '4rem', position: 'relative', zIndex: 1 }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</p>
                      <p style={{ fontSize: '0.9rem' }}>{new Date(est.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</p>
                      <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{est.duration} {est.duration_unit}</p>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                    <Button
                      variant="danger"
                      onClick={(e) => handleDelete(e, est.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
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
