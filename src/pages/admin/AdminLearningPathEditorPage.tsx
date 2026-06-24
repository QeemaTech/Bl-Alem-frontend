import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
    instructor?: { fullName?: string };
    category?: { nameAr?: string };
  };
};

export default function AdminLearningPathEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingCourses, setSavingCourses] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pathTitle, setPathTitle] = useState('');
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
    setPathTitle(path.titleAr || '');
    setAllCourses(courses);
    const sorted = [...(path.courses || [])].sort((a: PathCourseLink, b: PathCourseLink) => (a.order ?? 0) - (b.order ?? 0));
    setSelectedLinks(sorted);
    return path;
  }, []);

  useEffect(() => {
    if (isNew) {
      setLoading(true);
      loadCourses()
        .catch(() => showToast('تعذّر تحميل الدورات.', 'error'))
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
        showToast('تعذّر تحميل المسار.', 'error');
        navigate('/admin/learning-paths', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, isNew, loadPath, loadCourses, navigate, showToast]);

  const selectedCourseIds = useMemo(
    () => new Set(selectedLinks.map((item) => item.courseId)),
    [selectedLinks],
  );

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((course) =>
      [course.titleAr, course.titleEn, course.instructor?.fullName, course.category?.nameAr]
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
      showToast('عنوان المسار مطلوب.', 'error');
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
        setPathTitle(created.titleAr || form.titleAr.trim());
        navigate(`/admin/learning-paths/${created.id}`, { replace: true });
      } else {
        await adminApi.updateLearningPath(targetPathId, payload);
        setPathTitle(form.titleAr.trim());
      }

      if (selectedLinks.length && targetPathId) {
        await syncCourses(targetPathId);
      }

      showToast(
        isNew ? 'تم إنشاء المسار وحفظ الدورات.' : 'تم حفظ بيانات المسار.',
        'success',
      );
    } catch {
      showToast('تعذّر حفظ المسار.', 'error');
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
      showToast('أدخل عنوان المسار أولاً.', 'warning');
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
        setPathTitle(created.titleAr || form.titleAr.trim());
        navigate(`/admin/learning-paths/${created.id}`, { replace: true });
      }
      if (!targetPathId) {
        showToast('تعذّر إنشاء المسار.', 'error');
        return;
      }
      await syncCourses(targetPathId);
      showToast('تم حفظ دورات المسار.', 'success');
    } catch {
      showToast('تعذّر حفظ الدورات.', 'error');
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
          ← العودة للمسارات
        </Link>
        <div className="learning-path-editor-heading">
          <div>
            <h1>{isNew ? 'مسار تعليمي جديد' : `إدارة المسار: ${pathTitle || form.titleAr}`}</h1>
            <p>
              {isNew
                ? 'أدخل بيانات المسار واختر الدورات من القائمة أدناه.'
                : 'عدّل بيانات المسار واختر الدورات المرتبطة به.'}
            </p>
          </div>
          {!isNew ? (
            <Badge variant={form.status === 'ACTIVE' ? 'success' : 'warning'}>
              {form.status === 'ACTIVE' ? 'فعّال' : 'غير فعّال'}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <h2>معلومات المسار</h2>
        <form className="stack-sm learning-path-info-form" onSubmit={savePathInfo}>
          <Input
            label="العنوان العربي"
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <Input
            label="العنوان الإنجليزي"
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
          />
          <Textarea
            label="وصف المسار"
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
          />
          <Input
            label="رابط الغلاف"
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          />
          <Select
            label="الحالة"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: 'فعّال', value: 'ACTIVE' },
              { label: 'غير فعّال', value: 'INACTIVE' },
            ]}
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/learning-paths')}>
              إلغاء
            </Button>
            <Button type="submit" loading={savingInfo} icon={<Save size={18} />}>
              {isNew ? 'حفظ المسار' : 'حفظ البيانات'}
            </Button>
          </div>
        </form>
      </Card>

      {selectedLinks.length ? (
        <Card>
          <div className="section-heading">
            <h2>الدورات المختارة ({selectedLinks.length})</h2>
            <Button type="button" size="sm" loading={savingCourses} onClick={saveCourses} icon={<Save size={16} />}>
              حفظ الدورات
            </Button>
          </div>
          <div className="learning-path-selected-list">
            {selectedLinks.map((item, index) => (
              <div key={item.courseId} className="learning-path-selected-item">
                <span className="learning-path-order">{index + 1}</span>
                <div className="learning-path-selected-info">
                  <strong>{item.course?.titleAr || '—'}</strong>
                  <small>{item.course?.instructor?.fullName || '—'}</small>
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
                  <Button type="button" size="sm" variant="outline" onClick={() => toggleCourse({ id: item.courseId, ...item.course })}>
                    إزالة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="section-heading">
          <h2>اختيار الدورات</h2>
          <span className="learning-path-hint">اضغطي على الدورة لإضافتها أو إزالتها من المسار</span>
        </div>
        <div className="learning-path-course-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="بحث باسم الكورس أو المحاضر..."
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
                    <strong>{course.titleAr}</strong>
                    <small>{course.instructor?.fullName || '—'}</small>
                    {course.category?.nameAr ? (
                      <Badge variant="default">{course.category.nameAr}</Badge>
                    ) : null}
                  </div>
                  <BookOpen size={20} className="learning-path-course-icon" />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="لا توجد دورات منشورة"
            description="انشري كورسات أولاً لتتمكني من إضافتها للمسار."
          />
        )}
        <div className="card-actions learning-path-save-bar">
          <Button type="button" loading={savingCourses} onClick={saveCourses} icon={<Save size={18} />}>
            حفظ الدورات المختارة
          </Button>
        </div>
      </Card>
    </div>
  );
}
