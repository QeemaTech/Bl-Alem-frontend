import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, BookOpen, Check, Save, Search } from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminLearningPathLabels } from '../../hooks/useAdminLearningPathLabels';
import {
  localizedCategoryName,
  localizedCourseTitle,
  localizedPathTitle,
} from '../../utils/localizedContent';

const emptyForm = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  coverImage: '',
  status: 'ACTIVE',
};

type PathCourseLink = {
  id: number;
  courseId: number;
  order: number;
  course?: {
    id: number;
    titleAr: string;
    titleEn?: string;
    instructor?: { fullName?: string };
    category?: { nameAr?: string; nameEn?: string };
  };
};

export default function AdminLearningPathEditorPage() {
  const { t, i18n } = useTranslation(['learningPaths', 'common']);
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { statusLabels } = useAdminLearningPathLabels();

  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingCourses, setSavingCourses] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pathMeta, setPathMeta] = useState({ titleAr: '', titleEn: '' });
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedLinks, setSelectedLinks] = useState<PathCourseLink[]>([]);
  const [pathId, setPathId] = useState<number | null>(isNew ? null : Number(id));

  const loadCourses = useCallback(async () => {
    const courses = await adminApi.courses({ status: 'PUBLISHED' });
    setAllCourses(courses);
  }, []);

  const loadPath = useCallback(async (pathIdValue: number) => {
    const [path, courses] = await Promise.all([
      adminApi.learningPath(pathIdValue),
      adminApi.courses({ status: 'PUBLISHED' }),
    ]);
    setForm({
      titleAr: path.titleAr || '',
      titleEn: path.titleEn || '',
      descriptionAr: path.descriptionAr || '',
      coverImage: path.coverImage || '',
      status: path.status || 'ACTIVE',
    });
    setPathMeta({ titleAr: path.titleAr || '', titleEn: path.titleEn || '' });
    setAllCourses(courses);
    const sorted = [...(path.courses || [])].sort((a: PathCourseLink, b: PathCourseLink) => (a.order ?? 0) - (b.order ?? 0));
    setSelectedLinks(sorted);
    return path;
  }, []);

  useEffect(() => {
    if (isNew) {
      setLoading(true);
      loadCourses()
        .catch(() => showToast(t('admin.editor.toast.loadCoursesError'), 'error'))
        .finally(() => setLoading(false));
      return;
    }

    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) {
      navigate('/admin/learning-paths', { replace: true });
      return;
    }
    setLoading(true);
    setPathId(numericId);
    loadPath(numericId)
      .catch(() => {
        showToast(t('admin.editor.toast.loadPathError'), 'error');
        navigate('/admin/learning-paths', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, isNew, loadPath, loadCourses, navigate, showToast, t]);

  const selectedCourseIds = useMemo(
    () => new Set(selectedLinks.map((item) => item.courseId)),
    [selectedLinks],
  );

  const courseById = useMemo(
    () => new Map(allCourses.map((course) => [course.id, course])),
    [allCourses],
  );

  const displayPathTitle = useMemo(
    () => localizedPathTitle(
      { titleAr: form.titleAr || pathMeta.titleAr, titleEn: form.titleEn || pathMeta.titleEn },
      i18n.language,
    ),
    [form.titleAr, form.titleEn, pathMeta.titleAr, pathMeta.titleEn, i18n.language],
  );

  const resolveCourse = (courseId: number, fallback?: PathCourseLink['course']) => (
    courseById.get(courseId) || fallback
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((course) =>
      [course.titleAr, course.titleEn, course.instructor?.fullName, course.category?.nameAr, course.category?.nameEn]
        .some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [allCourses, courseSearch]);

  const syncCourses = async (targetPathId: number) => {
    const path = await adminApi.learningPath(targetPathId);
    const existing = [...(path.courses || [])] as PathCourseLink[];
    const existingIds = new Set(existing.map((item) => item.courseId));
    const desiredIds = selectedLinks.map((item) => item.courseId);

    for (const courseId of desiredIds) {
      if (!existingIds.has(courseId)) {
        await adminApi.addLearningPathCourse(targetPathId, { courseId });
      }
    }
    for (const item of existing) {
      if (!desiredIds.includes(item.courseId)) {
        await adminApi.removeLearningPathCourse(targetPathId, item.courseId);
      }
    }

    const refreshed = await adminApi.learningPath(targetPathId);
    const linkByCourseId = new Map(
      (refreshed.courses as PathCourseLink[]).map((item) => [item.courseId, item]),
    );
    const reorderPayload = selectedLinks
      .map((item, index) => {
        const link = linkByCourseId.get(item.courseId);
        if (!link) return null;
        return { id: link.id, order: index + 1 };
      })
      .filter(Boolean) as Array<{ id: number; order: number }>;

    if (reorderPayload.length) {
      await adminApi.reorderLearningPathCourses(targetPathId, reorderPayload);
    }

    await loadPath(targetPathId);
  };

  const savePathInfo = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!form.titleAr.trim()) {
      showToast(t('admin.editor.toast.titleRequired'), 'error');
      return;
    }
    setSavingInfo(true);
    try {
      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim() || null,
        descriptionAr: form.descriptionAr.trim() || null,
        coverImage: form.coverImage.trim() || null,
        status: form.status,
      };
      let targetPathId = pathId;
      if (isNew || !targetPathId) {
        const created = await adminApi.createLearningPath(payload);
        targetPathId = created.id;
        setPathId(created.id);
        setPathMeta({ titleAr: created.titleAr || form.titleAr.trim(), titleEn: created.titleEn || form.titleEn.trim() });
        navigate(`/admin/learning-paths/${created.id}`, { replace: true });
      } else {
        await adminApi.updateLearningPath(targetPathId, payload);
        setPathMeta({ titleAr: form.titleAr.trim(), titleEn: form.titleEn.trim() });
      }

      if (selectedLinks.length && targetPathId) {
        await syncCourses(targetPathId);
      }

      showToast(
        isNew ? t('admin.editor.toast.created') : t('admin.editor.toast.saved'),
        'success',
      );
    } catch {
      showToast(t('admin.editor.toast.saveError'), 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const toggleCourse = (course: any) => {
    if (selectedCourseIds.has(course.id)) {
      setSelectedLinks((prev) => prev.filter((item) => item.courseId !== course.id));
      return;
    }
    const nextOrder = selectedLinks.length + 1;
    setSelectedLinks((prev) => [
      ...prev,
      {
        id: -course.id,
        courseId: course.id,
        order: nextOrder,
        course: {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          instructor: course.instructor,
          category: course.category,
        },
      },
    ]);
  };

  const moveCourse = (index: number, direction: 'up' | 'down') => {
    setSelectedLinks((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const saveCourses = async () => {
    if (!form.titleAr.trim()) {
      showToast(t('admin.editor.toast.enterTitleFirst'), 'warning');
      return;
    }
    setSavingCourses(true);
    try {
      let targetPathId = pathId;
      if (!targetPathId) {
        const created = await adminApi.createLearningPath({
          titleAr: form.titleAr.trim(),
          titleEn: form.titleEn.trim() || null,
          descriptionAr: form.descriptionAr.trim() || null,
          coverImage: form.coverImage.trim() || null,
          status: form.status,
        });
        targetPathId = created.id;
        setPathId(created.id);
        setPathMeta({ titleAr: created.titleAr || form.titleAr.trim(), titleEn: created.titleEn || form.titleEn.trim() });
        navigate(`/admin/learning-paths/${created.id}`, { replace: true });
      }
      if (!targetPathId) {
        showToast(t('admin.editor.toast.createError'), 'error');
        return;
      }
      await syncCourses(targetPathId);
      showToast(t('admin.editor.toast.coursesSaved'), 'success');
    } catch {
      showToast(t('admin.editor.toast.saveCoursesError'), 'error');
    } finally {
      setSavingCourses(false);
    }
  };

  if (loading) {
    return (
      <div className="page-grid">
        <LoadingSkeleton variant="block" />
        <LoadingSkeleton variant="block" />
      </div>
    );
  }

  return (
    <div className="page-grid learning-path-editor">
      <div className="learning-path-editor-top">
        <Link to="/admin/learning-paths" className="admin-detail-back">
          {t('admin.editor.backToPaths')}
        </Link>
        <div className="learning-path-editor-heading">
          <div>
            <h1>
              {isNew
                ? t('admin.editor.newTitle')
                : t('admin.editor.editTitle', { title: displayPathTitle })}
            </h1>
            <p>{isNew ? t('admin.editor.newSubtitle') : t('admin.editor.editSubtitle')}</p>
          </div>
          {!isNew ? (
            <Badge variant={form.status === 'ACTIVE' ? 'success' : 'warning'}>
              {statusLabels[form.status] || form.status}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <h2>{t('admin.editor.infoSection')}</h2>
        <form className="stack-sm learning-path-info-form" onSubmit={savePathInfo}>
          <Input
            label={t('admin.editor.form.titleAr')}
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <Input
            label={t('admin.editor.form.titleEn')}
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
          />
          <Textarea
            label={t('admin.editor.form.description')}
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
          />
          <Input
            label={t('admin.editor.form.coverImage')}
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          />
          <Select
            label={t('admin.editor.form.status')}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: statusLabels.ACTIVE, value: 'ACTIVE' },
              { label: statusLabels.INACTIVE, value: 'INACTIVE' },
            ]}
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/learning-paths')}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={savingInfo} icon={<Save size={18} />}>
              {isNew ? t('actions.savePath') : t('actions.saveData')}
            </Button>
          </div>
        </form>
      </Card>

      {selectedLinks.length ? (
        <Card>
          <div className="section-heading">
            <h2>{t('admin.editor.selectedSection', { count: selectedLinks.length })}</h2>
            <Button type="button" size="sm" loading={savingCourses} onClick={saveCourses} icon={<Save size={16} />}>
              {t('actions.saveCourses')}
            </Button>
          </div>
          <div className="learning-path-selected-list">
            {selectedLinks.map((item, index) => {
              const course = resolveCourse(item.courseId, item.course);
              return (
              <div key={item.courseId} className="learning-path-selected-item">
                <span className="learning-path-order">{index + 1}</span>
                <div className="learning-path-selected-info">
                  <strong>{localizedCourseTitle(course, i18n.language)}</strong>
                  <small>{course?.instructor?.fullName || '—'}</small>
                </div>
                <div className="card-actions">
                  <Button type="button" size="sm" variant="ghost" onClick={() => moveCourse(index, 'up')} disabled={index === 0}>
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => moveCourse(index, 'down')}
                    disabled={index === selectedLinks.length - 1}
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => toggleCourse(course || { id: item.courseId, ...item.course })}>
                    {t('actions.remove')}
                  </Button>
                </div>
              </div>
            );
            })}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="section-heading">
          <h2>{t('admin.editor.pickSection')}</h2>
          <span className="learning-path-hint">{t('admin.editor.pickHint')}</span>
        </div>
        <div className="learning-path-course-search">
          <Search size={18} />
          <input
            type="search"
            placeholder={t('admin.editor.searchPlaceholder')}
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
          />
        </div>
        {filteredCourses.length ? (
          <div className="learning-path-course-grid">
            {filteredCourses.map((course) => {
              const selected = selectedCourseIds.has(course.id);
              return (
                <button
                  key={course.id}
                  type="button"
                  className={`learning-path-course-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => toggleCourse(course)}
                >
                  <span className={`learning-path-course-check ${selected ? 'is-checked' : ''}`}>
                    {selected ? <Check size={16} /> : null}
                  </span>
                  <div className="learning-path-course-body">
                    <strong>{localizedCourseTitle(course, i18n.language)}</strong>
                    <small>{course.instructor?.fullName || '—'}</small>
                    {localizedCategoryName(course.category, i18n.language) !== '—' ? (
                      <Badge variant="default">{localizedCategoryName(course.category, i18n.language)}</Badge>
                    ) : null}
                  </div>
                  <BookOpen size={20} className="learning-path-course-icon" />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={t('admin.editor.emptyCoursesTitle')}
            description={t('admin.editor.emptyCoursesDescription')}
          />
        )}
        <div className="card-actions learning-path-save-bar">
          <Button type="button" loading={savingCourses} onClick={saveCourses} icon={<Save size={18} />}>
            {t('actions.saveSelectedCourses')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
