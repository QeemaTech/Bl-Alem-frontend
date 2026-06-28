import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Award, BookOpen, ClipboardList, FileText, Lock, User, PlayCircle, Star, Users, Video,
} from '@/icons';
import { studentApi } from '../../api/student';
import { CourseReviewForm } from '../../components/student/CourseReviewForm';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CourseCard } from '../../components/ui/CourseCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { useStudentCourseLabels } from '../../hooks/useStudentCourseLabels';
import { formatMoney } from '../../utils/formatMoney';
import {
  localizedCategoryName,
  localizedCourseDescription,
  localizedCourseShortDescription,
  localizedCourseTitle,
  localizedLessonTitle,
  localizedQuizTitle,
  localizedResourceTitle,
  localizedSectionTitle,
} from '../../utils/localizedContent';
import { mediaUrl } from '../../utils/mediaUrl';

function StarDisplay({ rating, size = 16, ariaLabel }: { rating: number; size?: number; ariaLabel: string }) {
  return (
    <span className="course-review-card-stars" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          fill={value <= rating ? 'currentColor' : 'none'}
          strokeWidth={value <= rating ? 0 : 2}
        />
      ))}
    </span>
  );
}

export default function StudentCourseDetailsPage() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const {
    getLevelLabel,
    fmtLessons,
    otherCategory,
  } = useStudentCourseLabels();
  const [course, setCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [pointsToUse, setPointsToUse] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [pointsPerEgp, setPointsPerEgp] = useState(1);
  const [checkoutPreview, setCheckoutPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fmtReviewDate = (value?: string) => {
    if (!value) return '';
    const locale = lang.startsWith('en') ? 'en-US' : 'ar-EG';
    return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await studentApi.courseDetails(id);
      setCourse(data);
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (checkoutOpen) {
      setCoupon(null);
      setCouponError('');
      setPointsToUse('');
      setCheckoutPreview(null);
      setPreviewError('');
    }
  }, [checkoutOpen]);

  useEffect(() => {
    if (!checkoutOpen || !id) return undefined;

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const preview = await studentApi.checkoutPreview(id, {
          couponCode: coupon?.code || undefined,
          pointsToUse: Number(pointsToUse || 0) || undefined,
        });
        setCheckoutPreview(preview);
        setRewardPoints(Number(preview.availablePoints ?? 0));
        setPointsPerEgp(Number(preview.pointsPerEgp ?? 1));
      } catch (error: unknown) {
        setCheckoutPreview(null);
        const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
          || t('student.details.checkout.previewFailed');
        setPreviewError(message);
      } finally {
        setPreviewLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [checkoutOpen, id, couponCode, coupon, pointsToUse, t]);

  const price = Number(course?.discountPrice ?? course?.price ?? 0);
  const basePrice = checkoutPreview?.amount ?? price;
  const couponDiscount = Number(checkoutPreview?.couponDiscount ?? 0);
  const pointsDiscount = Number(checkoutPreview?.pointsDiscount ?? 0);
  const effectivePointsUsed = Number(checkoutPreview?.pointsUsed ?? 0);
  const finalPrice = Number(checkoutPreview?.finalAmount ?? price);

  const validateCoupon = async () => {
    if (!id || !couponCode.trim()) return;
    setCouponError('');
    try {
      const data = await studentApi.validateCoupon({ code: couponCode.trim(), courseId: Number(id) });
      setCoupon(data);
      if (data.pointsPerEgp) setPointsPerEgp(Number(data.pointsPerEgp));
      showToast(t('student.details.checkout.couponApplied'), 'success');
    } catch (error: unknown) {
      setCoupon(null);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('student.details.checkout.couponInvalid');
      setCouponError(message);
      showToast(message, 'error');
    }
  };

  const checkout = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setCheckoutLoading(true);
    try {
      await studentApi.checkout(id, {
        couponCode: coupon?.code || undefined,
        pointsToUse: effectivePointsUsed || undefined,
        gateway: 'SIMULATED',
      });
      showToast(t('student.details.checkout.success'), 'success');
      setCheckoutOpen(false);
      navigate('/student/my-courses');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('student.details.checkout.failed');
      showToast(message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const sortedSections = useMemo(
    () => [...(course?.sections || [])].sort((a, b) => a.order - b.order),
    [course],
  );

  if (loading) return <DashboardSkeleton />;

  if (!course) {
    return (
      <div className="page-grid student-course-detail-page">
        <PageHeader
          title={t('student.details.title')}
          breadcrumb={[
            { label: t('student.details.breadcrumbCourses'), to: '/student/courses' },
            { label: t('student.details.breadcrumbMissing') },
          ]}
        />
        <Card>
          <EmptyState
            title={t('student.details.notFound')}
            description={t('student.details.notFoundDesc')}
          />
        </Card>
      </div>
    );
  }

  const isEnrolled = Boolean(course.enrollmentStatus);
  const isCompleted = course.enrollmentStatus === 'COMPLETED' || Number(course.progress || 0) >= 100;
  const quizzes = course.quizzes || [];
  const courseTitle = localizedCourseTitle(course, lang);
  const courseSubtitle = localizedCourseShortDescription(course, lang)
    || localizedCategoryName(course.category, lang);
  const courseDescription = localizedCourseDescription(course, lang);
  const categoryName = localizedCategoryName(course.category, lang);
  const levelLabel = getLevelLabel(course.level);
  const lessonCount = course._count?.lessons || 0;
  const ratingValue = Number(course.ratingAverage || 0).toFixed(1);

  return (
    <div className="page-grid student-course-detail-page">
      <PageHeader
        title={courseTitle}
        subtitle={courseSubtitle}
        breadcrumb={[
          { label: t('student.details.breadcrumbCourses'), to: '/student/courses' },
          { label: courseTitle },
        ]}
      />

      <Card className="student-course-detail-hero">
        <div className="student-course-detail-media">
          {course.introVideo ? (
            <video controls src={mediaUrl(course.introVideo)} className="student-course-detail-video" />
          ) : (
            <div className="student-course-detail-media-fallback">
              <Video size={40} />
              <span>{t('student.details.previewFallback')}</span>
            </div>
          )}
        </div>
        <div className="student-course-detail-summary">
          {categoryName ? <Badge variant="info">{categoryName}</Badge> : null}
          <p className="student-course-detail-description">
            {courseDescription || courseSubtitle || t('student.details.overviewEmpty')}
          </p>
          <div className="student-course-detail-meta">
            <span className="student-course-detail-meta-item">
              <Star size={18} />
              {t('student.details.ratingLessons', {
                rating: ratingValue,
                lessons: fmtLessons(lessonCount),
                level: levelLabel,
              })}
            </span>
            <span className="student-course-detail-meta-item">
              <User size={18} />
              {t('student.details.instructorLabel')}: <strong>{course.instructor?.fullName}</strong>
            </span>
          </div>
          <p className="student-course-detail-price">
            <strong>{formatMoney(price, undefined, lang)}</strong>
            {course.discountPrice ? (
              <span className="old-price">{formatMoney(Number(course.price), undefined, lang)}</span>
            ) : null}
          </p>
          <div className="student-course-detail-actions">
            {isEnrolled ? (
              <Link to={`/student/player/${course.id}`} className="student-course-detail-action-link">
                <Button fullWidth icon={<PlayCircle size={18} />}>{t('student.details.continueLearning')}</Button>
              </Link>
            ) : (
              <Button fullWidth icon={<PlayCircle size={18} />} onClick={() => setCheckoutOpen(true)}>
                {t('student.details.subscribeNow')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="student-course-detail-tabs-card">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'overview', label: t('student.details.tabs.overview') },
            { id: 'content', label: t('student.details.tabs.content') },
            { id: 'instructor', label: t('student.details.tabs.instructor') },
            { id: 'reviews', label: t('student.details.tabs.reviews') },
          ]}
        />

        {activeTab === 'overview' ? (
          <p className="student-course-detail-overview">{courseDescription || t('student.details.overviewEmpty')}</p>
        ) : null}

        {activeTab === 'content' ? (
          <div className="student-course-detail-curriculum">
            {course.previewLessons?.length ? (
              <Card className="student-course-detail-panel">
                <h3 className="student-course-detail-panel-title">
                  <PlayCircle size={20} />
                  {t('student.details.previewLessons')}
                </h3>
                {course.previewLessons.map((lesson: any) => (
                  <div className="student-course-detail-lesson-row" key={`preview-${lesson.id}`}>
                    <span className="student-course-detail-lesson-label">
                      <PlayCircle size={16} />
                      {localizedLessonTitle(lesson, lang)}
                    </span>
                    <Badge variant="info">{t('student.details.previewBadge')}</Badge>
                  </div>
                ))}
              </Card>
            ) : null}

            {sortedSections.map((section: any) => {
              const lessons = [...(section.lessons || [])].sort((a, b) => a.order - b.order);
              return (
                <details key={section.id} className="student-course-detail-section" open>
                  <summary className="student-course-detail-section-summary">
                    <BookOpen size={18} />
                    {localizedSectionTitle(section, lang)}
                    <span className="muted-count">{fmtLessons(lessons.length)}</span>
                  </summary>
                  <div className="student-course-detail-section-body">
                    {lessons.map((lesson: any) => (
                      <div className="student-course-detail-lesson-row" key={lesson.id}>
                        <span className="student-course-detail-lesson-label">
                          {lesson.isPreview ? <PlayCircle size={16} /> : <Lock size={16} />}
                          {localizedLessonTitle(lesson, lang)}
                        </span>
                        <Badge variant={lesson.isPreview ? 'info' : isEnrolled ? 'success' : 'default'}>
                          {lesson.isPreview
                            ? t('student.details.previewBadge')
                            : isEnrolled
                              ? t('student.details.lessonAvailable')
                              : t('student.details.lessonLocked')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}

            {course.courseResources?.length ? (
              <Card className="student-course-detail-panel">
                <h3 className="student-course-detail-panel-title">
                  <FileText size={20} />
                  {t('student.details.courseResources')}
                </h3>
                <ul className="student-course-detail-resources">
                  {course.courseResources.map((resource: any) => (
                    <li key={resource.id}>
                      <a href={mediaUrl(resource.fileUrl)} target="_blank" rel="noreferrer">
                        <FileText size={16} />
                        {localizedResourceTitle(resource, lang)}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card className="student-course-detail-panel">
              <h3 className="student-course-detail-panel-title">
                <ClipboardList size={20} />
                {t('student.details.quizzesTitle')}
              </h3>
              {quizzes.length ? (
                quizzes.map((quiz: any) => (
                  <div key={quiz.id} className="student-course-detail-quiz-row">
                    <div>
                      <strong>{localizedQuizTitle(quiz, lang)}</strong>
                      <p className="muted-count">
                        {t('student.details.quizMeta', {
                          questions: quiz.questionCount || quiz.questions?.length || 0,
                          minutes: quiz.durationMinutes || 10,
                        })}
                        {quiz.isReady === false ? ` · ${t('student.details.quizNotReady')}` : ''}
                      </p>
                    </div>
                    {isEnrolled ? (
                      quiz.isReady === false ? (
                        <Badge variant="warning">{t('student.details.quizSoon')}</Badge>
                      ) : (
                        <Link to={`/student/quizzes/${quiz.id}`}>
                          <Button size="sm" variant="secondary">{t('student.details.startQuiz')}</Button>
                        </Link>
                      )
                    ) : (
                      <Badge variant="default">{t('student.details.quizAfterEnroll')}</Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="muted-count">{t('student.details.noQuizzes')}</p>
              )}
            </Card>
          </div>
        ) : null}

        {activeTab === 'instructor' ? (
          <div className="student-instructor-panel">
            <div className="student-instructor-header">
              <div className="student-instructor-avatar">
                {course.instructor?.avatar ? (
                  <img src={mediaUrl(course.instructor.avatar)} alt="" />
                ) : (
                  <span>{course.instructor?.fullName?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="student-instructor-intro">
                <h3>{course.instructor?.fullName}</h3>
                {course.instructorStats?.title ? (
                  <p className="student-instructor-role">{course.instructorStats.title}</p>
                ) : null}
                {course.instructorStats?.specialization ? (
                  <Badge variant="info">{course.instructorStats.specialization}</Badge>
                ) : null}
              </div>
            </div>

            <div className="student-instructor-stats">
              <div className="student-instructor-stat">
                <BookOpen size={18} />
                <span>{t('student.details.instructor.publishedCourses', { count: course.instructorStats?.totalCourses ?? 0 })}</span>
              </div>
              <div className="student-instructor-stat">
                <Users size={18} />
                <span>{t('student.details.instructor.students', { count: course.instructorStats?.totalStudents ?? 0 })}</span>
              </div>
              {course.instructorStats?.yearsOfExperience != null ? (
                <div className="student-instructor-stat">
                  <Award size={18} />
                  <span>{t('student.details.instructor.experience', { count: course.instructorStats.yearsOfExperience })}</span>
                </div>
              ) : null}
              <div className="student-instructor-stat">
                <Star size={18} />
                <span>{t('student.details.instructor.courseRating', { rating: ratingValue })}</span>
              </div>
            </div>

            <Card className="student-instructor-bio-card">
              <h4>{t('student.details.instructor.bioTitle')}</h4>
              <p>{course.instructor?.instructorProfile?.bio || t('student.details.instructor.bioEmpty')}</p>
            </Card>

            {course.instructorStats?.specialization ? (
              <Card className="student-instructor-bio-card">
                <h4>{t('student.details.instructor.specializationTitle')}</h4>
                <p>{course.instructorStats.specialization}</p>
              </Card>
            ) : null}

            <div className="student-instructor-courses">
              <div className="section-heading">
                <h4>{t('student.details.instructor.otherCoursesTitle')}</h4>
                <span className="student-instructor-courses-count">
                  {t('student.details.instructor.otherCoursesCount', { count: course.instructorOtherCourses?.length ?? 0 })}
                </span>
              </div>
              {course.instructorOtherCourses?.length ? (
                <div className="student-instructor-courses-grid">
                  {course.instructorOtherCourses.map((item: any) => (
                    <CourseCard
                      key={item.id}
                      title={localizedCourseTitle(item, lang)}
                      category={localizedCategoryName(item.category, lang) || otherCategory}
                      imageUrl={mediaUrl(item.coverImage)}
                      price={Number(item.discountPrice ?? item.price ?? 0)}
                      rating={Number(item.ratingAverage || 0)}
                      duration={`${fmtLessons(item._count?.lessons || 0)} · ${getLevelLabel(item.level)}`}
                      actionLabel={t('student.details.instructor.viewDetails')}
                      onAction={() => navigate(`/student/courses/${item.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t('student.details.instructor.otherCoursesEmptyTitle')}
                  description={t('student.details.instructor.otherCoursesEmptyDesc')}
                />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'reviews' ? (
          <div className="stack-sm">
            {isCompleted ? (
              <CourseReviewForm
                courseId={course.id}
                myReview={course.myReview}
                onSuccess={() => {
                  showToast(
                    course.myReview
                      ? t('student.details.reviews.updated')
                      : t('student.details.reviews.thanks'),
                    'success',
                  );
                  load();
                }}
              />
            ) : null}
            {isEnrolled && !isCompleted ? (
              <p className="course-review-notice">{t('student.details.reviews.completeToReview')}</p>
            ) : null}
            {course.reviews?.length ? (
              course.reviews.map((review: any) => {
                const isMine = course.myReview?.id === review.id;
                return (
                  <Card key={review.id} className={`course-review-card ${isMine ? 'is-mine' : ''}`}>
                    {isMine ? (
                      <Badge variant="info" className="course-review-mine-badge">
                        {t('student.details.reviews.yours')}
                      </Badge>
                    ) : null}
                    <div className="course-review-card-head">
                      <div className="course-review-card-user">
                        <div className="course-review-card-avatar">
                          {review.user?.avatar ? (
                            <img src={mediaUrl(review.user.avatar)} alt="" />
                          ) : (
                            <span>{review.user?.fullName?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="course-review-card-name">{review.user?.fullName}</p>
                          <p className="course-review-card-date">{fmtReviewDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <StarDisplay
                        rating={review.rating}
                        ariaLabel={t('student.details.reviews.starsAria', { rating: review.rating })}
                      />
                    </div>
                    {review.comment ? (
                      <p className="course-review-card-comment">{review.comment}</p>
                    ) : null}
                  </Card>
                );
              })
            ) : (
              <EmptyState
                title={t('student.details.reviews.emptyTitle')}
                description={
                  isCompleted
                    ? t('student.details.reviews.emptyCompleted')
                    : t('student.details.reviews.emptyDefault')
                }
              />
            )}
          </div>
        ) : null}
      </Card>

      <Modal
        isOpen={checkoutOpen}
        title={t('student.details.checkout.title')}
        onClose={() => setCheckoutOpen(false)}
      >
        <form className="stack-sm" onSubmit={checkout}>
          <div className="rounded-xl border border-outline bg-surface-container-low p-4 text-sm">
            {previewLoading ? (
              <p className="m-0 text-on-surface-variant">{t('student.details.checkout.previewLoading')}</p>
            ) : null}
            {previewError ? (
              <p className="m-0 mb-2 text-sm font-semibold text-error">{previewError}</p>
            ) : null}
            <div className="flex justify-between gap-3">
              <span>{t('student.details.checkout.originalPrice')}</span>
              <strong>{formatMoney(basePrice, undefined, lang)}</strong>
            </div>
            {couponDiscount > 0 ? (
              <div className="mt-2 flex justify-between gap-3 text-success">
                <span>{t('student.details.checkout.couponDiscount')}</span>
                <strong>-{formatMoney(couponDiscount, undefined, lang)}</strong>
              </div>
            ) : null}
            {pointsDiscount > 0 ? (
              <div className="mt-2 flex justify-between gap-3 text-success">
                <span>{t('student.details.checkout.pointsDiscount', { points: effectivePointsUsed })}</span>
                <strong>-{formatMoney(pointsDiscount, undefined, lang)}</strong>
              </div>
            ) : null}
            <div className="mt-3 flex justify-between gap-3 border-t border-outline pt-3">
              <span>{t('student.details.checkout.finalPrice')}</span>
              <strong>{formatMoney(finalPrice, undefined, lang)}</strong>
            </div>
          </div>
          <Input
            label={t('student.details.checkout.couponLabel')}
            value={couponCode}
            onChange={(event) => {
              setCouponCode(event.target.value.toUpperCase());
              setCoupon(null);
              setCouponError('');
            }}
            placeholder={t('student.details.checkout.couponPlaceholder')}
          />
          {couponError ? <p className="text-sm font-semibold text-error">{couponError}</p> : null}
          <Button type="button" variant="secondary" onClick={validateCoupon} disabled={!couponCode.trim()}>
            {t('student.details.checkout.applyCoupon')}
          </Button>
          <Input
            label={t('student.details.checkout.pointsLabel', { points: rewardPoints, rate: pointsPerEgp })}
            type="number"
            min="0"
            max={String(rewardPoints)}
            value={pointsToUse}
            onChange={(event) => setPointsToUse(event.target.value)}
            placeholder="0"
          />
          <Button type="submit" fullWidth loading={checkoutLoading} disabled={previewLoading || Boolean(previewError)}>
            {t('student.details.checkout.confirm')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
