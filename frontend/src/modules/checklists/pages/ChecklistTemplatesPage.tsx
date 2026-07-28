import { Table, Button, Space, Tag, Input, Select, App, Switch, Grid, Card, List, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CopyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useGetChecklistTemplatesQuery,
  useDeleteChecklistTemplateMutation,
  useActivateChecklistTemplateMutation,
  useDeactivateChecklistTemplateMutation,
  useDuplicateChecklistTemplateMutation,
  type ChecklistTemplate,
} from '../checklistTemplates.api';
import { highlightText } from '@/shared/utils/highlightText';

export default function ChecklistTemplatesPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md === 'undefined' ? window.innerWidth < 768 : !screens.md;

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || undefined;

  const { data, isLoading } = useGetChecklistTemplatesQuery({ page, pageSize, search, status });
  const [deleteTemplate] = useDeleteChecklistTemplateMutation();
  const [activateTemplate] = useActivateChecklistTemplateMutation();
  const [deactivateTemplate] = useDeactivateChecklistTemplateMutation();
  const [duplicateTemplate] = useDuplicateChecklistTemplateMutation();

  const handleDelete = (id: string) => {
    modal.confirm({
      title: t('checklists.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      centered: true,
      onOk: async () => {
        try {
          const res: any = await deleteTemplate(id).unwrap();
          if (res?.message) message.success(res.message);
        } catch { message.error(t('error.unexpected')); }
      },
    });
  };

  const handleToggleActive = async (template: ChecklistTemplate) => {
    try {
      const res: any = template.status === 'active'
        ? await deactivateTemplate(template.id).unwrap()
        : await activateTemplate(template.id).unwrap();
      if (res?.message) message.success(res.message);
    } catch (err: any) {
      message.error(err?.data?.message || t('error.unexpected'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res: any = await duplicateTemplate(id).unwrap();
      if (res?.message) message.success(res.message);
    } catch { message.error(t('error.unexpected')); }
  };

  const columns = [
    {
      title: t('checklists.templateName'),
      dataIndex: 'name',
      width: 200,
      render: (v: string, record: ChecklistTemplate) => (
        <a onClick={() => navigate(`/checklist-templates/${record.id}`)}><strong>{highlightText(v, search)}</strong></a>
      ),
    },
    {
      title: t('checklists.fields'),
      responsive: ['md'] as any,
      width: 90,
      render: (_: unknown, r: ChecklistTemplate) => {
        const tableField = (r as any).fields?.[0];
        if (tableField?.fieldConfig?.tableColumns) {
          return tableField.fieldConfig.tableColumns.length;
        }
        return r._count?.fields ?? 0;
      },
    },
    {
      title: t('checklists.locations'),
      responsive: ['md'] as any,
      width: 110,
      render: (_: unknown, r: ChecklistTemplate) => r._count?.locations ?? 0,
    },
    {
      title: t('checklists.instances'),
      responsive: ['lg'] as any,
      width: 100,
      render: (_: unknown, r: ChecklistTemplate) => r._count?.instances ?? 0,
    },
    {
      title: t('common.status'),
      width: 100,
      render: (_: unknown, record: ChecklistTemplate) => (
        <Switch
          checked={record.status === 'active'}
          checkedChildren={t('common.active')}
          unCheckedChildren={t('common.inactive')}
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: t('common.actions'),
      width: 150,
      render: (_: unknown, record: ChecklistTemplate) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/checklist-templates/${record.id}`)} />
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleDuplicate(record.id)} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
        <Space wrap style={{ width: isMobile ? '100%' : 'auto' }} direction={isMobile ? 'vertical' : 'horizontal'}>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearchParams((p) => {
              const val = e.target.value;
              if (val) { p.set('search', val); } else { p.delete('search'); }
              p.set('page', '1');
              return p;
            })}
            style={{ width: isMobile ? '100%' : 220 }}
            allowClear
          />
          <Select
            placeholder={t('common.status')}
            value={status}
            onChange={(val) => setSearchParams((p) => { if (val) p.set('status', val); else p.delete('status'); p.set('page', '1'); return p; })}
            style={{ width: isMobile ? '100%' : 140 }}
            allowClear
            options={[
              { label: t('checklists.status_draft'), value: 'draft' },
              { label: t('checklists.status_active'), value: 'active' },
              { label: t('checklists.status_inactive'), value: 'inactive' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} block={isMobile} onClick={() => navigate('/checklist-templates/new')}>
          {t('common.create')}
        </Button>
      </div>

      {isMobile ? (
        <>
          <List
            loading={isLoading}
            dataSource={data?.data}
            renderItem={(template: ChecklistTemplate) => (
              <Card
                size="small"
                style={{ marginBottom: 8, ...(template.status === 'inactive' && { opacity: 0.5 }), cursor: 'pointer' }}
                onClick={() => navigate(`/checklist-templates/${template.id}`)}
                actions={[
                  <Button type="link" size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); handleDuplicate(template.id); }} />,
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/checklist-templates/${template.id}`); }} />,
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }} />,
                ]}
              >
                <div>
                  <strong>{highlightText(template.name, search)}</strong>
                  {template.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{template.description}</div>}
                  <Space size="small" style={{ marginTop: 4 }} wrap>
                    <Switch
                      size="small"
                      checked={template.status === 'active'}
                      checkedChildren={t('common.active')}
                      unCheckedChildren={t('common.inactive')}
                      onChange={(_, e) => { e.stopPropagation(); handleToggleActive(template); }}
                    />
                    <Tag>{t('checklists.fields')}: {template._count?.fields ?? 0}</Tag>
                    <Tag>{t('checklists.locations')}: {template._count?.locations ?? 0}</Tag>
                    <Tag>{t('checklists.instances')}: {template._count?.instances ?? 0}</Tag>
                  </Space>
                </div>
              </Card>
            )}
          />
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.meta?.total}
            simple
            style={{ textAlign: 'center', marginTop: 12 }}
            onChange={(p, ps) => setSearchParams((prev) => { prev.set('page', String(p)); prev.set('pageSize', String(ps)); return prev; })}
          />
        </>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
                    size="small"
          loading={isLoading}
          scroll={{ x: 600, y: 'calc(100vh - 320px)' }}
          rowClassName={(record) => record.status === 'inactive' ? 'row-disabled' : ''}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total,
            showSizeChanger: true,
            position: ['bottomRight'],
            onChange: (p, ps) => setSearchParams((prev) => { prev.set('page', String(p)); prev.set('pageSize', String(ps)); return prev; }),
          }}
          sticky
        />
      )}
    </div>
  );
}
