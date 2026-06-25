import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Award, BookOpen, Lock, PlayCircle, Star, Users,
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
import { mediaUrl } from '../../utils/mediaUrl';

const levelLabels: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

const fmtReviewDate = (value?: string) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '');

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="course-review-card-stars" aria-label={`${rating} من 5`}>
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentGateway, setPaymentGateway] = useState<'SIMULATED' | 'WALLET'>('SIMULATED');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const data = await studentApi.courseDetails(id);
    setCourse(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (checkoutOpen) {
      studentApi.wallet().then((wallet) => setWalletBalance(Number(wallet?.balance || 0))).catch(() => setWalletBalance(0));
    }
  }, [checkoutOpen]);

  const validateCoupon = async () => {
    if (!id || !couponCode) return;
    const data = await studentApi.validateCoupon({ code: couponCode, courseId: Number(id) });
    setCoupon(data);
    showToast('تم تطبيق كود الخصم.', 'success');
  };

  const checkout = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    await studentApi.checkout(id, { couponCode: couponCode || undefined, gateway: paymentGateway });
    showToast('تم الاشتراك في الدورة بنجاح.', 'success');
    setCheckoutOpen(false);
    navigate('/student/my-courses');
  };

  if (loading) return <DashboardSkeleton />;
  if (!course) {
    return (
      <div className="page-grid">
        <PageHeader
          title="تفاصيل الدورة"
          breadcrumb={[{ label: 'الكورسات', to: '/student/courses' }, { label: 'غير موجود' }]}
        />
        <Card><EmptyState title="الدورة غير موجودة" description="لم نتمكن من جلب تفاصيل هذه الدورة." /></Card>
      </div>
    );
  }

  const isEnrolled = Boolean(course.enrollmentStatus);
  const isCompleted = course.enrollmentStatus === 'COMPLETED' || Number(course.progress || 0) >= 100;
  const price = Number(course.discountPrice ?? course.price ?? 0);
  const quizzes = course.quizzes || [];

  return (
    <div className="page-grid">
      <PageHeader
        title={course.titleAr}
        subtitle={course.shortDescriptionAr || course.category?.nameAr}
        breadcrumb={[
          { label: 'الكورسات', to: '/student/courses' },
          { label: course.titleAr },
        ]}
        action={
          isEnrolled ? (
            <Link to={`/student/player/${course.id}`}>
              <Button icon={<PlayCircle size={18} />}>استكمال التعلم</Button>
            </Link>
          ) : (
            <Button onClick={() => setCheckoutOpen(true)}>اشترك الآن</Button>
          )
        }
      />

      <Card className="course-detail-hero">
        <div className="course-video-placeholder">
          {course.introVideo ? (
            <video controls src={mediaUrl(course.introVideo)} className="course-review-video" />
          ) : (
            'معاينة الدورة'
          )}
        </div>
        <div className="stack-sm">
          <Badge variant="info">{course.category?.nameAr}</Badge>
          <p>{course.descriptionAr || course.shortDescriptionAr}</p>
          <p>
            <Star size={16} /> {Number(course.ratingAverage || 0).toFixed(1)} | {course._count?.lessons || 0} دروس | {course.level}
          </p>
          <p>المحاضر: <strong>{course.instructor?.fullName}</strong></p>
          <p className="price-line">
            <strong>{price} ج.م</strong>
            {course.discountPrice ? <span className="old-price">{Number(course.price)} ج.م</span> : null}
          </p>
        </div>
      </Card>

      <Card>
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'content', label: 'المحتوى' },
            { id: 'instructor', label: 'المحاضر' },
            { id: 'reviews', label: 'التقييمات' },
          ]}
        />
        {activeTab === 'overview' ? <p>{course.descriptionAr || 'لا يوجد وصف تفصيلي بعد.'}</p> : null}
        {activeTab === 'content' ? (
          <div className="curriculum">
            {course.previewLessons?.length ? (
              <Card className="stack-sm">
                <h3>دروس المعاينة</h3>
                {course.previewLessons.map((lesson: any) => (
                  <div className="lesson-row" key={`preview-${lesson.id}`}>
                    <span>
                      <PlayCircle size={16} />
                      {lesson.titleAr}
                    </span>
                    <Badge variant="info">معاينة</Badge>
                  </div>
                ))}
              </Card>
            ) : null}
            {course.sections?.map((section: any) => (
              <details key={section.id} open>
                <summary>{section.titleAr}</summary>
                {section.lessons?.map((lesson: any) => (
                  <div className="lesson-row" key={lesson.id}>
                    <span>
                      {lesson.isPreview ? <PlayCircle size={16} /> : <Lock size={16} />}
                      {lesson.titleAr}
                    </span>
                    <Badge variant={lesson.isPreview ? 'info' : isEnrolled ? 'success' : 'default'}>
                      {lesson.isPreview ? 'معاينة' : isEnrolled ? 'متاح' : 'مغلق'}
                    </Badge>
                  </div>
                ))}
              </details>
            ))}
            <Card className="stack-sm">
              <h3>الاختبارات</h3>
              {quizzes.length ? (
                quizzes.map((quiz: any) => (
                  <div key={quiz.id} className="lesson-row student-quiz-row">
                    <div>
                      <strong>{quiz.titleAr}</strong>
                      <p>
                        {quiz.questionCount || 0} سؤال · {quiz.durationMinutes || 10} دقيقة
                        {quiz.isReady === false ? ' · غير جاهز بعد' : ''}
                      </p>
                    </div>
                    {isEnrolled ? (
                      quiz.isReady === false ? (
                        <Badge variant="warning">قريباً</Badge>
                      ) : (
                        <Link to={`/student/quizzes/${quiz.id}`}>
                          <Button size="sm" variant="secondary">ابدأ الاختبار</Button>
                        </Link>
                      )
                    ) : (
                      <Badge variant="default">متاح بعد الاشتراك</Badge>
                    )}
                  </div>
                ))
              ) : (
                <p>لا توجد اختبارات مرتبطة بهذه الدورة.</p>
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
                <span>{course.instructorStats?.totalCourses ?? 0} كورس منشور</span>
              </div>
              <div className="student-instructor-stat">
                <Users size={18} />
                <span>{course.instructorStats?.totalStudents ?? 0} طالب</span>
              </div>
              {course.instructorStats?.yearsOfExperience != null ? (
                <div className="student-instructor-stat">
                  <Award size={18} />
                  <span>{course.instructorStats.yearsOfExperience} سنوات خبرة</span>
                </div>
              ) : null}
              <div className="student-instructor-stat">
                <Star size={18} />
                <span>{Number(course.ratingAverage || 0).toFixed(1)} تقييم هذه الدورة</span>
              </div>
            </div>

            <Card className="student-instructor-bio-card">
              <h4>نبذة عن المحاضر</h4>
              <p>{course.instructor?.instructorProfile?.bio || 'لم يضف المحاضر نبذة بعد.'}</p>
            </Card>

            {course.instructorStats?.specialization ? (
              <Card className="student-instructor-bio-card">
                <h4>مجال التخصص</h4>
                <p>{course.instructorStats.specialization}</p>
              </Card>
            ) : null}

            <div className="student-instructor-courses">
              <div className="section-heading">
                <h4>كورسات أخرى للمحاضر على المنصة</h4>
                <span>
                  {course.instructorOtherCourses?.length ?? 0} كورس إضافي
                </span>
              </div>
              {course.instructorOtherCourses?.length ? (
                <div className="student-instructor-courses-grid">
                  {course.instructorOtherCourses.map((item: any) => (
                    <CourseCard
                      key={item.id}
                      title={item.titleAr}
                      category={item.category?.nameAr || 'عام'}
                      imageUrl={mediaUrl(item.coverImage)}
                      price={Number(item.discountPrice ?? item.price ?? 0)}
                      rating={Number(item.ratingAverage || 0)}
                      duration={`${item._count?.lessons || 0} دروس · ${levelLabels[item.level] || item.level}`}
                      actionLabel="عرض التفاصيل"
                      onAction={() => navigate(`/student/courses/${item.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="لا توجد كورسات أخرى حالياً"
                  description="هذا المحاضر لم ينشر كورسات إضافية على المنصة بعد."
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
                  showToast(course.myReview ? 'تم تحديث تقييمك.' : 'شكراً لتقييمك!', 'success');
                  load();
                }}
              />
            ) : null}
            {isEnrolled && !isCompleted ? (
              <p className="course-review-notice">أكمل الدورة لتتمكن من التقييم.</p>
            ) : null}
            {course.reviews?.length ? (
              course.reviews.map((review: any) => {
                const isMine = course.myReview?.id === review.id;
                return (
                  <Card key={review.id} className={`course-review-card ${isMine ? 'is-mine' : ''}`}>
                    {isMine ? <Badge variant="info" className="course-review-mine-badge">تقييمك</Badge> : null}
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
                      <StarDisplay rating={review.rating} />
                    </div>
                    {review.comment ? (
                      <p className="course-review-card-comment">{review.comment}</p>
                    ) : null}
                  </Card>
                );
              })
            ) : (
              <EmptyState
                title="لا توجد تقييمات"
                description={isCompleted ? 'كن أول من يقيّم هذه الدورة.' : 'لم يُضف أحد تقييماً بعد.'}
              />
            )}
          </div>
        ) : null}
      </Card>

      <Modal isOpen={checkoutOpen} title="إتمام الاشتراك" onClose={() => setCheckoutOpen(false)}>
        <form className="stack-sm" onSubmit={checkout}>
          <Input label="كود الخصم" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="BI20" />
          <Button type="button" variant="secondary" onClick={validateCoupon}>تطبيق الكوبون</Button>
          <p>السعر النهائي: <strong>{coupon ? Number(coupon.finalAmount) : price} ج.م</strong></p>
          <p>رصيد المحفظة: <strong>{walletBalance} ج.م</strong></p>
          <div className="segmented-control">
            <button type="button" className={paymentGateway === 'SIMULATED' ? 'active' : ''} onClick={() => setPaymentGateway('SIMULATED')}>دفع تجريبي</button>
            <button type="button" className={paymentGateway === 'WALLET' ? 'active' : ''} onClick={() => setPaymentGateway('WALLET')}>من المحفظة</button>
          </div>
          <Button fullWidth>تأكيد الاشتراك</Button>
        </form>
      </Modal>
    </div>
  );
}
