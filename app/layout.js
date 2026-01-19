import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Consultancy Cost Estimator',
  description: 'Generate accurate project estimates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
