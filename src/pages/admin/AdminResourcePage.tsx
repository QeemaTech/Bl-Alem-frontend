import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';

export default function AdminResourcePage() {
  const { resource = 'users' } = useParams();
  const { t } = useTranslation('dashboard');

  return (
    <div className="page-grid">
      <PageHeader
        title={t('admin.resourceUnavailable.title')}
        subtitle={t('admin.resourceUnavailable.subtitle', { resource })}
      />
    </div>
  );
}
