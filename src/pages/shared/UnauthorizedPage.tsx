import { Link } from 'react-router-dom';
import { ShieldOff } from '@/icons';
import { Button } from '../../components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <main className="error-page">
      <div>
        <div className="empty-state-icon" style={{ margin: '0 auto 20px' }}>
          <ShieldOff size={32} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontWeight: 800 }}>غير مصرح</h2>
        <p>ليست لديك صلاحية للوصول إلى هذه الصفحة.</p>
        <Link to="/"><Button>العودة للوحة المناسبة</Button></Link>
      </div>
    </main>
  );
}
