import Link from 'next/link';

export default function Navbar() {
    return (
        <nav style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', padding: '1rem 0' }}>
            <div className="container flex justify-between items-center">
                <Link href="/" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>
                    Cost Estimator
                </Link>
                <div className="flex gap-4">
                    <Link href="/" className="hover:text-blue-200">Dashboard</Link>
                    <Link href="/estimate/create" className="hover:text-blue-200">New Estimate</Link>
                    <Link href="/admin/settings" className="hover:text-blue-200">Settings</Link>
                    <Link href="/admin/roles" className="hover:text-blue-200">Manage Roles</Link>
                </div>
            </div>
        </nav>
    );
}
