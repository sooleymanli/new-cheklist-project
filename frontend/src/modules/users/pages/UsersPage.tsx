import { useState, useMemo } from 'react';
import { Table, Button, Space, Tag, Input, Select, App, Switch, Grid, Card, List, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  type User,
} from '../users.api';
import { useGetRolesSelectQuery } from '@/modules/roles/roles.api';
import { UserFormModal } from '../components/UserFormModal';
import { highlightText } from '@/shared/utils/highlightText';

const ROLE_COLORS = ['blue', 'green', 'purple', 'orange', 'cyan', 'magenta', 'gold', 'red', 'geekblue', 'lime'];

export default function UsersPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md === 'undefined' ? window.innerWidth < 768 : !screens.md;

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const roleId = searchParams.get('roleId') || undefined;
  const status = (searchParams.get('status') as 'active' | 'inactive') || undefined;

  const { data, isLoading } = useGetUsersQuery({ page, pageSize, search, roleId, status });
  const { data: roles } = useGetRolesSelectQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      message.success(t('common.delete') + ' ✓');
    } catch (err: any) {
      message.error(err?.data?.message || 'Error');
    }
  };

  const confirmDelete = (id: string) => {
    modal.confirm({
      title: t('users.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => handleDelete(id),
      centered:true
    });
  };

  const handleToggleStatus = async (user: User) => {
    try {
      let res;
      if (user.isActive) {
        res = await deactivateUser(user.id).unwrap();
      } else {
        res = await activateUser(user.id).unwrap();
      }
      message.success(res.message);
    } catch (err: any) {
      message.error(err?.data?.message || 'Error');
    }
  };

  const roleColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    roles?.forEach((r, i) => { map[r.name] = ROLE_COLORS[i % ROLE_COLORS.length]!; });
    return map;
  }, [roles]);

  const columns = [
      {
      title: t('users.fullName'),
      render: (_: unknown, record: User) => <strong>{highlightText(`${record.firstName} ${record.lastName}`, search)}</strong>,
    },
    {
      title: t('users.role'),
      dataIndex: ['role', 'name'],
      render: (roleName: string) => (
        <Tag color={roleColorMap[roleName] || 'default'}>{roleName}</Tag>
      ),
    },
    {
      title: t('users.position'),
      dataIndex: 'position',
      responsive: ['lg'] as any,
      render: (text: string) => text ? highlightText(text, search) : '-',
    },

    {
      title: t('auth.email'),
      dataIndex: 'email',
      responsive: ['md'] as any,
      render: (text: string) => highlightText(text, search),
    },
  
        {
      title: t('common.status'),
      dataIndex: 'isActive',
      width: 90,
      render: (isActive: boolean, record: User) => (
        <Switch
          checked={isActive}
          checkedChildren={t('common.active')}
          unCheckedChildren={t('common.inactive')}
          onChange={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: t('common.actions'),
      width: 100,
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditingUser(record); setModalOpen(true); }}
          />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record.id)} />
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
            onChange={(e) => setSearchParams((prev) => { prev.set('search', e.target.value); prev.set('page', '1'); return prev; })}
            style={{ width: isMobile ? '100%' : 220 }}
            allowClear
          />
          <Select
            placeholder={t('users.role')}
            value={roleId}
            onChange={(val) => setSearchParams((prev) => { if (val) prev.set('roleId', val); else prev.delete('roleId'); prev.set('page', '1'); return prev; })}
            style={{ width: isMobile ? '100%' : 160 }}
            allowClear
            options={roles?.map((r) => ({ label: r.name, value: r.id }))}
          />
          <Select
            placeholder={t('common.status')}
            value={status || undefined}
            onChange={(val) => setSearchParams((prev) => { if (val) prev.set('status', val); else prev.delete('status'); prev.set('page', '1'); return prev; })}
            style={{ width: isMobile ? '100%' : 140 }}
            allowClear
            options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} block={isMobile} onClick={() => { setEditingUser(null); setModalOpen(true); }}>
          {t('common.create')}
        </Button>
      </div>

      {isMobile ? (
        <>
          <List
            loading={isLoading}
            dataSource={data?.data}
            renderItem={(user: User) => (
              <Card
                size="small"
                style={{ marginBottom: 8, ...(!user.isActive && { opacity: 0.5 }) }}
                actions={[
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingUser(user); setModalOpen(true); }} />,
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(user.id)} />,
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{highlightText(`${user.firstName} ${user.lastName}`, search)}</strong>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{highlightText(user.email, search)}</div>
                    {user.position && <div style={{ fontSize: 12, color: '#888' }}>{highlightText(user.position, search)}</div>}
                    <Tag color={roleColorMap[user.role?.name] || 'default'} style={{ marginTop: 4 }}>{user.role?.name}</Tag>
                  </div>
                  <Switch
                    checked={user.isActive}
                    checkedChildren={t('common.active')}
                    unCheckedChildren={t('common.inactive')}
                    onChange={() => handleToggleStatus(user)}
                  />
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
          loading={isLoading}
          scroll={{ x: 500, y: 'calc(100vh - 320px)' }}
          rowClassName={(record) => !record.isActive ? 'row-disabled' : ''}
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

      <UserFormModal
        open={modalOpen}
        user={editingUser}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
      />
    </div>
  );
}
