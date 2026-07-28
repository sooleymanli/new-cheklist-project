import { useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, App, Grid, Card,
  Pagination, Drawer, Descriptions, Timeline, Typography, Divider,
  Badge, theme, List,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined,
  UserOutlined, ClockCircleOutlined, FileTextOutlined, CalendarOutlined,
  EnvironmentOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/shared/hooks/useStore';
import { usePermissions } from '@/shared/hooks/usePermissions';
import {
  useGetChecklistInstancesQuery,
  useGetChecklistInstanceQuery,
  useGetInstanceHistoryQuery,
  useApproveChecklistInstanceMutation,
  useRejectChecklistInstanceMutation,
  type ChecklistInstance,
} from '../checklistInstances.api';
import { useGetUsersQuery } from '@/modules/users/users.api';
import type { User } from '@/modules/users/users.api';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  pending: 'blue',
  in_progress: 'orange',
  submitted: 'cyan',
  approved: 'green',
  rejected: 'red',
  overdue: 'volcano',
};

const STATUS_DOT: Record<string, string> = {
  pending: '#1677ff',
  in_progress: '#fa8c16',
  submitted: '#13c2c2',
  approved: '#52c41a',
  rejected: '#ff4d4f',
  overdue: '#fa541c',
};

const HISTORY_COLORS: Record<string, string> = {
  created: 'blue', started: 'orange', submitted: 'cyan',
  approved: 'green', rejected: 'red', reassigned: 'purple', overdue: 'volcano',
};

