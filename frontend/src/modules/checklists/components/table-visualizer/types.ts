export type ColumnType = 'yes_no' | 'text' | 'number' | 'select' | 'photo' | 'file_upload' | 'signature' | 'formula';

export type FormulaOperation = 'avg' | 'sum' | 'min' | 'max' | 'custom';

export type FileRequirement = 'none' | 'onNo' | 'onYes' | 'optional' | 'always' | 'required';

export type TextRequirement = 'none' | 'onNo' | 'onYes' | 'optional' | 'always';

export type SelectOptionType = 'text' | 'number';

export type NormativeOperator = 'gte' | 'lte' | 'eq';

export type YesNoNormative = 'yes' | 'no' | 'both';

export interface TableColumn {
  id: string;
  label: string;
  type: ColumnType;
  required: boolean;
  fileRequirement: FileRequirement;
  textRequirement?: TextRequirement;
  placeholder?: string;
  options?: string[];
  selectOptionType?: SelectOptionType;
  normativeOperator?: NormativeOperator;
  normativeValue?: number;
  normativeOptions?: string[];
  textSelectOptions?: string[];
  numberSelectOptions?: string[];
  yesNoNormative?: YesNoNormative;
  formulaOperation?: FormulaOperation;
  formulaColumnIds?: string[];
  formulaExpression?: string;
}

export interface TableLocation {
  id: string;
  name: string;
  qrRequired?: boolean;
}
