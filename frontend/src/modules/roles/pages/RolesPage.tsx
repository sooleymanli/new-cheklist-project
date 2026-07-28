import { useState } from 'react';
import { Table, Button, Space, App, Tag, Grid, Card, List, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  type Role,
} from '../roles.api';
import { RoleFormModal } from '../components/RoleFormModal';
import { PermissionsModal } from '../components/PermissionsModal';

export default function RolesPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md === 'undefined' ? window.innerWidth < 768 : !screens.md;
  const { data: roles, isLoading } = useGetRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [permRole, setPermRole] = useState<Role | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteRole(id).unwrap();
      message.success(res.message || '✓');
    } catch (err: any) {
      message.error(err?.data?.message || t('error.unexpected'));
    }
  };

  const confirmDelete = (id: string) => {
    modal.confirm({
      title: t('roles.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => handleDelete(id),
      centered: true,
    });
  };

  const renderPermissionsTag = (role: Role) => {
    const count = role._count?.permissions || 0;
    if (count === 0) return <Tag>{t('roles.noPermissions')}</Tag>;
    return (
        <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => setPermRole(role)}>
          {t('roles.permissionCount', { count })}
        </Tag>
    );
  };

  const columns = [
    { title: t('roles.name'), dataIndex: 'name', render: (text: string) => <strong>{text}</strong> },
    { title: t('roles.description'), dataIndex: 'description', responsive: ['md'] as any },
    {
      title: t('roles.permissions'),
      responsive: ['sm'] as any,
      render: (_: unknown, record: Role) => renderPermissionsTag(record),
    },
    {
      title: t('common.actions'),
      width: 130,
      render: (_: unknown, record: Role) => (
        <Space size="small">
          <Tooltip title={t('roles.permissions')}>
            <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => setPermRole(record)} />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRole(record); setFormOpen(true); }} />
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); setFormOpen(true); }}>
          { t('common.create')}
        </Button>
      </div>

      {isMobile ? (
        <List
          loading={isLoading}
          dataSource={roles}
          renderItem={(role: Role) => (
            <Card
              size="small"
              style={{ marginBottom: 8 }}
              actions={[
                <Tooltip title={t('roles.permissions')} key="perm">
                  <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => setPermRole(role)} />
                </Tooltip>,
                <Tooltip title={t('common.edit')} key="edit">
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRole(role); setFormOpen(true); }} />
                </Tooltip>,
                <Tooltip title={t('common.delete')} key="del">
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(role.id)} />
                </Tooltip>,
              ]}
            >
              <strong>{role.name}</strong>
              {role.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{role.description}</div>}
              <div style={{ marginTop: 6 }}>{renderPermissionsTag(role)}</div>
            </Card>
          )}
        />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={roles} loading={isLoading} pagination={false} scroll={{ x: 400 }} />
      )}

      <RoleFormModal open={formOpen} role={editingRole} onClose={() => { setFormOpen(false); setEditingRole(null); }} />
      <PermissionsModal role={permRole} onClose={() => setPermRole(null)} />
    </div>
  );
}