export default function ChecklistInstancesPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md === 'undefined' ? window.innerWidth < 992 : !screens.md;
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const { has } = usePermissions();

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || undefined;
  const assignedUserId = searchParams.get('assignedUserId') || undefined;
  const frequency = searchParams.get('frequency') || undefined;

  const setParam = (key: string, val?: string) =>
    setSearchParams((p) => { val ? p.set(key, val) : p.delete(key); p.set('page', '1'); return p; });

  const { data, isLoading } = useGetChecklistInstancesQuery(
    { page, pageSize, search, status, assignedUserId, frequency },
    { refetchOnMountOrArgChange: true },
  );
  const { data: usersData } = useGetUsersQuery({ pageSize: 200, status: 'active' });
  const { data: instanceDetail } = useGetChecklistInstanceQuery(detailId!, { skip: !detailId });
  const { data: instanceHistory } = useGetInstanceHistoryQuery(detailId!, { skip: !detailId });
  const [approveInstance] = useApproveChecklistInstanceMutation();
  const [rejectInstance] = useRejectChecklistInstanceMutation();

  const users: User[] = (usersData as any)?.data || [];

  const userLabel = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}` : '—';
  };

  const formatDate = (v?: string | null) => {
    if (!v) return '—';
    const d = new Date(v);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (v?: string | null) => !!v && new Date(v) < new Date();

  const handleApprove = async () => {
    if (!detailId) return;
    try {
      await approveInstance({ id: detailId }).unwrap();
      message.success(t('checklists.approved'));
    } catch (err: any) {
      message.error(err?.data?.message || t('common.error'));
    }
  };

  const handleReject = () => {
    if (!detailId) return;
    modal.confirm({
      title: t('checklists.reject'),
      content: (
        <Input.TextArea
          placeholder={t('checklists.rejectComment') || 'Şərh (isteğe bağlı)'}
          rows={3}
          onChange={(e) => setRejectComment(e.target.value)}
        />
      ),
      okButtonProps: { danger: true },
      okText: t('checklists.reject'),
      onOk: async () => {
        try {
          await rejectInstance({ id: detailId, comment: rejectComment }).unwrap();
          message.success(t('checklists.rejected'));
          setRejectComment('');
        } catch (err: any) {
          message.error(err?.data?.message || t('common.error'));
        }
      },
    });
  };

  const isCurrentApprover =
    instanceDetail?.status === 'submitted' &&
    instanceDetail?.assignment?.approvalSteps?.find(
      (s) => s.stepOrder === instanceDetail.currentApprovalStep,
    )?.approverId === currentUserId;

  const isSubmitted = instanceDetail?.status === 'submitted';
  const canApprove =
    isSubmitted &&
    (has('checklist-instance.approve-all') ||
      (has('checklist-instance.approve-own') && isCurrentApprover));
  const canReject =
    isSubmitted &&
    (has('checklist-instance.reject-all') ||
      (has('checklist-instance.reject-own') && isCurrentApprover));

  const hasActiveFilters = !!(search || status || assignedUserId || frequency);

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: t('checklists.templateName'),
      ellipsis: true,
      width: 260,
      render: (_: unknown, r: ChecklistInstance) => {
        const name = r.assignment?.name || r.template?.name;
        const desc = r.assignment?.description || r.template?.description;
        return (
          <Space size={8} align="start">
            <FileTextOutlined style={{ color: token.colorPrimary, marginTop: 3, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <Text strong ellipsis style={{ display: 'block', maxWidth: 200 }}>{name}</Text>
              {desc && <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12, maxWidth: 200 }}>{desc}</Text>}
            </div>
          </Space>
        );
      },
    },
    {
      title: t('checklists.assignedUser'),
      width: 160,
      responsive: ['md'] as any,
      render: (_: unknown, r: ChecklistInstance) => (
        <Space size={6}>
          <TeamOutlined style={{ color: token.colorTextSecondary }} />
          <Text style={{ fontSize: 13 }}>
            {r.assignedUser
              ? `${r.assignedUser.firstName} ${r.assignedUser.lastName}`
              : userLabel(r.assignedUserId || '')}
          </Text>
        </Space>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 145,
      render: (v: string) => (
        <Badge color={STATUS_DOT[v]} text={
          <Tag color={STATUS_COLORS[v]} style={{ margin: 0 }}>{t(`checklists.instanceStatus_${v}`)}</Tag>
        } />
      ),
    },
    {
      title: t('checklists.dueAt'),
      dataIndex: 'dueAt',
      width: 170,
      responsive: ['lg'] as any,
      render: (v: string) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: isOverdue(v) ? token.colorError : token.colorTextSecondary }} />
          <Text type={isOverdue(v) ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>{formatDate(v)}</Text>
        </Space>
      ),
    },
    {
      title: '',
      width: 48,
      render: (_: unknown, r: ChecklistInstance) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
          onClick={() => setDetailId(r.id)}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter bar */}
      <Card size="small" styles={{ body: { padding: '10px 16px' } }} style={{ borderRadius: token.borderRadiusLG }}>
        <Space wrap style={{ width: '100%' }}>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
            value={search}
            onChange={(e) => setParam('search', e.target.value || undefined)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder={t('common.status')}
            value={status}
            onChange={(val) => setParam('status', val)}
            style={{ width: 170 }}
            allowClear
            options={[
              { label: t('checklists.instanceStatus_pending'), value: 'pending' },
              { label: t('checklists.instanceStatus_in_progress'), value: 'in_progress' },
              { label: t('checklists.instanceStatus_submitted'), value: 'submitted' },
              { label: t('checklists.instanceStatus_approved'), value: 'approved' },
              { label: t('checklists.instanceStatus_rejected'), value: 'rejected' },
              { label: t('checklists.instanceStatus_overdue'), value: 'overdue' },
            ]}
          />
          <Select
            placeholder={t('checklists.assignedUser')}
            value={assignedUserId}
            onChange={(val) => setParam('assignedUserId', val)}
            style={{ width: 200 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map((u) => ({
              label: `${u.firstName} ${u.lastName}`,
              value: u.id,
            }))}
          />
          <Select
            placeholder={t('inspections.recurrence')}
            value={frequency}
            onChange={(val) => setParam('frequency', val)}
            style={{ width: 170 }}
            allowClear
            options={[
              { label: t('inspections.recurrence_once'), value: 'once' },
              { label: t('inspections.recurrence_daily'), value: 'daily' },
              { label: t('inspections.recurrence_weekly'), value: 'weekly' },
              { label: t('inspections.recurrence_monthly'), value: 'monthly' },
              { label: t('inspections.recurrence_quarterly'), value: 'quarterly' },
              { label: t('inspections.recurrence_yearly'), value: 'yearly' },
              { label: t('inspections.recurrence_custom'), value: 'custom' },
            ]}
          />
          {hasActiveFilters && (
            <Button onClick={() => setSearchParams((p) => {
              ['search', 'status', 'assignedUserId', 'frequency'].forEach((k) => p.delete(k));
              p.set('page', '1');
              return p;
            })}>
              {t('common.clearFilters')}
            </Button>
          )}
        </Space>
      </Card>

      {/* Table / Cards */}
      {isMobile ? (
        <>
          {(data?.data ?? []).map((instance: ChecklistInstance) => {
            const name = instance.assignment?.name || instance.template?.name;
            const overdue = isOverdue(instance.dueAt);
            return (
              <Card
                key={instance.id}
                size="small"
                style={{
                  marginBottom: 10,
                  borderRadius: token.borderRadiusLG,
                  borderLeft: `4px solid ${STATUS_DOT[instance.status] ?? token.colorBorder}`,
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: 14 } }}
                onClick={() => setDetailId(instance.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text strong style={{ display: 'block' }}>{name}</Text>
                    <Space size={4} style={{ marginTop: 6, flexWrap: 'wrap' as const }}>
                      <Tag color={STATUS_COLORS[instance.status]} style={{ margin: 0 }}>
                        {t(`checklists.instanceStatus_${instance.status}`)}
                      </Tag>
                      {instance.dueAt && (
                        <Text type={overdue ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />{formatDate(instance.dueAt)}
                        </Text>
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      <TeamOutlined style={{ marginRight: 4 }} />
                      {instance.assignedUser
                        ? `${instance.assignedUser.firstName} ${instance.assignedUser.lastName}`
                        : userLabel(instance.assignedUserId || '')}
                    </Text>
                  </div>
                  <EyeOutlined style={{ color: token.colorPrimary, fontSize: 16, marginLeft: 8 }} />
                </div>
              </Card>
            );
          })}
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.meta?.total}
            simple
            style={{ textAlign: 'center', marginTop: 8 }}
            onChange={(p, ps) => setSearchParams((prev) => { prev.set('page', String(p)); prev.set('pageSize', String(ps)); return prev; })}
          />
        </>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          size="middle"
          scroll={{ x: 820, y: 'calc(100vh - 340px)' }}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total,
            showSizeChanger: true,
            showQuickJumper: true,
            position: ['bottomRight'],
            onChange: (p, ps) => setSearchParams((prev) => { prev.set('page', String(p)); prev.set('pageSize', String(ps)); return prev; }),
          }}
          rowClassName={(r: ChecklistInstance) => r.status === 'overdue' ? 'ci-row-overdue' : ''}
          style={{ borderRadius: token.borderRadiusLG }}
          sticky
        />
      )}

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            {instanceDetail?.assignment?.name || instanceDetail?.template?.name || t('checklists.instanceDetail')}
          </Space>
        }
        open={!!detailId}
        onClose={() => setDetailId(null)}
        width={isMobile ? '100%' : 540}
        extra={
          (canApprove || canReject) && (
            <Space>
              {canApprove && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                  {t('checklists.approve')}
                </Button>
              )}
              {canReject && (
                <Button danger icon={<CloseOutlined />} onClick={handleReject}>
                  {t('checklists.reject')}
                </Button>
              )}
            </Space>
          )
        }
      >
        {instanceDetail && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label={t('common.status')}>
                <Badge color={STATUS_DOT[instanceDetail.status]} text={
                  <Tag color={STATUS_COLORS[instanceDetail.status]} style={{ margin: 0 }}>
                    {t(`checklists.instanceStatus_${instanceDetail.status}`)}
                  </Tag>
                } />
              </Descriptions.Item>
              <Descriptions.Item label={t('checklists.assignedUser')}>
                <Space>
                  <UserOutlined />
                  {instanceDetail.assignedUser
                    ? `${instanceDetail.assignedUser.firstName} ${instanceDetail.assignedUser.lastName}`
                    : userLabel(instanceDetail.assignedUserId || '')}
                </Space>
              </Descriptions.Item>
              {instanceDetail.location && (
                <Descriptions.Item label={t('checklists.location')}>
                  <Space>
                    <EnvironmentOutlined />
                    {instanceDetail.location.building?.name} / {instanceDetail.location.name}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('checklists.dueAt')}>
                <Text type={isOverdue(instanceDetail.dueAt) ? 'danger' : undefined}>
                  {formatDate(instanceDetail.dueAt)}
                </Text>
              </Descriptions.Item>
              {instanceDetail.startedAt && (
                <Descriptions.Item label={t('checklists.startedAt')}>{formatDate(instanceDetail.startedAt)}</Descriptions.Item>
              )}
              {instanceDetail.submittedAt && (
                <Descriptions.Item label={t('checklists.submittedAt')}>{formatDate(instanceDetail.submittedAt)}</Descriptions.Item>
              )}
            </Descriptions>

            {/* Approval Chain */}
            {instanceDetail.assignment?.requiresApproval && instanceDetail.assignment.approvalSteps?.length > 0 && (
              <>
                <Divider style={{ fontSize: 13 }}>{t('checklists.approvalChain')}</Divider>
                <div style={{ marginBottom: 16 }}>
                  {[...instanceDetail.assignment.approvalSteps]
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((step) => {
                      const isCurrent = instanceDetail.currentApprovalStep === step.stepOrder;
                      return (
                        <div key={step.stepOrder} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                          background: isCurrent ? token.colorPrimaryBg : token.colorFillAlter,
                          border: `1px solid ${isCurrent ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                        }}>
                          <UserOutlined style={{ color: isCurrent ? token.colorPrimary : token.colorTextSecondary }} />
                          <Text strong={isCurrent} style={{ flex: 1 }}>{step.approverName || step.approverId}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{t('checklists.step')} {step.stepOrder}</Text>
                          {isCurrent && <Tag color="processing">{t('checklists.currentStep')}</Tag>}
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {/* History */}
            <Divider style={{ fontSize: 13 }}>{t('checklists.history')}</Divider>
            {instanceHistory && instanceHistory.length > 0 ? (
              <Timeline
                items={instanceHistory.map((entry) => ({
                  color: HISTORY_COLORS[entry.action] || 'gray',
                  children: (
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{t(`checklists.historyAction_${entry.action}`)}</Text>
                      {entry.performedBy && (
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                          — {entry.performedBy.firstName} {entry.performedBy.lastName}
                        </Text>
                      )}
                      {entry.comment && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{entry.comment}</div>}
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />{formatDate(entry.createdAt)}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Text type="secondary">{t('checklists.noHistory')}</Text>
            )}
          </>
        )}
      </Drawer>

      <style>{`
        .ci-row-overdue td { background: rgba(255,77,79,0.04) !important; }
        .ci-row-overdue:hover td { background: rgba(255,77,79,0.08) !important; }
      `}</style>
    </div>
  );
}
