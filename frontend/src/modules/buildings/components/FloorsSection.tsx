import { useState } from 'react';
import { List, Button, App, Form, Input, Modal, Typography, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGetFloorsQuery, useCreateFloorMutation, useUpdateFloorMutation, useDeleteFloorMutation, useActivateFloorMutation, useDeactivateFloorMutation, type Floor } from '../floors.api';
import { useGenerateQrMutation } from '../qr.api';
import { QrModal } from './QrModal';
import { highlightText } from '@/shared/utils/highlightText';

const { Text } = Typography;

interface Props {
  buildingId: string;
  search?: string;
}

export function FloorsSection({ buildingId, search = '' }: Props) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { data: floors, isLoading } = useGetFloorsQuery({ buildingId });
  const [createFloor] = useCreateFloorMutation();
  const [updateFloor] = useUpdateFloorMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [activateFloor] = useActivateFloorMutation();
  const [deactivateFloor] = useDeactivateFloorMutation();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [generateQr] = useGenerateQrMutation();
  const [qrFloorId, setQrFloorId] = useState<string | null>(null);

  const handleGenerateQr = async (floorId: string) => {
    await generateQr({ entityType: 'floor', entityId: floorId }).unwrap();
    setQrFloorId(floorId);
  };

  const handleToggleActive = async (floor: Floor) => {
    try {
      const res = floor.isActive
        ? await deactivateFloor(floor.id).unwrap()
        : await activateFloor(floor.id).unwrap();
      if ((res as any)?.message) message.success((res as any).message);
    } catch { message.error(t('error.unexpected')); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        const res = await updateFloor({ id: editing.id, body: values }).unwrap();
        if ((res as any)?.message) message.success((res as any).message);
      } else {
        const res = await createFloor({ ...values, buildingId }).unwrap();
        if ((res as any)?.message) message.success((res as any).message);
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
      else message.error(t('error.unexpected'));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>{t('buildings.floors')}</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>{t('buildings.addFloor')}</Button>
      </div>
      <List
        size="small"
        loading={isLoading}
        dataSource={floors}
        renderItem={(item) => (
          <List.Item
            style={!item.isActive ? { opacity: 0.5 } : undefined}
            actions={[
              <Switch
                key="s"
                size="small"
                checked={item.isActive}
                onChange={() => handleToggleActive(item)}
                checkedChildren={t('common.active')}
          unCheckedChildren={t('common.inactive')}
              />,
              <Button key="qr" type="link" size="small" icon={<QrcodeOutlined />} onClick={() => handleGenerateQr(item.id)} />,
              <Button key="e" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(item); form.setFieldsValue(item); setModalOpen(true); }} />,
              <Button key="d" type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => {
                modal.confirm({
                  title: t('buildings.deleteFloor'),
                  icon: <ExclamationCircleOutlined />,
                  okText: t('common.delete'),
                  okType: 'danger',
                  cancelText: t('common.cancel'),
                  onOk: async () => { const res = await deleteFloor(item.id).unwrap(); if ((res as any)?.message) message.success((res as any).message); },
                });
              }} />,
            ]}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{highlightText(item.name, search)}</span>
              {item.description && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>— {highlightText(item.description, search)}</Text>}
              {item._count ? <Text type="secondary" style={{ marginLeft: 8 }}>({t('buildings.locationCount', { count: item._count.locations })})</Text> : null}
            </div>
          </List.Item>
        )}
      />
      <Modal 
            mask={{ enabled: true, blur: true }}
      title={editing ? t('buildings.editFloor') : t('buildings.newFloor')} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('buildings.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('buildings.description')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      {qrFloorId && (
        <QrModal entityType="floor" entityId={qrFloorId} onClose={() => setQrFloorId(null)} />
      )}
    </div>
  );
}
