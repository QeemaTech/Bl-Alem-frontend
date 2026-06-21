import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <div>
        <h1>404</h1>
        <h2 style={{ margin: '0 0 8px', fontWeight: 800 }}>الصفحة غير موجودة</h2>
        <p>المسار المطلوب غير متاح داخل منصة بالعِلم.</p>
        <Link to="/"><Button>العودة للرئيسية</Button></Link>
      </div>
    </main>
  );
}
