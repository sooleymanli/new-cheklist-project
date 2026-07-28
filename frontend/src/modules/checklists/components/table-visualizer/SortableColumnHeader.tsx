import { useCallback, useRef } from 'react';
import { Button, Input, Popconfirm } from 'antd';
import { HolderOutlined, SettingOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TableColumn } from './types';

interface SortableColumnHeaderProps {
  column: TableColumn;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: (id: string) => void;
  width: number | undefined;
  onResize: (id: string, width: number) => void;
}

export function SortableColumnHeader({ column, onRename, onDelete, onOpenSettings, width, onResize }: SortableColumnHeaderProps) {
  const { t } = useTranslation();
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = width ?? (e.target as HTMLElement).closest('th')?.offsetWidth ?? 140;

    const handleMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startXRef.current;
      const newWidth = Math.max(100, startWidthRef.current + diff);
      onResize(column.id, newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [column.id, width, onResize]);

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        background: '#fafafa',
        border: '1px solid #e8e8e8',
        padding: '8px 6px',
        ...(width ? { width } : {}),
        minWidth: 100,
        position: 'relative' as const,
        whiteSpace: 'nowrap' as const,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: '#999', display: 'flex', alignItems: 'center' }}
        >
          <HolderOutlined />
        </span>
        {column.required && <span style={{ color: '#ff4d4f', fontWeight: 700 }}>*</span>}
        {column.fileRequirement !== 'none' && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 10,
            padding: '1px 4px',
            borderRadius: 3,
            background: '#e6f4ff',
            color: '#1677ff',
            gap: 2,
          }}>
            <PaperClipOutlined style={{ fontSize: 10 }} />
          </span>
        )}
        <Input
          size="small"
          value={column.label}
          onChange={(e) => onRename(column.id, e.target.value)}
          style={{ flex: 1, fontSize: 12, fontWeight: 600 }}
          variant="borderless"
          placeholder={t('checklists.columnName')}
        />
        <Button type="text" size="small" icon={<SettingOutlined />} style={{ padding: '0 4px', color: '#666' }} onClick={() => onOpenSettings(column.id)} />
        <Popconfirm
          title={t('checklists.confirmDeleteColumn')}
          onConfirm={() => onDelete(column.id)}
          okText={t('common.yes')}
          cancelText={t('common.no')}
          getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ padding: '0 4px' }} />
        </Popconfirm>
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          background: 'transparent',
          zIndex: 0,
        }}
        onMouseEnter={(e) => { (e.target as HTMLDivElement).style.background = '#1677ff'; }}
        onMouseLeave={(e) => { (e.target as HTMLDivElement).style.background = 'transparent'; }}
      />
    </th>
  );
}
