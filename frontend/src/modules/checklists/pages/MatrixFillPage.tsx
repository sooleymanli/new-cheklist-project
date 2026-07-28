import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button, App, Spin, Result, Input, InputNumber, Select, Upload, Tooltip, Tag, Modal, Image, Badge, Table, theme, Progress, Card, Typography, Flex, Space, Alert } from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CameraOutlined,
  UploadOutlined,
  EditOutlined,
  FunctionOutlined,
  QrcodeOutlined,
  CheckCircleFilled,
  SendOutlined,
  PaperClipOutlined,
  ClearOutlined,
  SyncOutlined,
  CloudOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetChecklistInstanceQuery,
  useSaveChecklistInstanceDraftMutation,
  useSubmitChecklistInstanceMutation,
  type ChecklistInstanceDetail,
} from '../checklistInstances.api';
import { useChecklistAutosave } from '../useChecklistAutosave';
import type { TableColumn, TableLocation, FileRequirement } from '../components/TableVisualizer';

type TemplateField = ChecklistInstanceDetail['template']['fields'][number];

// Per-cell value map: { [locationId]: { [columnId]: any } }
type CellData = Record<string, Record<string, any>>;

const { Text } = Typography;

export default function MatrixFillPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();

  const { data: instance, isLoading } = useGetChecklistInstanceQuery(id!);
  const [saveDraft, { isLoading: submitting }] = useSaveChecklistInstanceDraftMutation();
  const [submitChecklist, { isLoading: sendingForApproval }] = useSubmitChecklistInstanceMutation();

  // The entire matrix is ONE react-hook-form form. `cells` holds every value as
  // { [locationId]: { [columnId]: value } }.
  const { setValue, getValues, reset, watch } = useForm<{ cells: CellData }>({
    defaultValues: { cells: {} },
  });
  const cellData = (watch('cells') ?? {}) as CellData;
  const [initialized, setInitialized] = useState(false);
  // Turns on red borders for empty required cells after a failed submit attempt.
  const [showErrors, setShowErrors] = useState(false);

  // Per-cell photo/file editor modal state
  const [photoModal, setPhotoModal] = useState<{ locId: string; col: TableColumn } | null>(null);
  const [photoDraft, setPhotoDraft] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Extract the table field + its columns/locations from the template
  const { tableField, columns, locations } = useMemo(() => {
    const field: TemplateField | undefined = instance?.template?.fields?.find(
      (f) => f.fieldType === 'table',
    );
    const cfg = (field?.fieldConfig as any) || {};
    return {
      tableField: field,
      columns: (cfg.tableColumns ?? []) as TableColumn[],
      locations: (cfg.tableLocations ?? []) as TableLocation[],
    };
  }, [instance]);

  // Initialize form values from existing responses
  useEffect(() => {
    if (!instance || initialized) return;
    if (instance.responses?.length && tableField) {
      const data: CellData = {};
      instance.responses.forEach((r) => {
        if (r.fieldId !== tableField.id || !r.locationId) return;
        if (r.value && typeof r.value === 'object') {
          data[r.locationId] = { ...(r.value as Record<string, any>) };
        }
      });
      reset({ cells: data });
    }
    setInitialized(true);
  }, [instance, tableField, initialized, reset]);

  const updateCell = useCallback(
    (locationId: string, columnId: string, value: any) => {
      const current = getValues('cells') || {};
      setValue(
        'cells',
        { ...current, [locationId]: { ...(current[locationId] || {}), [columnId]: value } },
        { shouldDirty: true },
      );
    },
    [getValues, setValue],
  );

  // A yes_no value may be a plain string ('yes'/'no') or an object { answer, files }
  // when the column also collects photos/files.
  const getYesNo = useCallback(
    (v: any): { answer: 'yes' | 'no' | null; files: any[] } => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const a = v.answer;
        return {
          answer: a === 'yes' || a === 'no' ? a : null,
          files: Array.isArray(v.files) ? v.files : [],
        };
      }
      return { answer: v === 'yes' || v === 'no' ? v : null, files: [] };
    },
    [],
  );

  // True when a yes_no cell's current answer triggers a file requirement
  // but no file has been attached yet.
  const fileMissing = useCallback(
    (col: TableColumn, value: any): boolean => {
      if (col.type !== 'yes_no') return false;
      const fileReq = (col.fileRequirement as FileRequirement) ?? 'none';
      if (fileReq === 'none' || fileReq === 'optional') return false;
      const yn = getYesNo(value);
      if (yn.answer == null) return false;
      const required =
        fileReq === 'always' ||
        fileReq === 'required' ||
        (fileReq === 'onYes' && yn.answer === 'yes') ||
        (fileReq === 'onNo' && yn.answer === 'no');
      return required && yn.files.length === 0;
    },
    [getYesNo],
  );

  const openPhotoModal = useCallback(
    (loc: TableLocation, col: TableColumn) => {
      const current = (cellData[loc.id] || {})[col.id];
      const files =
        col.type === 'yes_no'
          ? getYesNo(current).files
          : Array.isArray(current)
            ? current
            : [];
      setPhotoDraft(files);
      setPhotoModal({ locId: loc.id, col });
    },
    [cellData, getYesNo],
  );

  const savePhotoModal = useCallback(() => {
    if (photoModal) {
      const { locId, col } = photoModal;
      if (col.type === 'yes_no') {
        const ans = getYesNo((cellData[locId] || {})[col.id]).answer;
        updateCell(locId, col.id, { answer: ans, files: photoDraft });
      } else {
        updateCell(locId, col.id, photoDraft);
      }
    }
    setPhotoModal(null);
    setPhotoDraft([]);
  }, [photoModal, photoDraft, updateCell, cellData, getYesNo]);

  const handlePhotoPreview = useCallback((file: any) => {
    const src = file.url || file.thumbUrl || file.response?.url || file.response?.path;
    if (src) setPreviewImage(src);
  }, []);

  const computeFormula = useCallback((col: TableColumn, row: Record<string, any>) => {
    const ids = col.formulaColumnIds ?? [];
    const nums = ids.map((cid) => Number(row[cid])).filter((n) => !Number.isNaN(n));
    if (!nums.length) return '';
    const sum = nums.reduce((a, b) => a + b, 0);
    switch (col.formulaOperation) {
      case 'sum':
        return sum;
      case 'avg':
        return Math.round((sum / nums.length) * 100) / 100;
      case 'min':
        return Math.min(...nums);
      case 'max':
        return Math.max(...nums);
      default:
        return '';
    }
  }, []);

  // Human-readable explanation of what a formula column computes (shown as a
  // tooltip so the user understands the auto-calculated value).
  const formulaDescription = useCallback(
    (col: TableColumn): string => {
      const op = t(`checklists.formula_${col.formulaOperation ?? 'custom'}`);
      const lines = [op];
      if (col.formulaOperation === 'custom') {
        if (col.formulaExpression) {
          lines.push(t('checklists.formulaCustomExpr', { expr: col.formulaExpression }));
        }
      } else {
        const names = (col.formulaColumnIds ?? [])
          .map((cid) => columns.find((c) => c.id === cid)?.label ?? cid);
        if (names.length) lines.push(t('checklists.formulaUses', { cols: names.join(', ') }));
      }
      lines.push(t('checklists.formulaReadonly'));
      return lines.join('\n');
    },
    [columns, t],
  );

  // Responsive breakpoint detection (mobile / tablet)
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = viewportWidth < 768;

  // Gamification helpers
  const isFilled = useCallback((v: any) => {
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') {
      // yes_no value stored as { answer, files }
      if ('answer' in v) return v.answer === 'yes' || v.answer === 'no';
      return true;
    }
    return true;
  }, []);

  const fillableColumns = useMemo(() => columns.filter((c) => c.type !== 'formula'), [columns]);

  const { totalCount, percent, completedRows } = useMemo(() => {
    const total = locations.length * fillableColumns.length;
    let filled = 0;
    let rowsDone = 0;
    locations.forEach((loc) => {
      const row = cellData[loc.id] || {};
      let rowFilled = 0;
      fillableColumns.forEach((col) => {
        if (isFilled(row[col.id])) {
          filled += 1;
          rowFilled += 1;
        }
      });
      if (fillableColumns.length > 0 && rowFilled === fillableColumns.length) rowsDone += 1;
    });
    return {
      filledCount: filled,
      totalCount: total,
      percent: total > 0 ? Math.round((filled / total) * 100) : 0,
      completedRows: rowsDone,
    };
  }, [locations, fillableColumns, cellData, isFilled]);

  const requiredColumns = useMemo(
    () => columns.filter((c) => c.required && c.type !== 'formula'),
    [columns],
  );

  // A row is "complete" once every required cell is filled and no file
  // requirement is left unsatisfied. When the table has no required columns we
  // fall back to all fillable cells being filled.
  const isRowComplete = useCallback(
    (loc: TableLocation) => {
      const row = cellData[loc.id] || {};
      const filesOk = columns.every((col) => !fileMissing(col, row[col.id]));
      if (!filesOk) return false;
      if (requiredColumns.length > 0) {
        return requiredColumns.every((col) => isFilled(row[col.id]));
      }
      return fillableColumns.length > 0 && fillableColumns.every((col) => isFilled(row[col.id]));
    },
    [cellData, columns, requiredColumns, fillableColumns, isFilled, fileMissing],
  );

  const allRequiredFilled = useMemo(() => {
    if (!tableField || locations.length === 0) return false;

    // Any yes_no cell whose answer triggers a file requirement must have a file.
    const fileReqOk = locations.every((loc) => {
      const row = cellData[loc.id] || {};
      return columns.every((c) => !fileMissing(c, row[c.id]));
    });
    if (!fileReqOk) return false;

    if (requiredColumns.length === 0) {
      return locations.some((loc) => {
        const row = cellData[loc.id] || {};
        return fillableColumns.some((c) => isFilled(row[c.id]));
      });
    }
    return locations.every((loc) => {
      const row = cellData[loc.id] || {};
      return requiredColumns.every((c) => isFilled(row[c.id]));
    });
  }, [tableField, locations, columns, requiredColumns, fillableColumns, cellData, isFilled, fileMissing]);

  // Number of still-unfilled required cells (incl. missing mandatory files).
  const remainingRequired = useMemo(() => {
    if (!tableField || locations.length === 0) return 0;
    let count = 0;
    locations.forEach((loc) => {
      const row = cellData[loc.id] || {};
      requiredColumns.forEach((c) => {
        if (!isFilled(row[c.id])) count += 1;
      });
      columns.forEach((c) => {
        if (!c.required && fileMissing(c, row[c.id])) count += 1;
      });
    });
    return count;
  }, [tableField, locations, columns, requiredColumns, cellData, isFilled, fileMissing]);

  // Celebrate the first time we hit 100%
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (percent >= 100 && totalCount > 0 && !celebratedRef.current) {
      celebratedRef.current = true;
      message.success(t('checklists.allDone'));
    }
    if (percent < 100) celebratedRef.current = false;
  }, [percent, totalCount, message, t]);

  // Build the API payload (one response per location) from the current cells.
  const buildResponses = useCallback(() => {
    if (!tableField) return [];
    return locations
      .map((loc) => ({
        fieldId: tableField.id,
        locationId: loc.id,
        value: cellData[loc.id] || {},
      }))
      .filter((r) => Object.keys(r.value).length > 0);
  }, [tableField, locations, cellData]);

  // Background auto-save + offline persistence with auto-sync on reconnect.
  const autosaveEnabled =
    !!tableField && (instance?.status === 'pending' || instance?.status === 'in_progress');
  const autosave = useChecklistAutosave({
    instanceId: id!,
    enabled: autosaveEnabled,
    initialized,
    cellData,
    buildResponses,
    save: (responses) => saveDraft({ id: id!, responses }).unwrap(),
    onRestore: (cells) => reset({ cells }),
  });

  const renderCell = (loc: TableLocation, col: TableColumn) => {
    const row = cellData[loc.id] || {};
    const val = row[col.id];
    const set = (v: any) => updateCell(loc.id, col.id, v);

    const inner = (() => {
      switch (col.type) {
        case 'text':
          return (
            <Input
              value={val ?? ''}
              placeholder={col.placeholder}
              onChange={(e) => set(e.target.value)}
              style={{ minWidth: 160 }}
            />
          );
        case 'number':
          return (
            <InputNumber
              value={val ?? null}
              placeholder={col.placeholder}
              onChange={set}
              style={{ width: '100%', minWidth: 90 }}
            />
          );
        case 'select': {
          const opts: any[] =
            (col as any).options ??
            (col as any).numberSelectOptions ??
            (col as any).textSelectOptions ??
            [];
          return (
            <Select
              value={val ?? undefined}
              placeholder={t('checklists.select')}
              onChange={set}
              allowClear
              style={{ width: '100%', minWidth: 110 }}
              options={opts.map((o) => ({ label: String(o), value: o }))}
            />
          );
        }
        case 'photo':
        case 'file_upload': {
          const files = Array.isArray(val) ? val : [];
          const isPhoto = col.type === 'photo';
          return (
            <Badge count={files.length} size="small" color="#16a34a" offset={[-2, 2]}>
              <Button
                size="small"
                type="dashed"
                icon={isPhoto ? <CameraOutlined /> : <UploadOutlined />}
                onClick={() => openPhotoModal(loc, col)}
              >
                {files.length > 0
                  ? t('checklists.viewEdit')
                  : isPhoto
                    ? t('checklists.uploadPhoto')
                    : t('checklists.uploadFile')}
              </Button>
            </Badge>
          );
        }
        case 'signature':
          return (
            <Input
              value={val ?? ''}
              placeholder={t('checklists.signHere')}
              prefix={<EditOutlined />}
              onChange={(e) => set(e.target.value)}
              style={{ minWidth: 140 }}
            />
          );
        case 'formula': {
          const computed = computeFormula(col, row);
          return (
            <Tooltip
              title={<span style={{ whiteSpace: 'pre-line' }}>{formulaDescription(col)}</span>}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#e6f4ff',
                  borderRadius: 4,
                  padding: '4px 10px',
                  color: '#1677ff',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  minWidth: 50,
                  justifyContent: 'center',
                  cursor: 'help',
                }}
              >
                <FunctionOutlined />
                {computed === '' ? '—' : computed}
              </span>
            </Tooltip>
          );
        }
        case 'yes_no':
        default: {
          const yn = getYesNo(val);
          const fileReq: FileRequirement = (col.fileRequirement as FileRequirement) ?? 'none';
          const hasFiles = fileReq !== 'none';
          const fileCount = yn.files.length;

          // Decide if selecting an answer should auto-open the file modal.
          const shouldOpenOn = (answer: 'yes' | 'no') =>
            fileReq === 'always' ||
            fileReq === 'required' ||
            (fileReq === 'onYes' && answer === 'yes') ||
            (fileReq === 'onNo' && answer === 'no');

          const choose = (answer: 'yes' | 'no') => {
            // Toggling the active answer off clears it (files are kept).
            if (yn.answer === answer) {
              set(hasFiles ? { answer: null, files: yn.files } : null);
              return;
            }
            set(hasFiles ? { answer, files: yn.files } : answer);
            if (shouldOpenOn(answer)) openPhotoModal(loc, col);
          };

          // The clip icon is visible whenever the column can collect files
          // (any requirement) or some files already exist.
          const showClip = fileReq !== 'none' || fileCount > 0;
          // The icon is only relevant when a file is currently applicable for the
          // chosen answer (e.g. "onNo" → only when "Xeyr" is selected) or when
          // files already exist. Otherwise we hide it (keeping layout stable).
          const fileApplicable =
            fileReq === 'optional' ||
            fileReq === 'always' ||
            fileReq === 'required' ||
            (fileReq === 'onYes' && yn.answer === 'yes') ||
            (fileReq === 'onNo' && yn.answer === 'no');
          const iconVisible = fileApplicable || fileCount > 0;
          const fileError = showErrors && fileMissing(col, val);

          return (
            <Space size={8} style={{ width: '100%', justifyContent: 'center' }}>
              <Space.Compact style={{ flex: 1 }}>
                <Button
                  block
                  onClick={() => choose('yes')}
                  style={
                    yn.answer === 'yes'
                      ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff', fontWeight: 600 }
                      : { color: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }
                  }
                >
                  {t('checklists.yes')}
                </Button>
                <Button
                  block
                  onClick={() => choose('no')}
                  style={
                    yn.answer === 'no'
                      ? { background: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff', fontWeight: 600 }
                      : { color: '#ff4d4f', borderColor: '#ff4d4f', fontWeight: 600 }
                  }
                >
                  {t('checklists.no')}
                </Button>
              </Space.Compact>
              {showClip && (
                <Badge
                  count={fileCount}
                  size="small"
                  color="#16a34a"
                  offset={[-2, 2]}
                  style={{ visibility: iconVisible ? 'visible' : 'hidden' }}
                >
                  <Tooltip title={t('checklists.uploadFile')}>
                    <Button
                      size="small"
                      type="text"
                      danger={fileError}
                      icon={<PaperClipOutlined />}
                      onClick={() => openPhotoModal(loc, col)}
                      style={{ visibility: iconVisible ? 'visible' : 'hidden' }}
                    />
                  </Tooltip>
                </Badge>
              )}
            </Space>
          );
        }
      }
    })();

    return inner;
  };

  // Cell state used to tint the whole column/cell background.
  const cellState = useCallback(
    (loc: TableLocation, col: TableColumn): '' | 'ok' | 'error' => {
      const row = cellData[loc.id] || {};
      if (col.type === 'formula') {
        // A formula cell turns green once it actually computes a value.
        const computed = computeFormula(col, row);
        return computed !== '' && computed !== null && computed !== undefined ? 'ok' : '';
      }
      const v = row[col.id];
      const missingFile = fileMissing(col, v);
      if (isFilled(v) && !missingFile) return 'ok';
      if (showErrors && (col.required || missingFile)) return 'error';
      return '';
    },
    [cellData, isFilled, showErrors, fileMissing, computeFormula],
  );

  // Reveal which required cells are still empty by turning on the red tint.
  const handleRevealRequired = () => {
    setShowErrors(true);
    message.warning(t('checklists.fillRequiredFirst'));
  };

  // Clear every cell in the matrix (after confirmation).
  const handleResetAll = () => {
    modal.confirm({
      title: t('checklists.resetAll'),
      content: t('checklists.resetAllConfirm'),
      okText: t('checklists.resetAll'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        reset({ cells: {} });
        setShowErrors(false);
        message.success(t('checklists.resetAllDone'));
      },
    });
  };

  const handleSave = async () => {
    if (!instance || !tableField) return;

    // One response per location holding all column values as a JSON object.
    // Saving keeps the inspection in progress and does NOT send it to approval.
    const responses = locations
      .map((loc) => ({
        fieldId: tableField.id,
        locationId: loc.id,
        value: cellData[loc.id] || {},
      }))
      .filter((r) => Object.keys(r.value).length > 0);

    try {
      const res: any = await saveDraft({ id: id!, responses }).unwrap();
      autosave.clear();
      if (res?.message) message.success(res.message);
      else message.success(t('checklists.saved'));
      navigate('/my-checklists');
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!instance || !tableField) return;

    // Validate required cells; if any are empty, reveal red borders and stop.
    if (!allRequiredFilled) {
      setShowErrors(true);
      message.error(t('checklists.fillRequiredFirst'));
      return;
    }

    const responses = locations
      .map((loc) => ({
        fieldId: tableField.id,
        locationId: loc.id,
        value: cellData[loc.id] || {},
      }))
      .filter((r) => Object.keys(r.value).length > 0);

    try {
      await submitChecklist({ id: id!, responses }).unwrap();
      autosave.clear();
      message.success(t('checklists.submittedForApproval'));
      navigate('/my-checklists');
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }} />;
  if (!instance) return <Result status="404" title={t('error.unexpected')} />;

  // AntD Table columns: first column (location) is fixed/sticky on the left.
  const antTableColumns: any[] = [
    {
      title: t('checklists.locationName'),
      key: '__loc',
      fixed: 'left',
      width: 220,
      onCell: (loc: TableLocation) =>
        isRowComplete(loc)
          ? { style: { background: 'rgba(22,163,74,0.12)', boxShadow: 'inset 3px 0 0 #16a34a' } }
          : {},
      render: (_: unknown, loc: TableLocation) => {
        const done = isRowComplete(loc);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, width: '100%' }}>
            {loc.name}
            {loc.qrRequired && (
              <Tooltip title={t('checklists.qrRequired')}>
                <QrcodeOutlined style={{ color: token.colorPrimary }} />
              </Tooltip>
            )}
            {done && <CheckCircleFilled style={{ marginLeft: 'auto', color: '#16a34a' }} />}
          </span>
        );
      },
    },
    ...columns.map((col) => ({
      title: (
        <span>
          {col.required && <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>}
          {col.label}
          {col.type === 'formula' && (
            <Tooltip
              title={<span style={{ whiteSpace: 'pre-line' }}>{formulaDescription(col)}</span>}
            >
              <FunctionOutlined style={{ marginLeft: 4, color: '#1677ff' }} />
            </Tooltip>
          )}
        </span>
      ),
      key: col.id,
      align: 'center' as const,
      width: col.type === 'text' ? 200 : 160,
      onCell: (loc: TableLocation) => {
        const s = cellState(loc, col);
        if (s === 'ok') return { style: { background: 'rgba(22,163,74,0.12)' } };
        if (s === 'error') return { style: { background: 'rgba(220,38,38,0.10)' } };
        return {};
      },
      render: (_: unknown, loc: TableLocation) => renderCell(loc, col),
    })),
  ];

  return (
    <>
    <Modal
      open
      footer={null}
      closable={false}
      width="100vw"
      maskClosable={false}
      style={{ top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 }}
      styles={{
        container: { padding: 0, height: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column' },
        body: { padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
      }}
      onCancel={() => navigate('/my-checklists')}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          background: token.colorBgLayout,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: token.colorBgContainer,
            padding: '8px 24px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            zIndex: 10,
          }}
        >
          <Flex align="center" justify="space-between" gap={12} wrap>
            <Flex align="center" gap={8} style={{ minWidth: 0 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => navigate('/my-checklists')}
              />
              <Text strong style={{ fontSize: 16 }} ellipsis>
                {instance.template?.name}
              </Text>
              <Tag style={{ margin: 0 }}>
                {t(`checklists.instanceStatus_${instance.status}`)}
              </Tag>
              {autosaveEnabled &&
                (() => {
                  if (!autosave.isOnline)
                    return (
                      <Flex align="center" gap={4}>
                        <CloudOutlined style={{ color: token.colorWarning, fontSize: 13 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('checklists.autosaveOffline')}
                        </Text>
                      </Flex>
                    );
                  if (autosave.state === 'saving' || autosave.state === 'pending')
                    return (
                      <Flex align="center" gap={4}>
                        <SyncOutlined spin style={{ color: token.colorPrimary, fontSize: 13 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('checklists.autosaveSaving')}
                        </Text>
                      </Flex>
                    );
                  if (autosave.state === 'error')
                    return (
                      <Flex align="center" gap={4}>
                        <CloseCircleOutlined style={{ color: token.colorError, fontSize: 13 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('checklists.autosaveError')}
                        </Text>
                      </Flex>
                    );
                  if (autosave.state === 'saved')
                    return (
                      <Flex align="center" gap={4}>
                        <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 13 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('checklists.autosaveSaved')}
                        </Text>
                      </Flex>
                    );
                  return null;
                })()}
            </Flex>
            {(instance.status === 'pending' || instance.status === 'in_progress') &&
              tableField &&
              !allRequiredFilled && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ padding: '2px 12px' }}
                  message={
                    <Text style={{ fontSize: 12.5 }}>
                      {t('checklists.submitVisibilityHint', { count: remainingRequired })}
                    </Text>
                  }
                  action={
                    <Button size="small" type="link" onClick={handleRevealRequired} style={{ padding: '0 4px' }}>
                      {t('checklists.showRemaining')}
                    </Button>
                  }
                />
              )}
          </Flex>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {!tableField || columns.length === 0 || locations.length === 0 ? (
            <Result status="warning" title={t('checklists.noTableData')} style={{ marginTop: '10vh' }} />
          ) : isMobile ? (
            <div>
              {locations.map((loc) => {
                const done = isRowComplete(loc);
                const rowFilled = fillableColumns.filter((c) => isFilled((cellData[loc.id] || {})[c.id])).length;
                return (
                  <Card
                    key={loc.id}
                    size="small"
                    style={{ marginBottom: 14 }}
                    title={
                      <Space size={6}>
                        {loc.name}
                        {loc.qrRequired && (
                          <Tooltip title={t('checklists.qrRequired')}>
                            <QrcodeOutlined style={{ color: token.colorPrimary }} />
                          </Tooltip>
                        )}
                      </Space>
                    }
                    extra={
                      done ? (
                        <CheckCircleFilled style={{ fontSize: 18, color: '#16a34a' }} />
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                          {rowFilled}/{fillableColumns.length}
                        </Text>
                      )
                    }
                  >
                    {columns.map((col) => {
                      const s = cellState(loc, col);
                      return (
                        <div
                          key={col.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            padding: '10px 0',
                            borderBottom: '1px solid ' + token.colorBorderSecondary,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                            {col.required && <span style={{ color: token.colorError }}>* </span>}
                            {col.label}
                          </Text>
                          <div
                            style={{
                              display: 'flex',
                              borderRadius: 6,
                              padding: s ? 6 : 0,
                              background:
                                s === 'ok'
                                  ? 'rgba(22,163,74,0.10)'
                                  : s === 'error'
                                    ? 'rgba(220,38,38,0.08)'
                                    : undefined,
                            }}
                          >
                            {renderCell(loc, col)}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Table
              rowKey="id"
              columns={antTableColumns}
              dataSource={locations}
              size="small"
              bordered
              pagination={false}
              scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
            />
          )}
        </div>

        {/* Fixed footer */}
        <div
          style={{
            background: token.colorBgContainer,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: '12px 24px',
            boxShadow: '0 -2px 8px rgba(15,23,42,0.06)',
            zIndex: 10,
          }}
        >
          <Flex align="center" justify="space-between" gap={12} wrap>
            <Flex align="center" gap={12} wrap style={{ flex: 1, minWidth: 220 }}>
              {tableField && totalCount > 0 && (
                <>
                  <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={percent >= 100 ? '#16a34a' : '#2563eb'}
                    style={{ flex: 1, minWidth: 140, marginBottom: 0 }}
                  />
                  <Tag style={{ margin: 0 }}>{percent}%</Tag>
                  <Tag icon={<CheckCircleFilled style={{ color: '#16a34a' }} />} style={{ margin: 0 }}>
                    {completedRows}/{locations.length}
                  </Tag>
                </>
              )}
            </Flex>
            <Space size={8}>
              <Button icon={<ClearOutlined />} type="text" onClick={handleResetAll}>
                {t('checklists.resetAll')}
              </Button>
              <Button
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={handleSave}
                style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
              >
                {t('checklists.save')}
              </Button>
              {(instance.status === 'pending' || instance.status === 'in_progress') &&
                allRequiredFilled && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sendingForApproval}
                    onClick={handleSubmitForApproval}
                  >
                    {t('checklists.submitForApproval')}
                  </Button>
                )}
            </Space>
          </Flex>
        </div>
      </div>
    </Modal>

      {/* Per-cell photo / file editor */}
      <Modal
        open={!!photoModal}
        title={
          photoModal?.col.type === 'file_upload'
            ? t('checklists.uploadFile')
            : t('checklists.uploadPhoto')
        }
        okText={t('checklists.save')}
        cancelText={t('common.cancel')}
        onOk={savePhotoModal}
        onCancel={() => {
          setPhotoModal(null);
          setPhotoDraft([]);
        }}
        destroyOnHidden
        width={560}
      >
        {photoModal && (
          <Upload
            action="/api/v1/files/upload"
            listType={photoModal.col.type === 'file_upload' ? 'text' : 'picture-card'}
            multiple
            maxCount={10}
            accept={photoModal.col.type === 'photo' ? 'image/*' : undefined}
            fileList={photoDraft}
            onChange={({ fileList }) => setPhotoDraft(fileList)}
            onPreview={handlePhotoPreview}
          >
            {photoDraft.length >= 10 ? null : (
              <div style={{ padding: photoModal.col.type === 'file_upload' ? '4px 0' : 0 }}>
                {photoModal.col.type === 'file_upload' ? <UploadOutlined /> : <CameraOutlined />}
                <div style={{ marginTop: 6, fontSize: 12 }}>{t('checklists.add')}</div>
              </div>
            )}
          </Upload>
        )}
      </Modal>

      {previewImage && (
        <Image
          style={{ display: 'none' }}
          src={previewImage}
          preview={{
            visible: true,
            src: previewImage,
            onVisibleChange: (v) => {
              if (!v) setPreviewImage(null);
            },
          }}
        />
      )}
    </>
  );
}
