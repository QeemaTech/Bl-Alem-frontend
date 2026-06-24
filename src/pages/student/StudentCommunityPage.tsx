import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Download, LayoutGrid, MessageCircle, MessageSquare, MessagesSquare, Plus, Send,
  Table2, UserRound, Users,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportChart } from '../../components/reports/ReportChart';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { exportTableToExcel } from '../../utils/exportExcel';

const getInitial = (name?: string) => (name?.trim()?.[0] || '؟').toUpperCase();

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const exportColumns = [
  { key: 'id', header: 'رقم المنشور' },
  { key: 'author', header: 'الكاتب' },
  { key: 'title', header: 'العنوان' },
  { key: 'body', header: 'المحتوى' },
  { key: 'commentsCount', header: 'عدد التعليقات' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'التاريخ' },
];

export default function StudentCommunityPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('feed');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<any>(null);
  const [titleAr, setTitleAr] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [detailReply, setDetailReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [replyFilter, setReplyFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setPosts(await studentApi.communityPosts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
    const myPosts = posts.filter((p) => p.userId === user?.id || p.user?.id === user?.id).length;
    const answered = posts.filter((p) => (p.comments?.length || 0) > 0).length;
    return {
      total: posts.length,
      comments: totalComments,
      mine: myPosts,
      answered,
      unanswered: posts.length - answered,
    };
  }, [posts, user?.id]);

  const chartData = useMemo(() => [
    { label: 'بردود', value: stats.answered },
    { label: 'بانتظار رد', value: stats.unanswered },
  ].filter((d) => d.value > 0), [stats.answered, stats.unanswered]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (authorFilter === 'mine') {
      result = result.filter((p) => p.userId === user?.id || p.user?.id === user?.id);
    }
    if (replyFilter === 'answered') {
      result = result.filter((p) => (p.comments?.length || 0) > 0);
    } else if (replyFilter === 'unanswered') {
      result = result.filter((p) => !(p.comments?.length || 0));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) =>
        [p.titleAr, p.bodyAr, p.user?.fullName, String(p.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [posts, search, replyFilter, authorFilter, user?.id]);

  const tableRows = useMemo(() => filteredPosts.map((post) => {
    const count = post.comments?.length || 0;
    return {
      id: post.id,
      author: post.user?.fullName || '—',
      title: post.titleAr,
      body: post.bodyAr?.length > 60 ? `${post.bodyAr.slice(0, 60)}...` : post.bodyAr,
      commentsCount: count,
      status: count > 0 ? 'تم الرد' : 'بانتظار رد',
      createdAt: fmtDate(post.createdAt),
      _raw: post,
    };
  }), [filteredPosts]);

  const createPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!titleAr.trim() || !bodyAr.trim()) return;
    setSubmitting(true);
    try {
      await studentApi.createCommunityPost({ titleAr: titleAr.trim(), bodyAr: bodyAr.trim() });
      showToast('تم نشر المنشور', 'success');
      setCreateOpen(false);
      setTitleAr('');
      setBodyAr('');
      await load();
    } catch {
      showToast('فشل نشر المنشور', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addComment = async (postId: number, body: string, onSuccess?: () => void) => {
    const text = body.trim();
    if (!text) return;
    setReplyingId(postId);
    try {
      await studentApi.createCommunityComment(postId, text);
      showToast('تم إضافة التعليق', 'success');
      await load();
      onSuccess?.();
    } catch {
      showToast('فشل إضافة التعليق', 'error');
    } finally {
      setReplyingId(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      'منشورات المجتمع',
      exportColumns,
      tableRows.map(({ _raw, body, ...row }) => ({
        ...row,
        body: _raw.bodyAr || body,
      })),
    );
  };

  const renderComments = (post: any, compact = false) => {
    const comments = post.comments || [];
    if (!comments.length) return null;
    return (
      <div className={`community-comments-list ${compact ? 'compact' : ''}`}>
        {comments.map((comment: any) => {
          const isAdmin = comment.user?.role === 'SUPER_ADMIN';
          return (
            <div key={comment.id} className={`community-comment ${isAdmin ? 'admin' : ''}`}>
              <span className="community-avatar sm" aria-hidden>{getInitial(comment.user?.fullName)}</span>
              <div>
                <div className="community-comment-head">
                  <strong>{comment.user?.fullName || 'مستخدم'}</strong>
                  {isAdmin ? <Badge variant="info">فريق المنصة</Badge> : null}
                </div>
                <p>{comment.bodyAr}</p>
                <small>{fmtDate(comment.createdAt)}</small>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReplyForm = (postId: number, draft: string, onChange: (v: string) => void, onDone?: () => void) => (
    <form
      className="community-reply-form"
      onSubmit={(event) => {
        event.preventDefault();
        addComment(postId, draft, onDone);
        onChange('');
      }}
    >
      <input
        type="text"
        placeholder="أضف تعليقاً..."
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        aria-label="أضف تعليقاً"
      />
      <Button
        type="submit"
        size="sm"
        loading={replyingId === postId}
        icon={<Send size={14} />}
      >
        رد
      </Button>
    </form>
  );

  const renderPostCard = (post: any) => {
    const isMine = post.userId === user?.id || post.user?.id === user?.id;
    const commentCount = post.comments?.length || 0;
    return (
      <Card key={post.id} className={`community-post-card ${isMine ? 'mine' : ''}`}>
        <header className="community-post-head">
          <span className="community-avatar" aria-hidden>{getInitial(post.user?.fullName)}</span>
          <div className="community-post-meta">
            <div className="community-post-meta-top">
              <strong>{post.user?.fullName || 'مستخدم'}</strong>
              {isMine ? <Badge variant="info">منشورك</Badge> : null}
              {commentCount > 0 ? (
                <Badge variant="success">{commentCount} تعليق</Badge>
              ) : (
                <Badge variant="warning">بانتظار رد</Badge>
              )}
            </div>
            <span>{fmtDate(post.createdAt)}</span>
          </div>
        </header>

        <h3 className="community-post-title">{post.titleAr}</h3>
        <p className="community-post-body">{post.bodyAr}</p>

        {renderComments(post)}

        {renderReplyForm(
          post.id,
          commentDrafts[post.id] || '',
          (v) => setCommentDrafts((current) => ({ ...current, [post.id]: v })),
        )}
      </Card>
    );
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-community-page">
      <div className="reports-header">
        <PageHeader
          title="المجتمع"
          subtitle="شارك أسئلتك وتجاربك مع المتعلمين الآخرين"
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!posts.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
            منشور جديد
          </Button>
        </div>
      </div>

      <Card className="student-community-hero">
        <div className="student-community-hero-icon">
          <Users size={32} />
        </div>
        <div className="student-community-hero-body">
          <strong>مجتمع المتعلمين</strong>
          <p>اطرح أسئلتك، شارك تجاربك، وتفاعل مع زملائك في التعلم.</p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="المنشورات" value={String(stats.total)} icon={MessageCircle} />
        <StatCard title="التعليقات" value={String(stats.comments)} icon={MessagesSquare} />
        <StatCard title="منشوراتي" value={String(stats.mine)} icon={UserRound} />
        <StatCard title="بردود" value={String(stats.answered)} icon={MessageSquare} hint={`${stats.unanswered} بانتظار رد`} />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-community-charts">
          <ReportChart title="توزيع المنشورات" type="pie" data={chartData} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان، المحتوى، أو الكاتب..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setReplyFilter(''); setAuthorFilter(''); }}
      >
        <Select
          label="التعليقات"
          value={replyFilter}
          onChange={(e) => setReplyFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'بردود', value: 'answered' },
            { label: 'بانتظار رد', value: 'unanswered' },
          ]}
        />
        <Select
          label="الكاتب"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'منشوراتي', value: 'mine' },
          ]}
        />
      </FilterBar>

      <Tabs
        activeTab={viewMode}
        onChange={setViewMode}
        variant="pills"
        tabs={[
          { id: 'feed', label: `البطاقات (${filteredPosts.length})` },
          { id: 'table', label: `الجدول (${filteredPosts.length})` },
        ]}
      />

      {viewMode === 'feed' ? (
        <div className="community-feed">
          {filteredPosts.length ? (
            filteredPosts.map(renderPostCard)
          ) : (
            <Card>
              <EmptyState
                title="لا توجد منشورات"
                description={posts.length ? 'جرّب تغيير الفلاتر أو البحث.' : 'كن أول من يشارك سؤالاً أو تجربة مع المجتمع.'}
                icon={MessageCircle}
                actionLabel="منشور جديد"
                onAction={() => setCreateOpen(true)}
              />
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="section-heading">
            <h2><Table2 size={18} /> جدول المنشورات</h2>
            <span className="muted-count">{filteredPosts.length} منشور</span>
          </div>
          <Table
            data={tableRows}
            emptyTitle="لا توجد منشورات"
            emptyDescription="لم يُعثر على منشورات مطابقة."
            columns={[
              { key: 'id', header: 'الرقم' },
              { key: 'author', header: 'الكاتب' },
              { key: 'title', header: 'العنوان' },
              {
                key: 'commentsCount',
                header: 'التعليقات',
                render: (row) => (
                  <Badge variant={Number(row.commentsCount) > 0 ? 'success' : 'warning'}>
                    {row.commentsCount}
                  </Badge>
                ),
              },
              {
                key: 'status',
                header: 'الحالة',
                render: (row) => (
                  <Badge variant={row.status === 'تم الرد' ? 'success' : 'warning'}>
                    {row.status}
                  </Badge>
                ),
              },
              { key: 'createdAt', header: 'التاريخ' },
              {
                key: 'actions',
                header: 'الإجراءات',
                render: (row) => (
                  <div className="table-actions">
                    <Button size="sm" variant="secondary" icon={<LayoutGrid size={14} />} onClick={() => setDetailPost(row._raw)}>
                      عرض
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Modal isOpen={createOpen} title="منشور جديد" onClose={() => setCreateOpen(false)}>
        <form className="stack-sm" onSubmit={createPost}>
          <Input
            label="العنوان"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder="مثال: كيف أستخدم المحفظة عند الشراء؟"
            required
          />
          <Textarea
            label="المحتوى"
            rows={5}
            value={bodyAr}
            onChange={(e) => setBodyAr(e.target.value)}
            placeholder="اكتب سؤالك أو تجربتك بالتفصيل..."
            required
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={submitting} icon={<MessageCircle size={16} />}>نشر</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(detailPost)}
        title={detailPost?.titleAr || 'تفاصيل المنشور'}
        onClose={() => { setDetailPost(null); setDetailReply(''); }}
      >
        {detailPost ? (
          <div className="student-community-detail">
            <header className="community-post-head">
              <span className="community-avatar" aria-hidden>{getInitial(detailPost.user?.fullName)}</span>
              <div className="community-post-meta">
                <strong>{detailPost.user?.fullName || 'مستخدم'}</strong>
                <span>{fmtDate(detailPost.createdAt)}</span>
              </div>
            </header>
            <p className="community-post-body">{detailPost.bodyAr}</p>
            {renderComments(detailPost, true)}
            {renderReplyForm(detailPost.id, detailReply, setDetailReply, () => {
              studentApi.communityPosts().then((items) => {
                const updated = items.find((p: any) => p.id === detailPost.id);
                if (updated) setDetailPost(updated);
                setPosts(items);
              });
            })}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
