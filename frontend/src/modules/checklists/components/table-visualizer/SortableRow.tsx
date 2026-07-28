import { Button, Input, InputNumber, Select } from 'antd';
import { HolderOutlined, DeleteOutlined, CameraOutlined, UploadOutlined, EditOutlined, QrcodeOutlined, FunctionOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TableColumn, TableLocation } from './types';

interface SortableRowProps {
  loc: TableLocation;
  columns: TableColumn[];
  onLocationsChange: (locations: TableLocation[]) => void;
  locations: TableLocation[];
  columnWidths: Record<string, number | undefined>;
}

export function SortableRow({ loc, columns, onLocationsChange, locations, columnWidths }: SortableRowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: loc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{
        border: '1px solid #e8e8e8',
        padding: '8px 12px',
        fontWeight: 500,
        background: '#fff',
        position: 'sticky',
        left: 0,
        zIndex: 1,
        whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: '#999', display: 'flex', alignItems: 'center' }}
          >
            <HolderOutlined />
          </span>
          <span style={{ flex: 1 }}>{loc.name}</span>
          <Tooltip title={loc.qrRequired ? t('checklists.qrRequired') : t('checklists.qrNotRequired')}>
            <QrcodeOutlined
              style={{
                cursor: 'pointer',
                fontSize: 16,
                color: loc.qrRequired ? '#1677ff' : '#d9d9d9',
              }}
              onClick={() => onLocationsChange(locations.map((l) => l.id === loc.id ? { ...l, qrRequired: !l.qrRequired } : l))}
            />
          </Tooltip>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            style={{ padding: '0 4px' }}
            onClick={() => onLocationsChange(locations.filter((l) => l.id !== loc.id))}
          />
        </div>
      </td>
      {columns.map((col) => (
        <td key={col.id} style={{
          border: '1px solid #e8e8e8',
          padding: '4px 6px',
          textAlign: 'center',
          height: 40,
          position: 'relative',
          ...(columnWidths[col.id] ? { width: columnWidths[col.id] } : {}),
          ...(loc.qrRequired ? { pointerEvents: 'none' as const } : {}),
        }}>
          <div style={loc.qrRequired ? { filter: 'blur(3px)', opacity: 0.4 } : undefined}>
          {col.type === 'text' ? (
            <Input
              placeholder={col.placeholder || ''}
              style={{ width: '100%', minWidth: 160, height: 32, fontSize: 13 }}
            />
          ) : col.type === 'number' ? (
            <InputNumber
              placeholder={col.placeholder || ''}
              style={{ width: '100%', height: '100%', fontSize: 12 }}
            />
          ) : col.type === 'select' ? (
            <Select
              placeholder={col.placeholder || t('checklists.select')}
              style={{ width: '100%', height: '100%', fontSize: 12 }}
              options={(col.options ?? []).map((opt) => ({ label: opt, value: opt }))}
            />
          ) : col.type === 'photo' ? (
            <Button size="small" icon={<CameraOutlined />} style={{ fontSize: 11 }}>
              {t('checklists.uploadPhoto')}
            </Button>
          ) : col.type === 'file_upload' ? (
            <Button size="small" icon={<UploadOutlined />} style={{ fontSize: 11 }}>
              {t('checklists.uploadFile')}
            </Button>
          ) : col.type === 'signature' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
              padding: '3px 10px',
              color: '#999',
              fontSize: 11,
            }}>
              <EditOutlined />
              {t('checklists.signHere')}
            </div>
          ) : col.type === 'formula' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#e6f4ff',
              borderRadius: 4,
              padding: '3px 10px',
              color: '#1677ff',
              fontSize: 11,
              fontFamily: 'monospace',
            }}>
              <FunctionOutlined />
              {col.formulaOperation === 'custom'
                ? 'f(x)'
                : `${(col.formulaOperation ?? 'avg').toUpperCase()}(${(col.formulaColumnIds ?? []).map((cid) => {
                    const refCol = columns.find((cc) => cc.id === cid);
                    return refCol?.label || '?';
                  }).join(', ')})`
              }
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #d9d9d9',
            }}>
              <span style={{
                padding: '3px 10px',
                fontSize: 11,
                background: '#f6ffed',
                borderRight: '1px solid #d9d9d9',
                color: '#52c41a',
              }}>
                {t('checklists.yes')}
              </span>
              <span style={{
                padding: '3px 10px',
                fontSize: 11,
                background: '#fff2f0',
                color: '#ff4d4f',
              }}>
                {t('checklists.no')}
              </span>
            </div>
          )}
          </div>
        </td>
      ))}
    </tr>
  );
}
