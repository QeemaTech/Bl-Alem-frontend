import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, CheckCircle, ChevronLeft, ChevronRight, Clock, Download, FileText,
  Lock, PlayCircle, Video,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';

const fmtDuration = (seconds?: number) => {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins || 0} د`;
  return `${Math.floor(mins / 60)} س ${mins % 60} د`;
};

export default function StudentPlayerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const lastProgressUpdateRef = useRef(0);

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [player, courseQuizzes] = await Promise.all([
        studentApi.player(courseId),
        studentApi.courseQuizzes(courseId).catch(() => []),
      ]);
      setData(player);
      setQuizzes(courseQuizzes || []);
      const lessons = player.sections?.flatMap((section: any) => section.lessons || []) || [];
      setActiveLessonId((current) => {
        if (current && lessons.some((l: any) => l.id === current)) return current;
        const firstIncomplete = lessons.find((l: any) => {
          const done = player.currentProgress?.some((p: any) => p.lessonId === l.id && p.isCompleted);
          return !done;
        });
        return firstIncomplete?.id || lessons[0]?.id || null;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId]);

  const lessons = useMemo(
    () => data?.sections?.flatMap((section: any) => section.lessons || []) || [],
    [data],
  );

  const completedIds = useMemo(
    () => new Set(
      (data?.currentProgress || [])
        .filter((item: any) => item.isCompleted)
        .map((item: any) => item.lessonId),
    ),
    [data],
  );

  const progress = lessons.length
    ? Math.round((completedIds.size / lessons.length) * 100)
    : Number(data?.enrollment?.progressPercentage || 0);

  const activeLesson = lessons.find((lesson: any) => lesson.id === activeLessonId);
  const activeIndex = lessons.findIndex((lesson: any) => lesson.id === activeLessonId);
  const isActiveCompleted = activeLesson ? completedIds.has(activeLesson.id) : false;
  const lessonQuizzes = useMemo(() => {
    const map: Record<number, any[]> = {};
    quizzes.forEach((quiz) => {
      if (quiz.lessonId) {
        map[quiz.lessonId] = [...(map[quiz.lessonId] || []), quiz];
      }
    });
    return map;
  }, [quizzes]);
  const activeLessonQuizzes = activeLesson?.id ? lessonQuizzes[activeLesson.id] || [] : [];
  const courseQuizzes = useMemo(
    () => quizzes.filter((quiz) => !quiz.lessonId),
    [quizzes],
  );

  const complete = async () => {
    if (!activeLesson || isActiveCompleted) return;
    setCompleting(true);
    try {
      await studentApi.updateLessonProgress(activeLesson.id, activeLesson.duration || 0);
      const result = await studentApi.completeLesson(activeLesson.id);
      if (result.certificate) {
        showToast('مبروك! تم إصدار شهادتك.', 'success');
      } else {
        showToast('تم إكمال الدرس.', 'success');
      }
      await load();
      if (activeIndex < lessons.length - 1) {
        setActiveLessonId(lessons[activeIndex + 1]?.id);
      }
    } catch {
      showToast('تعذّر إكمال الدرس.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!data?.course) {
    return (
      <div className="page-grid student-player-page">
        <PageHeader
          title="مشغل الدورة"
          breadcrumb={[{ label: 'كورساتي', to: '/student/my-courses' }, { label: 'المشغل' }]}
        />
        <Card>
          <EmptyState
            title="لا يمكنك الوصول للمشغل"
            description="يجب الاشتراك في الدورة أولاً."
            actionLabel="كورساتي"
            onAction={() => navigate('/student/my-courses')}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-grid student-player-page">
      <PageHeader
        title={data.course.titleAr}
        subtitle={`${completedIds.size} من ${lessons.length} دروس — ${progress}%`}
        breadcrumb={[
          { label: 'كورساتي', to: '/student/my-courses' },
          { label: data.course.titleAr },
        ]}
        action={
          <Link to="/student/my-courses">
            <Button variant="outline" size="sm">العودة لكورساتي</Button>
          </Link>
        }
      />

      <div className="stats-grid student-player-stats">
        <StatCard title="التقدم الكلي" value={`${progress}%`} icon={PlayCircle} />
        <StatCard title="دروس مكتملة" value={`${completedIds.size}/${lessons.length}`} icon={CheckCircle} />
        <StatCard
          title="الدرس الحالي"
          value={activeLesson ? `#${activeIndex + 1}` : '—'}
          icon={Video}
          hint={activeLesson?.titleAr?.slice(0, 30)}
        />
        {progress >= 100 ? (
          <StatCard title="الشهادة" value="جاهزة" icon={Award} hint="يمكنك تحميلها" />
        ) : (
          <StatCard title="متبقٍ" value={`${lessons.length - completedIds.size} درس`} icon={Clock} />
        )}
      </div>

      <div className="player-grid">
        <section className="page-grid student-player-main">
          <Card className="student-player-video-card">
            <div className="student-player-video-wrap">
              {activeLesson?.videoUrl ? (
                <video
                  key={activeLesson.id}
                  className="student-player-video"
                  controls
                  playsInline
                  poster={data.course.coverImage || undefined}
                  src={activeLesson.videoUrl}
                  onTimeUpdate={(event) => {
                    const now = Date.now();
                    if (now - lastProgressUpdateRef.current < 15000) return;
                    lastProgressUpdateRef.current = now;
                    const currentTime = Math.floor(event.currentTarget.currentTime || 0);
                    studentApi.updateLessonProgress(activeLesson.id, currentTime).catch(() => null);
                  }}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="video-player-placeholder student-player-placeholder">
                  <PlayCircle size={48} />
                  <span>مشغل الفيديو</span>
                  <small>{activeLesson?.videoUrl ? '' : 'لم يُرفع فيديو لهذا الدرس بعد'}</small>
                </div>
              )}
            </div>

            <div className="student-player-lesson-head">
              <div>
                <span className="student-player-lesson-num">الدرس {activeIndex + 1} من {lessons.length}</span>
                <h2>{activeLesson?.titleAr || '—'}</h2>
                {activeLesson?.descriptionAr ? (
                  <p className="student-player-lesson-desc">{activeLesson.descriptionAr}</p>
                ) : null}
              </div>
              <div className="chip-row">
                {isActiveCompleted ? <Badge variant="completed">مكتمل</Badge> : null}
                {activeLessonQuizzes.length ? <Badge variant="info">اختبار مرتبط</Badge> : null}
              </div>
            </div>

            <ProgressBar value={progress} label="تقدم الدورة" size="md" />

            <div className="player-actions student-player-actions">
              <Button
                variant="secondary"
                disabled={activeIndex <= 0}
                onClick={() => setActiveLessonId(lessons[activeIndex - 1]?.id)}
                icon={<ChevronRight size={16} />}
              >
                السابق
              </Button>
              <Button
                onClick={complete}
                loading={completing}
                disabled={isActiveCompleted || !activeLesson}
                icon={<CheckCircle size={16} />}
              >
                {isActiveCompleted ? 'مكتمل' : 'تعليم كمكتمل'}
              </Button>
              {activeLessonQuizzes.length ? (
                <Button
                  variant="secondary"
                  icon={<PlayCircle size={16} />}
                  disabled={!activeLessonQuizzes[0]?.isReady}
                  onClick={() => navigate(`/student/quizzes/${activeLessonQuizzes[0].id}`)}
                >
                  {activeLessonQuizzes[0]?.isReady ? 'بدء اختبار الدرس' : 'الاختبار غير جاهز'}
                </Button>
              ) : null}
              <Button
                variant="secondary"
                disabled={activeIndex >= lessons.length - 1}
                onClick={() => setActiveLessonId(lessons[activeIndex + 1]?.id)}
                icon={<ChevronLeft size={16} />}
              >
                التالي
              </Button>
            </div>
          </Card>

          <Card className="student-player-resources">
            <div className="section-heading">
              <h3><FileText size={18} /> الموارد</h3>
              <span className="muted-count">{activeLesson?.resources?.length || 0} ملف</span>
            </div>
            {activeLesson?.resources?.length ? (
              <div className="student-resource-list">
                {activeLesson.resources.map((resource: any) => (
                  <a
                    key={resource.id}
                    className="student-resource-item"
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText size={18} />
                    <div>
                      <strong>{resource.title}</strong>
                      <span>{resource.type || 'ملف'}</span>
                    </div>
                    <Download size={16} />
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                title="لا توجد موارد"
                description="لا توجد ملفات مرفقة بهذا الدرس."
                icon={FileText}
              />
            )}
          </Card>

          {courseQuizzes.length ? (
            <Card className="student-player-resources">
              <div className="section-heading">
                <h3><Award size={18} /> اختبارات الدورة</h3>
                <span className="muted-count">{courseQuizzes.length} اختبار</span>
              </div>
              <div className="student-quiz-list">
                {courseQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    type="button"
                    className="student-quiz-list-item"
                    disabled={!quiz.isReady}
                    onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                  >
                    <div>
                      <strong>{quiz.titleAr}</strong>
                      <span>
                        {quiz.questionCount || 0} سؤال · {quiz.durationMinutes || 10} دقيقة · نجاح {quiz.passingScore || 60}%
                      </span>
                    </div>
                    <Badge variant={quiz.isReady ? 'success' : 'warning'}>
                      {quiz.isReady ? 'جاهز' : 'غير جاهز'}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {progress >= 100 ? (
            <Card className="student-player-certificate-banner">
              <Award size={28} />
              <div>
                <strong>أكملت الدورة!</strong>
                <p>يمكنك عرض وتحميل شهادتك من صفحة الشهادات.</p>
              </div>
              <Link to="/student/certificates">
                <Button variant="secondary" size="sm">عرض الشهادات</Button>
              </Link>
            </Card>
          ) : null}
        </section>

        <aside className="player-sidebar card student-player-sidebar">
          <div className="student-player-sidebar-head">
            <h3>{data.course.titleAr}</h3>
            <ProgressBar value={progress} label="التقدم" size="sm" />
          </div>

          <div className="student-player-curriculum">
            {data.sections?.map((section: any) => (
              <div key={section.id} className="student-player-section">
                <strong className="student-player-section-title">{section.titleAr}</strong>
                {section.lessons?.map((lesson: any) => {
                  const done = completedIds.has(lesson.id);
                  const locked = lesson.isLocked && !data.enrollment;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`lesson-nav ${lesson.id === activeLessonId ? 'active' : ''} ${locked ? 'locked' : ''} ${done ? 'done' : ''}`}
                      onClick={() => !locked && setActiveLessonId(lesson.id)}
                      disabled={locked}
                    >
                      <span>
                        {done ? <CheckCircle size={16} /> : locked ? <Lock size={16} /> : <PlayCircle size={16} />}
                        {lesson.titleAr}
                      </span>
                      <span className="lesson-nav-meta">
                        {done ? <Badge variant="completed">مكتمل</Badge> : null}
                        <small>{fmtDuration(lesson.duration)}</small>
                        {lessonQuizzes[lesson.id]?.length ? <Badge variant="info">اختبار</Badge> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
