import { useState } from 'react';
import { List, Button, App, Form, Input, Modal, Select, Typography, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGetLocationsQuery, useCreateLocationMutation, useUpdateLocationMutation, useDeleteLocationMutation, useActivateLocationMutation, useDeactivateLocationMutation, type Location } from '../locations.api';
import { useGetFloorsQuery } from '../floors.api';
import { useGenerateQrMutation } from '../qr.api';
import { QrModal } from './QrModal';
import { highlightText } from '@/shared/utils/highlightText';

const { Text } = Typography;

interface Props {
  buildingId: string;
  search?: string;
}

export function LocationsSection({ buildingId, search = '' }: Props) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const { data: locations, isLoading } = useGetLocationsQuery({ buildingId });
  const { data: floors } = useGetFloorsQuery({ buildingId });
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const [deleteLocation] = useDeleteLocationMutation();
  const [activateLocation] = useActivateLocationMutation();
  const [deactivateLocation] = useDeactivateLocationMutation();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [generateQr] = useGenerateQrMutation();
  const [qrLocationId, setQrLocationId] = useState<string | null>(null);

  const handleGenerateQr = async (locationId: string) => {
    await generateQr({ entityType: 'location', entityId: locationId }).unwrap();
    setQrLocationId(locationId);
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const res = location.isActive
        ? await deactivateLocation(location.id).unwrap()
        : await activateLocation(location.id).unwrap();
      if ((res as any)?.message) message.success((res as any).message);
    } catch { message.error(t('error.unexpected')); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        const res = await updateLocation({ id: editing.id, body: values }).unwrap();
        if ((res as any)?.message) message.success((res as any).message);
      } else {
        const res = await createLocation({ ...values, buildingId }).unwrap();
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
        <Text strong>{t('buildings.locations')}</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>{t('buildings.addLocation')}</Button>
      </div>
      <List
        size="small"
        loading={isLoading}
        dataSource={locations}
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
              <Button key="e" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(item); form.setFieldsValue({ name: item.name, description: item.description, floorId: item.floorId }); setModalOpen(true); }} />,
              <Button key="d" type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => {
                modal.confirm({
                  title: t('buildings.deleteLocation'),
                  icon: <ExclamationCircleOutlined />,
                  okText: t('common.delete'),
                  okType: 'danger',
                  cancelText: t('common.cancel'),
                  onOk: async () => { const res = await deleteLocation(item.id).unwrap(); if ((res as any)?.message) message.success((res as any).message); },
                });
              }} />,
            ]}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{highlightText(item.name, search)}</span>
              {item.description && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>— {highlightText(item.description, search)}</Text>}
              {item.floor ? <Text type="secondary" style={{ marginLeft: 8 }}>({item.floor.name})</Text> : null}
            </div>
          </List.Item>
        )}
      />
      <Modal 
            mask={{ enabled: true, blur: true }}
      title={editing ? t('buildings.editLocation') : t('buildings.newLocation')} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('buildings.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="floorId" label={t('buildings.floorLabel')}>
            <Select allowClear options={floors?.map((f) => ({ label: f.name, value: f.id }))} />
          </Form.Item>
          <Form.Item name="description" label={t('buildings.description')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      {qrLocationId && (
        <QrModal entityType="location" entityId={qrLocationId} onClose={() => setQrLocationId(null)} />
      )}
    </div>
  );
}
