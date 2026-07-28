import { useState } from 'react';
import { Button, Input, InputNumber, Select, Radio, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { SelectOptionType, NormativeOperator } from './types';

interface OptionsEditorProps {
  value?: string[];
  onChange?: (val: string[]) => void;
  selectOptionType: SelectOptionType;
  normativeOperator?: NormativeOperator;
  normativeValue?: number;
  normativeOptions?: string[];
  onSelectOptionTypeChange: (t: SelectOptionType) => void;
  onNormativeOperatorChange: (op: NormativeOperator) => void;
  onNormativeValueChange: (val: number | undefined) => void;
  onNormativeOptionsChange: (opts: string[]) => void;
  textSelectOptions?: string[];
  numberSelectOptions?: string[];
  onTextSelectOptionsChange: (opts: string[]) => void;
  onNumberSelectOptionsChange: (opts: string[]) => void;
}

export function OptionsEditor({ value: _value, onChange, selectOptionType: initialSelectOptionType, normativeOperator: initialNormativeOperator, normativeValue: initialNormativeValue, normativeOptions: initialNormativeOptions, onSelectOptionTypeChange, onNormativeOperatorChange, onNormativeValueChange, onNormativeOptionsChange, textSelectOptions: initialTextOpts, numberSelectOptions: initialNumberOpts, onTextSelectOptionsChange, onNumberSelectOptionsChange }: OptionsEditorProps) {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState('');
  const [selectOptionType, setSelectOptionType] = useState<SelectOptionType>(initialSelectOptionType);
  const [normativeOperator, setNormativeOperator] = useState<NormativeOperator>(initialNormativeOperator ?? 'gte');
  const [normativeValue, setNormativeValue] = useState<number | undefined>(initialNormativeValue);
  const [normativeOptions, setNormativeOptions] = useState<string[]>(initialNormativeOptions ?? []);
  const [textOpts, setTextOpts] = useState<string[]>(initialTextOpts ?? []);
  const [numberOpts, setNumberOpts] = useState<string[]>(initialNumberOpts ?? []);

  const options = selectOptionType === 'text' ? textOpts : numberOpts;

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !options.includes(trimmed)) {
      const updated = [...options, trimmed];
      if (selectOptionType === 'text') {
        setTextOpts(updated);
        onTextSelectOptionsChange(updated);
      } else {
        setNumberOpts(updated);
        onNumberSelectOptionsChange(updated);
      }
      onChange?.(updated);
      setInputVal('');
    }
  };

  const handleRemove = (opt: string) => {
    const updated = options.filter((v) => v !== opt);
    if (selectOptionType === 'text') {
      setTextOpts(updated);
      onTextSelectOptionsChange(updated);
      const updatedNorm = normativeOptions.filter((n) => n !== opt);
      setNormativeOptions(updatedNorm);
      onNormativeOptionsChange(updatedNorm);
    } else {
      setNumberOpts(updated);
      onNumberSelectOptionsChange(updated);
    }
    onChange?.(updated);
  };

  const toggleNormativeOption = (opt: string) => {
    const updated = normativeOptions.includes(opt)
      ? normativeOptions.filter((n) => n !== opt)
      : [...normativeOptions, opt];
    setNormativeOptions(updated);
    onNormativeOptionsChange(updated);
  };

  const handleTypeChange = (val: SelectOptionType) => {
    setSelectOptionType(val);
    onSelectOptionTypeChange(val);
    const switched = val === 'text' ? textOpts : numberOpts;
    onChange?.(switched);
  };

  const handleOperatorChange = (val: NormativeOperator) => {
    setNormativeOperator(val);
    onNormativeOperatorChange(val);
  };

  const handleValueChange = (val: number | undefined) => {
    setNormativeValue(val);
    onNormativeValueChange(val);
  };

  return (
    <div>
      {/* Option type selector */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>{t('checklists.selectOptionType')}:</span>
        <Radio.Group
          size="small"
          value={selectOptionType}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <Radio.Button value="text">{t('checklists.fieldType_text')}</Radio.Button>
          <Radio.Button value="number">{t('checklists.fieldType_number')}</Radio.Button>
        </Radio.Group>
      </div>

      {/* Add option input */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onPressEnter={(e) => { e.preventDefault(); handleAdd(); }}
          placeholder={t('checklists.addOption')}
          style={{ flex: 1 }}
          type={selectOptionType === 'number' ? 'number' : 'text'}
        />
        <Button size="middle" type="primary" icon={<PlusOutlined />} onClick={handleAdd} />
      </div>

      {/* Options list - vertical */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {options.map((opt) => (
          <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#fafafa', borderRadius: 4, border: '1px solid #f0f0f0' }}>
            {selectOptionType === 'text' && (
              <Checkbox
                checked={normativeOptions.includes(opt)}
                onChange={() => toggleNormativeOption(opt)}
              />
            )}
            <span style={{ flex: 1, fontSize: 13 }}>{opt}</span>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemove(opt)} style={{ padding: '0 4px' }} />
          </div>
        ))}
      </div>

      {/* Normative settings */}
      {selectOptionType === 'number' && options.length > 0 && (
        <div style={{ padding: 10, background: '#f6f8fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#333' }}>{t('checklists.normative')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              style={{ flex: 1 }}
              value={normativeOperator}
              onChange={(val) => handleOperatorChange(val)}
              options={[
                { label: t('checklists.norm_gte'), value: 'gte' },
                { label: t('checklists.norm_lte'), value: 'lte' },
                { label: t('checklists.norm_eq'), value: 'eq' },
              ]}
            />
            <InputNumber
              value={normativeValue}
              onChange={(val) => handleValueChange(val ?? undefined)}
              placeholder={t('checklists.normativeValue')}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      )}

      {selectOptionType === 'text' && options.length > 0 && (
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
          {t('checklists.normativeTextHint')}
        </div>
      )}
    </div>
  );
}
