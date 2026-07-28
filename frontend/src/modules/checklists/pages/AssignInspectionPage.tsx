import { useState } from 'react';
import { Form, Input, Select, Switch, Button, TimePicker, App, Radio, DatePicker, Tag, Typography, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined, ClockCircleOutlined, QrcodeOutlined, CheckCircleOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  useCreateInspectionAssignmentMutation,
  useGetInspectionAssignmentQuery,
  useUpdateInspectionAssignmentMutation,
  type ApprovalStep,
} from '../inspectionAssignments.api';
import { useGetChecklistTemplatesQuery } from '../checklistTemplates.api';
import { useGetUsersQuery } from '@/modules/users/users.api';

const { Text } = Typography;

export default function AssignInspectionPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';

  const [form] = Form.useForm();
  const watchedAssigneeIds = Form.useWatch('assigneeIds', form);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [vacationDates, setVacationDates] = useState<string[]>([]);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);

  const { data: templatesData } = useGetChecklistTemplatesQuery({ status: 'active', pageSize: 100 });
  const { data: usersData } = useGetUsersQuery({ pageSize: 100, status: 'active' });
  const { data: existingAssignment } = useGetInspectionAssignmentQuery(id!, { skip: !isEdit });

  const [createAssignment, { isLoading: creating }] = useCreateInspectionAssignmentMutation();
  const [updateAssignment, { isLoading: updating }] = useUpdateInspectionAssignmentMutation();

  const templates = templatesData?.data || [];
  const users: { id: string; firstName: string; lastName: string }[] = (usersData as any)?.data || [];

  // Populate form when editing
  if (isEdit && existingAssignment && !form.getFieldValue('templateId')) {
    form.setFieldsValue({
      name: existingAssignment.name,
      description: existingAssignment.description,
      templateId: existingAssignment.templateId,
      assigneeIds: existingAssignment.assigneeIds,
      recurrenceType: existingAssignment.recurrenceType,
      scheduledDate: existingAssignment.scheduledDate ? dayjs(existingAssignment.scheduledDate) : undefined,
      excludeWeekends: existingAssignment.excludeWeekends,
      excludeHolidays: existingAssignment.excludeHolidays,
      timeWindowStart: dayjs(existingAssignment.timeWindowStart, 'HH:mm'),
      timeWindowEnd: dayjs(existingAssignment.timeWindowEnd, 'HH:mm'),
      requiresQrStart: existingAssignment.requiresQrStart,
      requiresApproval: existingAssignment.requiresApproval,
    });
    if (existingAssignment.requiresApproval && existingAssignment.approvalSteps.length > 0) {
      setRequiresApproval(true);
      setApprovalSteps(existingAssignment.approvalSteps);
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        description: values.description,
        templateId: values.templateId,
        assigneeIds: values.assigneeIds,
        recurrenceType: values.recurrenceType,
        scheduledDate: values.recurrenceType === 'once' && values.scheduledDate ? values.scheduledDate.format('YYYY-MM-DD') : undefined,
        customIntervalHours: values.recurrenceType === 'custom' && values.customIntervalType === 'hourly' ? values.customIntervalHours : undefined,
        customIntervalType: values.recurrenceType === 'custom' ? values.customIntervalType : undefined,
        customDateRangeStart: values.recurrenceType === 'custom' && values.customIntervalType === 'dateRange' && values.customDateRange?.[0] ? values.customDateRange[0].format('YYYY-MM-DD') : undefined,
        customDateRangeEnd: values.recurrenceType === 'custom' && values.customIntervalType === 'dateRange' && values.customDateRange?.[1] ? values.customDateRange[1].format('YYYY-MM-DD') : undefined,
        dateRangeIntervalHours: values.recurrenceType === 'custom' && values.customIntervalType === 'dateRange' ? values.dateRangeIntervalHours : undefined,
        excludeWeekends: values.excludeWeekends ?? false,
        excludeHolidays: values.excludeHolidays ?? false,
        excludeHolidayDates: values.excludeHolidays ? holidayDates : [],
        excludeVacationDates: vacationDates,
        timeWindowStart: values.timeWindowStart?.format('HH:mm') || '09:00',
        timeWindowEnd: values.timeWindowEnd?.format('HH:mm') || '18:00',
        requiresQrStart: values.requiresQrStart ?? false,
        requiresApproval,
        approvalSteps: requiresApproval ? approvalSteps : [],
      };

      if (isEdit) {
        await updateAssignment({ id: id!, body: payload }).unwrap();
      } else {
        await createAssignment(payload as any).unwrap();
      }
      message.success(t('common.saved'));
      navigate('/inspection-assignments');
    } catch (err: any) {
      if (err?.data?.message) message.error(err.data.message);
    }
  };

  const addApprovalStep = () => {
    setApprovalSteps([...approvalSteps, { stepOrder: approvalSteps.length + 1, approverId: '' }]);
  };

  const removeApprovalStep = (index: number) => {
    const updated = approvalSteps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setApprovalSteps(updated);
  };

  const updateApprovalStep = (index: number, approverId: string) => {
    const updated = approvalSteps.map((s, i) => i === index ? { ...s, approverId } : s);
    setApprovalSteps(updated);
  };

  const addVacationDate = (date: dayjs.Dayjs | null) => {
    if (date) {
      const dateStr = date.format('YYYY-MM-DD');
      if (!vacationDates.includes(dateStr)) {
        setVacationDates([...vacationDates, dateStr].sort());
      }
    }
  };

  const removeVacationDate = (dateStr: string) => {
    setVacationDates(vacationDates.filter((d) => d !== dateStr));
  };

  const recurrenceType = Form.useWatch('recurrenceType', form);
  const customIntervalType = Form.useWatch('customIntervalType', form);
  const excludeHolidays = Form.useWatch('excludeHolidays', form);
  const selectedTemplateId = Form.useWatch('templateId', form);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',  padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inspection-assignments')} type="text" size="medium" />
      </div>

      <Form form={form} layout="vertical" initialValues={{ recurrenceType: 'once', excludeWeekends: false, excludeHolidays: false, requiresQrStart: false, customIntervalHours: 2, customIntervalType: 'hourly', dateRangeIntervalHours: 0 }} style={{ flex: 1, overflow: 'hidden', padding: '0 24px' }}>

        <Row gutter={32} style={{ height: '100%' }}>
          <Col xs={24} lg={12} style={{ height: '100%', overflowY: 'auto', paddingRight: 16, paddingLeft: 8 }}>
        {/* Section 1: Template & Assignees */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            {t('inspections.basicInfo')}
          </div>

          <Form.Item
            name="name"
            label={t('inspections.assignmentName')}
            rules={[{ required: true, message: t('inspections.assignmentNameRequired') }]}
          >
            <Input placeholder={t('inspections.assignmentName')} size="medium" />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('inspections.assignmentDescription')}
            rules={[{ required: true, message: t('inspections.assignmentDescriptionRequired') }]}
          >
            <Input.TextArea placeholder={t('inspections.assignmentDescription')} rows={3} />
          </Form.Item>

          <Form.Item
            name="templateId"
            label={t('inspections.selectTemplate')}
            rules={[{ required: true, message: t('inspections.templateRequired') }]}
          >
            <Select
              showSearch
              placeholder={t('inspections.selectTemplate')}
              optionFilterProp="label"
              options={templates.map((tpl) => ({ label: tpl.name, value: tpl.id }))}
              size="medium"
            />
          </Form.Item>

          {selectedTemplateId && (
            <div style={{ marginTop: -16, marginBottom: 20 }}>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => window.open(`/checklist-templates/${selectedTemplateId}`, '_blank')}
                style={{ paddingLeft: 0 }}
              >
                {t('inspections.previewTemplate')}
              </Button>
            </div>
          )}

          <Form.Item
            name="assigneeIds"
            label={t('inspections.selectAssignees')}
            rules={[{ required: true, message: t('inspections.assigneesRequired') }]}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder={t('inspections.selectAssignees')}
              optionFilterProp="label"
              options={users.map((u) => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))}
              maxTagCount={5}
              size="medium"
            />
          </Form.Item>
        </section>

        {/* Section 2: Schedule */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {t('inspections.schedule')}
          </div>

          <Form.Item
            name="recurrenceType"
            label={t('inspections.recurrence')}
            rules={[{ required: true }]}
          >
            <Radio.Group size="middle">
              <Radio.Button value="once">{t('inspections.recurrence_once')}</Radio.Button>
              <Radio.Button value="daily">{t('inspections.recurrence_daily')}</Radio.Button>
              <Radio.Button value="custom">{t('inspections.recurrence_custom')}</Radio.Button>
              <Radio.Button value="weekly">{t('inspections.recurrence_weekly')}</Radio.Button>
              <Radio.Button value="monthly">{t('inspections.recurrence_monthly')}</Radio.Button>
              <Radio.Button value="quarterly">{t('inspections.recurrence_quarterly')}</Radio.Button>
              <Radio.Button value="yearly">{t('inspections.recurrence_yearly')}</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* One-time scheduled date */}
          {recurrenceType === 'once' && (
            <Form.Item
              name="scheduledDate"
              label={t('inspections.scheduledDate')}
              rules={[{ required: true, message: t('inspections.scheduledDateRequired') }]}
            >
              <DatePicker
                format="DD.MM.YYYY"
                style={{ width: 220 }}
                placeholder={t('inspections.scheduledDate')}
                disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              />
            </Form.Item>
          )}

          {/* Custom interval */}
          {recurrenceType === 'custom' && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 12 }}>{t('inspections.customInterval')}</div>

              <Form.Item name="customIntervalType" style={{ marginBottom: 12 }}>
                <Radio.Group size="small">
                  <Radio.Button value="hourly">{t('inspections.intervalHourly')}</Radio.Button>
                  <Radio.Button value="dateRange">{t('inspections.intervalDateRange')}</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {customIntervalType === 'dateRange' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Form.Item name="customDateRange" style={{ marginBottom: 0 }}>
                      <DatePicker.RangePicker
                        format="DD.MM.YYYY"
                        disabledDate={(d) => d.isBefore(dayjs(), 'day')}
                      />
                    </Form.Item>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 13 }}>{t('inspections.dateRangeInterval')}:</Text>
                    <Form.Item name="dateRangeIntervalHours" style={{ marginBottom: 0 }}>
                      <Select
                        style={{ width: 140 }}
                        options={[
                          { label: t('inspections.oncePerDay'), value: 0 },
                          { label: `1 ${t('inspections.hoursShort')}`, value: 1 },
                          { label: `2 ${t('inspections.hoursShort')}`, value: 2 },
                          { label: `3 ${t('inspections.hoursShort')}`, value: 3 },
                          { label: `4 ${t('inspections.hoursShort')}`, value: 4 },
                          { label: `6 ${t('inspections.hoursShort')}`, value: 6 },
                          { label: `8 ${t('inspections.hoursShort')}`, value: 8 },
                          { label: `12 ${t('inspections.hoursShort')}`, value: 12 },
                        ]}
                      />
                    </Form.Item>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('inspections.dateRangeHint')}</Text>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text>{t('inspections.every')}</Text>
                  <Form.Item name="customIntervalHours" style={{ marginBottom: 0 }}>
                    <InputNumber min={1} max={24} style={{ width: 70 }} />
                  </Form.Item>
                  <Text>{t('inspections.hours')}</Text>
                </div>
              )}
            </div>
          )}

          {/* Exclusions */}
          {recurrenceType && recurrenceType !== 'once' && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 12 }}>{t('inspections.exclusions')}</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Form.Item name="excludeHolidays" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Switch size="small" />
                  </Form.Item>
                  <Text style={{ fontSize: 13 }}>{t('inspections.excludeHolidays')}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Form.Item name="excludeWeekends" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Switch size="small" />
                  </Form.Item>
                  <Text style={{ fontSize: 13 }}>{t('inspections.excludeWeekends')}</Text>
                </div>
              
              </div>

              {excludeHolidays && (
                <div style={{ marginTop: 12, marginLeft: 4 }}>
                  <DatePicker
                      onChange={(d: any) => {
                        if (d) {
                          const ds = (d as dayjs.Dayjs).format('YYYY-MM-DD');
                          if (!holidayDates.includes(ds)) setHolidayDates([...holidayDates, ds].sort());
                        }
                      }}
                      placeholder={t('inspections.addHolidayDate')}
                      style={{ width: 160, marginBottom: 8 }}
                      value={null as any}
                    />
                    {holidayDates.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {holidayDates.map((d) => (
                          <Tag key={d} closable onClose={() => setHolidayDates(holidayDates.filter((x) => x !== d))} color="red">
                            {dayjs(d).format('DD.MM.YYYY')}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Vacation / Leave Dates */}
          {recurrenceType && recurrenceType !== 'once' && (
            <div style={{ background: '#fffbe6', borderRadius: 8, padding: 16, marginBottom: 20, border: '1px solid #ffe58f' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#874d00', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined />
                {t('inspections.vacationDates')}
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                {t('inspections.vacationDatesHint')}
              </Text>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <DatePicker
                  onChange={addVacationDate}
                  placeholder={t('inspections.addVacationDate')}
                  style={{ width: 180 }}
                  value={null}
                  disabledDate={(d) => d.isBefore(dayjs(), 'day')}
                />
              </div>
              {vacationDates.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {vacationDates.map((d) => (
                    <Tag
                      key={d}
                      closable
                      onClose={() => removeVacationDate(d)}
                      color="orange"
                    >
                      {dayjs(d).format('DD.MM.YYYY')}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Time Window */}
          <div style={{ background: '#f0f5ff', borderRadius: 8, padding: 16, border: '1px solid #d6e4ff' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1d39c4', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClockCircleOutlined />
              {t('inspections.timeWindow')}
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              {t('inspections.timeWindowHint')}
            </Text>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Form.Item
                name="timeWindowStart"
                rules={[{ required: true, message: t('inspections.startTimeRequired') }]}
                style={{ marginBottom: 0 }}
              >
                <TimePicker format="HH:mm" placeholder={t('inspections.startTime')} size="middle" />
              </Form.Item>
              <span style={{ fontSize: 18, color: '#999' }}>—</span>
              <Form.Item
                name="timeWindowEnd"
                rules={[{ required: true, message: t('inspections.endTimeRequired') }]}
                style={{ marginBottom: 0 }}
              >
                <TimePicker format="HH:mm" placeholder={t('inspections.endTime')} size="middle" />
              </Form.Item>
            </div>
          </div>
        </section>
          </Col>
          <Col xs={24} lg={12} style={{ height: '100%', overflowY: 'auto', paddingLeft: 16, paddingRight: 8 }}>
        {/* Section 3: Options */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            {t('inspections.options')}
          </div>

          {/* QR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fafafa', borderRadius: 8, marginBottom: 12 }}>
            <Form.Item name="requiresQrStart" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <QrcodeOutlined style={{ fontSize: 18, color: '#666' }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{t('inspections.requiresQrStart')}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>{t('inspections.qrStartHint')}</Text>
            </div>
          </div>

          {/* Approval */}
          <div style={{ padding: '12px 16px', background: requiresApproval ? '#f6ffed' : '#fafafa', borderRadius: 8, border: requiresApproval ? '1px solid #b7eb8f' : '1px solid transparent', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: requiresApproval ? 16 : 0 }}>
              <Switch checked={requiresApproval} onChange={setRequiresApproval} />
              <CheckCircleOutlined style={{ fontSize: 18, color: requiresApproval ? '#52c41a' : '#666' }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{t('inspections.requiresApproval')}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>{t('inspections.approvalHint')}</Text>
              </div>
            </div>

            {requiresApproval && (
              <div style={{ marginLeft: 4, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>{t('inspections.approvalStepsHint')}</Text>

                {/* Timeline visualization */}
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  {/* Vertical line */}
                  <div style={{ position: 'absolute', left: 11, top: 12, bottom: approvalSteps.length > 0 ? 60 : 12, width: 2, background: 'linear-gradient(to bottom, #1677ff, #52c41a)' }} />

                  {/* Step 0: Assignee (executor) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, position: 'relative' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, position: 'relative', zIndex: 1, boxShadow: '0 2px 4px rgba(22,119,255,0.3)' }}>
                      1
                    </div>
                    <div style={{ flex: 1, background: '#e6f4ff', borderRadius: 8, padding: '10px 14px', border: '1px solid #91caff' }}>
                      <div style={{ fontSize: 11, color: '#1677ff', fontWeight: 600, marginBottom: 2 }}>{t('inspections.executor')}</div>
                      <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                        {watchedAssigneeIds?.length > 0
                          ? watchedAssigneeIds.map((aid: string) => {
                              const u = users.find((us) => us.id === aid);
                              return u ? `${u.firstName} ${u.lastName}` : '';
                            }).filter(Boolean).join(', ')
                          : <Text type="secondary" italic>{t('inspections.selectAssigneeFirst')}</Text>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Approval steps */}
                  {approvalSteps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, position: 'relative' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, position: 'relative', zIndex: 1, boxShadow: '0 2px 4px rgba(82,196,26,0.3)' }}>
                        {idx + 2}
                      </div>
                      <div style={{ flex: 1, background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: '#52c41a', fontWeight: 600, marginBottom: 4 }}>{t('inspections.approver')} {idx + 1}</div>
                          <Select
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="label"
                            placeholder={t('inspections.selectApprover')}
                            value={step.approverId || undefined}
                            onChange={(val) => updateApprovalStep(idx, val)}
                            options={users.map((u) => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))}
                          />
                        </div>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeApprovalStep(idx)} />
                      </div>
                    </div>
                  ))}

                  {/* Add step button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px dashed #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14, position: 'relative', zIndex: 1, background: '#fff' }}>
                      <PlusOutlined />
                    </div>
                    <Button type="dashed"  icon={<PlusOutlined />} onClick={addApprovalStep} style={{ flex: 1 }} disabled={!watchedAssigneeIds?.length}>
                      {t('inspections.addApprovalStep')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
          </Col>
        </Row>
      </Form>

      {/* Footer actions - fixed */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
        <Button size="medium" onClick={() => navigate('/inspection-assignments')}>{t('common.cancel')}</Button>
        <Button type="primary" size="medium" onClick={handleSubmit} loading={creating || updating}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
