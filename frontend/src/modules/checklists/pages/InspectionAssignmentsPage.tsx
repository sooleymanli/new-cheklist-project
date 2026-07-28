import { useState } from 'react';
import { Table, Button, Space, Tag, Input, App, Grid, Card, List, Pagination, Switch, Popconfirm, Tooltip, Modal, Timeline, Select } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, UserOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useGetInspectionAssignmentsQuery,
  useDeleteInspectionAssignmentMutation,
  useUpdateInspectionAssignmentMutation,
  useGetApprovalHistoryQuery,
  type InspectionAssignment,
  type RecurrenceType,
} from '../inspectionAssignments.api';
import { useGetUsersQuery } from '@/modules/users/users.api';

const RECURRENCE_COLORS: Record<RecurrenceType, string> = {
  once: 'default',
  daily: 'blue',
  custom: 'geekblue',
  weekly: 'cyan',
  monthly: 'green',
  quarterly: 'orange',
  yearly: 'purple',
};

export default function InspectionAssignmentsPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md === 'undefined' ? window.innerWidth < 768 : !screens.md;
  const [historyInstanceId, setHistoryInstanceId] = useState<string | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const filterAssignee = searchParams.get('assigneeId') || '';
  const filterRecurrence = searchParams.get('recurrenceType') || '';

  const { data, isLoading } = useGetInspectionAssignmentsQuery({
    page, pageSize, search,
    ...(filterAssignee ? { assigneeId: filterAssignee } : {}),
    ...(filterRecurrence ? { recurrenceType: filterRecurrence } : {}),
  });
  const { data: usersData } = useGetUsersQuery({ pageSize: 200, status: 'active' });
  const users: { id: string; firstName: string; lastName: string }[] = (usersData as any)?.data || [];
  const [deleteAssignment] = useDeleteInspectionAssignmentMutation();
  const [updateAssignment] = useUpdateInspectionAssignmentMutation();

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value); else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword?.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} style={{ background: '#ffe58f', padding: 0 }}>{part}</mark> : part,
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(id).unwrap();
      message.success(t('common.deleted'));
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateAssignment({ id, body: { isActive } }).unwrap();
      message.success(t('common.saved'));
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  const columns = [
    {
      title: t('inspections.name'),
      dataIndex: 'name',
      width: 240,
      render: (_: unknown, r: InspectionAssignment) => (
        <div>
          <a onClick={() => navigate(`/inspection-assignments/${r.id}`)} style={{ fontWeight: 600 }}>
            {highlightText(r.name || r.template?.name || r.templateName || '-', search)}
          </a>
          {r.description && (
            <div style={{ fontSize: 12, color: '#aaa', whiteSpace: 'normal' }}>
              {highlightText(r.description, search)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('inspections.templateName'),
      dataIndex: 'templateName',
      width: 200,
      render: (_: unknown, r: InspectionAssignment) => (
        <a onClick={() => navigate(`/checklist-templates/${r.templateId}`)}>
          {highlightText(r.template?.name || r.templateName || '-', search)}
        </a>
      ),
    },
    {
      title: t('inspections.assignees'),
      responsive: ['md'] as any,
      width: 200,
      render: (_: unknown, r: InspectionAssignment) => {
        const assignees = r.assignees || [];
        if (assignees.length === 0) return <Tag icon={<UserOutlined />}>{r.assigneeIds.length} {t('inspections.people')}</Tag>;
        return (
          <Space size={4} wrap>
            {assignees.map((a) => (
              <Tag key={a.id} icon={<UserOutlined />} style={{ margin: 0 }}>{a.firstName} {a.lastName}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t('inspections.recurrence'),
      dataIndex: 'recurrenceType',
      width: 120,
      render: (v: RecurrenceType) => <Tag color={RECURRENCE_COLORS[v]}>{t(`inspections.recurrence_${v}`)}</Tag>,
    },
    {
      title: t('inspections.timeWindow'),
      width: 140,
      responsive: ['lg'] as any,
      render: (_: unknown, r: InspectionAssignment) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#666' }}>
          <ClockCircleOutlined style={{ fontSize: 12 }} />
          {r.timeWindowStart} — {r.timeWindowEnd}
        </span>
      ),
    },
    {
      title: t('inspections.approval'),
      width: 110,
      responsive: ['lg'] as any,
      render: (_: unknown, r: InspectionAssignment) =>
        r.requiresApproval
          ? <Tag color="blue" icon={<CheckCircleOutlined />}>{r.approvalSteps.length} {t('inspections.steps')}</Tag>
          : <Tag color="default">—</Tag>,
    },
    {
      title: t('common.status'),
      width: 90,
      render: (_: unknown, r: InspectionAssignment) => (
        <Switch
          checked={r.isActive}
          checkedChildren={t('common.active')}
          unCheckedChildren={t('common.inactive')}
          onChange={(checked) => handleToggleActive(r.id, checked)}
        />
      ),
    },
    {
      title: t('common.actions'),
      width: 90,
      render: (_: unknown, r: InspectionAssignment) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/inspection-assignments/${r.id}`)} />
          </Tooltip>
          <Popconfirm
            title={t('common.confirmDelete')}
            onConfirm={() => handleDelete(r.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
          <Select
            placeholder={t('inspections.filterByAssignee')}
            value={filterAssignee || undefined}
            onChange={(val) => updateParam('assigneeId', val || '')}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: isMobile ? '100%' : 200 }}
            suffixIcon={<UserOutlined />}
            options={users.map((u) => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))}
          />
          <Select
            placeholder={t('inspections.filterByRecurrence')}
            value={filterRecurrence || undefined}
            onChange={(val) => updateParam('recurrenceType', val || '')}
            allowClear
            style={{ width: isMobile ? '100%' : 160 }}
            suffixIcon={<FilterOutlined />}
            options={(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'] as const).map((v) => ({
              label: t(`inspections.recurrence_${v}`),
              value: v,
            }))}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inspection-assignments/new')}>
          {t('inspections.assign')}
        </Button>
      </div>

      {isMobile ? (
        <>
          <List
            loading={isLoading}
            dataSource={data?.data || []}
            renderItem={(item: InspectionAssignment) => (
              <Card
                size="small"
                style={{ marginBottom: 8, borderLeft: `3px solid ${item.isActive ? '#52c41a' : '#d9d9d9'}` }}
                hoverable
                onClick={() => navigate(`/inspection-assignments/${item.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{highlightText(item.name || item.template?.name || item.templateName || '', search)}</div>
                    <a
                      style={{ fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/checklist-templates/${item.templateId}`); }}
                    >
                      {highlightText(item.template?.name || item.templateName || '', search)}
                    </a>
                    {item.description && (
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{highlightText(item.description, search)}</div>
                    )}
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserOutlined style={{ fontSize: 11 }} />
                      {item.assignees?.map((a) => `${a.firstName} ${a.lastName}`).join(', ') || `${item.assigneeIds.length} ${t('inspections.people')}`}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Tag color={RECURRENCE_COLORS[item.recurrenceType]} style={{ margin: 0 }}>{t(`inspections.recurrence_${item.recurrenceType}`)}</Tag>
                      <span style={{ fontSize: 11, color: '#999', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <ClockCircleOutlined style={{ fontSize: 10 }} />
                        {item.timeWindowStart} — {item.timeWindowEnd}
                      </span>
                      {item.requiresApproval && (
                        <Tag color="blue" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>{item.approvalSteps.length} {t('inspections.steps')}</Tag>
                      )}
                    </div>
                  </div>
                  <Switch
                    size="small"
                    checked={item.isActive}
                    onChange={(checked, e) => { e.stopPropagation(); handleToggleActive(item.id, checked); }}
                  />
                </div>
              </Card>
            )}
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination
              current={page}
              pageSize={pageSize}
              total={data.meta.total}
              onChange={(p) => setSearchParams({ search, page: String(p) })}
              style={{ textAlign: 'center', marginTop: 16 }}
              simple
            />
          )}
        </>
      ) : (
        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 500, y: 'calc(100vh - 320px)' }}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total,
            showSizeChanger: true,
            position: ['bottomRight'],
            onChange: (p, ps) => setSearchParams({ search, page: String(p), pageSize: String(ps) }),
          }}
          size="small"
          sticky
        />
      )}

      {/* Approval History Modal */}
      <ApprovalHistoryModal
        instanceId={historyInstanceId}
        onClose={() => setHistoryInstanceId(null)}
      />
    </div>
  );
}

function ApprovalHistoryModal({ instanceId, onClose }: { instanceId: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: history, isLoading } = useGetApprovalHistoryQuery(instanceId!, { skip: !instanceId });

  return (
    <Modal
      title={t('inspections.approvalHistory')}
      open={!!instanceId}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>...</div>
      ) : (
        <Timeline
          items={(history || []).map((entry) => ({
            color: entry.action === 'approved' ? 'green' : 'red',
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>
                  {t(`inspections.step`)} {entry.stepOrder}: {entry.approverName || entry.approverId}
                </div>
                <div>
                  <Tag color={entry.action === 'approved' ? 'green' : 'red'}>
                    {t(`inspections.action_${entry.action}`)}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                {entry.comment && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{entry.comment}</div>
                )}
              </div>
            ),
          }))}
        />
      )}
    </Modal>
  );
}
