import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatDateTime } from '../../utils/localeFormat';
import { exportTableToExcel } from '../../utils/exportExcel';

type PostStatusKey = 'answered' | 'unanswered';

export default function StudentCommunityPage() {
  const { t, i18n } = useTranslation('community');
  const { t: tc } = useTranslation('common');
  const lang = i18n.language;
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

  const getInitial = useCallback(
    (name?: string) => (name?.trim()?.[0] || tc('labels.unknownInitial')).toUpperCase(),
    [tc],
  );

  const fmtDate = useCallback(
    (value: string) => formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, lang),
    [lang],
  );

  const getPostStatusKey = useCallback((commentCount: number): PostStatusKey => (
    commentCount > 0 ? 'answered' : 'unanswered'
  ), []);

  const getPostStatusLabel = useCallback(
    (statusKey: PostStatusKey) => t(`student.status.${statusKey}`),
    [t, lang],
  );

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
    { label: t('student.charts.answered'), value: stats.answered },
    { label: t('student.charts.unanswered'), value: stats.unanswered },
  ].filter((d) => d.value > 0), [t, lang, stats.answered, stats.unanswered]);

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

  const exportColumns = useMemo(() => [
    { key: 'id', header: t('student.export.columns.id') },
    { key: 'author', header: t('student.export.columns.author') },
    { key: 'title', header: t('student.export.columns.title') },
    { key: 'body', header: t('student.export.columns.body') },
    { key: 'commentsCount', header: t('student.export.columns.commentsCount') },
    { key: 'status', header: t('student.export.columns.status') },
    { key: 'createdAt', header: t('student.export.columns.createdAt') },
  ], [t, lang]);

  const tableRows = useMemo(() => filteredPosts.map((post) => {
    const count = post.comments?.length || 0;
    const statusKey = getPostStatusKey(count);
    return {
      id: post.id,
      author: post.user?.fullName || '—',
      title: post.titleAr,
      body: post.bodyAr?.length > 60 ? `${post.bodyAr.slice(0, 60)}...` : post.bodyAr,
      commentsCount: count,
      statusKey,
      status: getPostStatusLabel(statusKey),
      createdAt: fmtDate(post.createdAt),
      _raw: post,
    };
  }), [filteredPosts, fmtDate, getPostStatusKey, getPostStatusLabel]);

  const createPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!titleAr.trim() || !bodyAr.trim()) return;
    setSubmitting(true);
    try {
      await studentApi.createCommunityPost({ titleAr: titleAr.trim(), bodyAr: bodyAr.trim() });
      showToast(t('student.toast.postPublished'), 'success');
      setCreateOpen(false);
      setTitleAr('');
      setBodyAr('');
      await load();
    } catch {
      showToast(t('student.toast.postFailed'), 'error');
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
      showToast(t('student.toast.commentAdded'), 'success');
      await load();
      onSuccess?.();
    } catch {
      showToast(t('student.toast.commentFailed'), 'error');
    } finally {
      setReplyingId(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('student.export.sheetName'),
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
                  <strong>{comment.user?.fullName || t('student.userFallback')}</strong>
                  {isAdmin ? <Badge variant="info">{t('student.badges.platformTeam')}</Badge> : null}
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
        placeholder={t('student.form.commentPlaceholder')}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('student.form.commentAriaLabel')}
      />
      <Button
        type="submit"
        size="sm"
        loading={replyingId === postId}
        icon={<Send size={14} />}
      >
        {t('student.actions.reply')}
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
              <strong>{post.user?.fullName || t('student.userFallback')}</strong>
              {isMine ? <Badge variant="info">{t('student.badges.yourPost')}</Badge> : null}
              {commentCount > 0 ? (
                <Badge variant="success">{t('student.badges.comments', { count: commentCount })}</Badge>
              ) : (
                <Badge variant="warning">{t('student.status.unanswered')}</Badge>
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

  const tableColumns = useMemo(() => [
    { key: 'id', header: t('student.table.columns.id') },
    { key: 'author', header: t('student.table.columns.author') },
    { key: 'title', header: t('student.table.columns.title') },
    {
      key: 'commentsCount',
      header: t('student.table.columns.comments'),
      render: (row: typeof tableRows[number]) => (
        <Badge variant={Number(row.commentsCount) > 0 ? 'success' : 'warning'}>
          {row.commentsCount}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('student.table.columns.status'),
      render: (row: typeof tableRows[number]) => (
        <Badge variant={row.statusKey === 'answered' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'createdAt', header: t('student.table.columns.createdAt') },
    {
      key: 'actions',
      header: t('student.table.columns.actions'),
      render: (row: typeof tableRows[number]) => (
        <div className="table-actions">
          <Button size="sm" variant="secondary" icon={<LayoutGrid size={14} />} onClick={() => setDetailPost(row._raw)}>
            {t('student.actions.view')}
          </Button>
        </div>
      ),
    },
  ], [t, lang]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-community-page">
      <div className="reports-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!posts.length}>
            {t('student.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
            {t('student.newPost')}
          </Button>
        </div>
      </div>

      <Card className="student-community-hero">
        <div className="student-community-hero-icon">
          <Users size={32} />
        </div>
        <div className="student-community-hero-body">
          <strong>{t('student.hero.title')}</strong>
          <p>{t('student.hero.body')}</p>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title={t('student.stats.posts')} value={String(stats.total)} icon={MessageCircle} />
        <StatCard title={t('student.stats.comments')} value={String(stats.comments)} icon={MessagesSquare} />
        <StatCard title={t('student.stats.mine')} value={String(stats.mine)} icon={UserRound} />
        <StatCard
          title={t('student.stats.answered')}
          value={String(stats.answered)}
          icon={MessageSquare}
          hint={t('student.stats.unansweredHint', { count: stats.unanswered })}
        />
      </div>

      {chartData.length ? (
        <div className="reports-charts-grid student-community-charts">
          <ReportChart title={t('student.charts.distribution')} type="pie" data={chartData} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setReplyFilter(''); setAuthorFilter(''); }}
      >
        <Select
          label={t('student.filters.comments')}
          value={replyFilter}
          onChange={(e) => setReplyFilter(e.target.value)}
          options={[
            { label: t('student.filters.all'), value: '' },
            { label: t('student.filters.answered'), value: 'answered' },
            { label: t('student.filters.unanswered'), value: 'unanswered' },
          ]}
        />
        <Select
          label={t('student.filters.author')}
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          options={[
            { label: t('student.filters.all'), value: '' },
            { label: t('student.filters.mine'), value: 'mine' },
          ]}
        />
      </FilterBar>

      <Tabs
        activeTab={viewMode}
        onChange={setViewMode}
        variant="pills"
        tabs={[
          { id: 'feed', label: t('student.tabs.feed', { count: filteredPosts.length }) },
          { id: 'table', label: t('student.tabs.table', { count: filteredPosts.length }) },
        ]}
      />

      {viewMode === 'feed' ? (
        <div className="community-feed">
          {filteredPosts.length ? (
            filteredPosts.map(renderPostCard)
          ) : (
            <Card>
              <EmptyState
                title={t('student.empty.title')}
                description={posts.length
                  ? t('student.empty.filteredDescription')
                  : t('student.empty.noPostsDescription')}
                icon={MessageCircle}
                actionLabel={t('student.newPost')}
                onAction={() => setCreateOpen(true)}
              />
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="section-heading">
            <h2><Table2 size={18} /> {t('student.table.title')}</h2>
            <span className="muted-count">{t('student.table.count', { count: filteredPosts.length })}</span>
          </div>
          <Table
            data={tableRows}
            emptyTitle={t('student.empty.title')}
            emptyDescription={t('student.table.emptyDescription')}
            columns={tableColumns}
          />
        </Card>
      )}

      <Modal isOpen={createOpen} title={t('student.newPost')} onClose={() => setCreateOpen(false)}>
        <form className="stack-sm" onSubmit={createPost}>
          <Input
            label={t('student.form.titleLabel')}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder={t('student.form.titlePlaceholder')}
            required
          />
          <Textarea
            label={t('student.form.bodyLabel')}
            rows={5}
            value={bodyAr}
            onChange={(e) => setBodyAr(e.target.value)}
            placeholder={t('student.form.bodyPlaceholder')}
            required
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" loading={submitting} icon={<MessageCircle size={16} />}>
              {t('student.actions.publish')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(detailPost)}
        title={detailPost?.titleAr || t('student.detail.title')}
        onClose={() => { setDetailPost(null); setDetailReply(''); }}
      >
        {detailPost ? (
          <div className="student-community-detail">
            <header className="community-post-head">
              <span className="community-avatar" aria-hidden>{getInitial(detailPost.user?.fullName)}</span>
              <div className="community-post-meta">
                <strong>{detailPost.user?.fullName || t('student.userFallback')}</strong>
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
