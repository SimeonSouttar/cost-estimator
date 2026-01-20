import Link from 'next/link';

export default function Navbar() {
    return (
        <nav style={{
            background: 'var(--card-bg)',
            borderBottom: '1px solid var(--card-border)',
            padding: '1.25rem 0',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50
        }}>
            <div className="container flex justify-between items-center">
                <Link href="/" style={{
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.03em',
                    textShadow: '0 0 20px rgba(0, 242, 255, 0.3)'
                }}>
                    Cost Estimator
                </Link>
                <div className="flex gap-6">
                    <Link href="/" className="hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider">Dashboard</Link>
                    <Link href="/estimate/create" className="hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider">New Estimate</Link>
                    <Link href="/admin/settings" className="hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider">Settings</Link>
                </div>
            </div>
        </nav>
    );
}
