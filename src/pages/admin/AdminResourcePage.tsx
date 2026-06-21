import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';

export default function AdminResourcePage() {
  const { resource = 'users' } = useParams();

  return (
    <div className="page-grid">
      <PageHeader
        title="غير متوفر"
        subtitle={`القسم "${resource}" غير متاح أو تم نقله إلى صفحة مخصصة.`}
      />
    </div>
  );
}
