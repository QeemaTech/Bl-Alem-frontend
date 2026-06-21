import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, PlayCircle, Star } from 'lucide-react';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { mediaUrl } from '../../utils/mediaUrl';

export default function StudentCourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
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
            <strong>{price} ر.س</strong>
            {course.discountPrice ? <span className="old-price">{Number(course.price)} ر.س</span> : null}
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
          <div>
            <h3>{course.instructor?.fullName}</h3>
            <p>{course.instructor?.instructorProfile?.bio || 'معلومات المحاضر ستظهر هنا.'}</p>
          </div>
        ) : null}
        {activeTab === 'reviews' ? (
          <div className="stack-sm">
            {course.reviews?.length ? (
              course.reviews.map((review: any) => (
                <Card key={review.id}>
                  <strong>{review.user?.fullName}</strong>
                  <p>{review.rating}/5</p>
                  <p>{review.comment}</p>
                </Card>
              ))
            ) : (
              <EmptyState title="لا توجد تقييمات" description="كن أول من يقيّم هذه الدورة بعد الاشتراك." />
            )}
          </div>
        ) : null}
      </Card>

      <Modal isOpen={checkoutOpen} title="إتمام الاشتراك" onClose={() => setCheckoutOpen(false)}>
        <form className="stack-sm" onSubmit={checkout}>
          <Input label="كود الخصم" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="BI20" />
          <Button type="button" variant="secondary" onClick={validateCoupon}>تطبيق الكوبون</Button>
          <p>السعر النهائي: <strong>{coupon ? Number(coupon.finalAmount) : price} ر.س</strong></p>
          <p>رصيد المحفظة: <strong>{walletBalance} ر.س</strong></p>
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
