import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, DollarSign, Edit, Layers, Plus, Send, Star, Tags, Trash2, Users,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { formatNumber } from '../../utils/localeFormat';
import { localizedCategoryName, localizedCourseTitle } from '../../utils/localizedContent';
import { mediaUrl } from '../../utils/mediaUrl';

const courseVariant = (status: string) => {
  if (status === 'PUBLISHED') return 'published' as const;
  if (status === 'PENDING_REVIEW') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  return 'default' as const;
};

const canSubmitForReview = (status: string) => status === 'DRAFT' || status === 'REJECTED';

export default function InstructorCoursesPage() {
  const { t, i18n } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tab, setTab] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const tabs = useMemo(() => [
    { id: 'all', label: t('tabs.all') },
    { id: 'DRAFT', label: t('tabs.draft') },
    { id: 'PENDING_REVIEW', label: t('tabs.pendingReview') },
    { id: 'PUBLISHED', label: t('tabs.published') },
    { id: 'REJECTED', label: t('tabs.rejected') },
    { id: 'SUSPENDED', label: t('tabs.suspended') },
  ], [t]);

  const load = () => {
    setLoading(true);
    instructorApi.courses({ status: tab }).then(setCourses).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const tabLabel = useMemo(
    () => tabs.find((item) => item.id === tab)?.label || t('tabs.all'),
    [tab, tabs, t],
  );

  const submit = async (id: number) => {
    setSubmittingId(id);
    try {
      await instructorApi.submitCourseReview(id);
      showToast(t('toast.submitted'), 'success');
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.submitFailed');
      showToast(message, 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    await instructorApi.deleteCourse(deleteId);
    showToast(t('toast.deleted'), 'success');
    setDeleteId(null);
    await load();
  };

  return (
    <div className="page-grid instructor-courses-page">
      <div className="reports-header instructor-courses-header">
        <PageHeader
          title={t('management.title')}
          subtitle={t('management.subtitle')}
        />
        <div className="reports-header-actions">
          <Link to="/instructor/courses/create">
            <Button icon={<Plus size={18} />}>{t('management.addCourse')}</Button>
          </Link>
        </div>
      </div>

      <Card className="instructor-courses-toolbar">
        <div className="instructor-courses-toolbar-tabs">
          <Tabs activeTab={tab} onChange={setTab} tabs={tabs} variant="pills" />
        </div>
        <span className="instructor-courses-count muted-count">
          {loading ? '…' : (
            tab !== 'all'
              ? t('countFiltered', { count: formatNumber(courses.length, {}, lang), status: tabLabel })
              : t('count', { count: formatNumber(courses.length, {}, lang) })
          )}
        </span>
      </Card>

      {loading ? (
        <div className="instructor-courses-list" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="instructor-course-card instructor-course-card-skeleton">
              <LoadingSkeleton variant="block" />
            </Card>
          ))}
        </div>
      ) : courses.length ? (
        <div className="instructor-courses-list">
          {courses.map((course) => {
            const cover = mediaUrl(course.coverImage);
            const reviewable = canSubmitForReview(course.status);
            return (
              <Card key={course.id} className="instructor-course-card">
                <div className="instructor-course-card-thumb" aria-hidden="true">
                  {cover ? (
                    <img src={cover} alt="" />
                  ) : (
                    <span className="instructor-course-card-thumb-fallback">
                      <BookOpen size={28} />
                    </span>
                  )}
                </div>

                <div className="instructor-course-card-body">
                  <div className="instructor-course-card-head">
                    <div className="instructor-course-card-title-row">
                      <Badge variant={courseVariant(course.status)} className="instructor-course-status-badge">
                        {t(`status.${course.status}`, { defaultValue: course.status })}
                      </Badge>
                      <h3 className="instructor-course-card-title">{localizedCourseTitle(course, lang)}</h3>
                    </div>
                  </div>

                  <div className="instructor-course-card-meta">
                    {course.category ? (
                      <span className="instructor-course-meta-item">
                        <Tags size={15} aria-hidden />
                        {localizedCategoryName(course.category, lang)}
                      </span>
                    ) : null}
                    <span className="instructor-course-meta-item">
                      <DollarSign size={15} aria-hidden />
                      {formatNumber(Number(course.price || 0), {}, lang)}
                      {' '}
                      {tc('currency.egp')}
                    </span>
                    <span className="instructor-course-meta-item">
                      <Users size={15} aria-hidden />
                      {formatNumber(Number(course._count?.enrollments || 0), {}, lang)}
                      {' '}
                      {tc('units.student')}
                    </span>
                    <span className="instructor-course-meta-item">
                      <Star size={15} aria-hidden />
                      {Number(course.ratingAverage || 0).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="instructor-course-card-actions">
                  <Link to={`/instructor/courses/${course.id}/edit`}>
                    <Button variant="outline" size="sm" icon={<Edit size={16} />}>
                      {t('actions.edit')}
                    </Button>
                  </Link>
                  <Link to={`/instructor/courses/${course.id}/builder`}>
                    <Button variant="outline" size="sm" icon={<Layers size={16} />}>
                      {t('actions.content')}
                    </Button>
                  </Link>
                  {reviewable ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Send size={16} />}
                      loading={submittingId === course.id}
                      onClick={() => submit(course.id)}
                    >
                      {t('actions.submitReview')}
                    </Button>
                  ) : null}
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => setDeleteId(course.id)}
                  >
                    {t('actions.delete')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="instructor-courses-empty">
          <EmptyState
            title={t('empty.title')}
            description={
              tab === 'all'
                ? t('empty.allDesc')
                : t('empty.filteredDesc', { status: tabLabel })
            }
            actionLabel={t('management.addCourse')}
            onAction={() => navigate('/instructor/courses/create')}
          />
        </Card>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message')}
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
