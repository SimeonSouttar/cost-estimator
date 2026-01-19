'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  return (
    <main className="container" style={{ padding: '2rem 0' }}>
      {/* Hero / Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1>Recent Estimates</h1>
          <p style={{ color: 'var(--secondary)' }}>Manage your consultancy projects</p>
        </div>
        <Link href="/estimate/create" className="btn btn-primary">Start New Estimate</Link>
      </div>

      {/* Search */}
      <div className="card mb-8">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Search estimates by project or client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="grid">
        {loading ? <p>Loading...</p> : estimates.length === 0 ? (
          <p style={{ color: 'var(--secondary)' }}>No estimates found. Start a new one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {estimates.map(est => (
              <Link key={est.id} href={`/estimate/${est.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                  <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>{est.project_name}</h4>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>{est.client_name} • {est.type}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Start: {new Date(est.start_date).toLocaleDateString()}</p>
                    <p style={{ fontWeight: 'bold' }}>{est.duration} {est.duration_unit}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
