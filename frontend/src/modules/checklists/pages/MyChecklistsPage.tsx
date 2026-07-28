import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Grid,
  Card,
  Tooltip,
  Badge,
  Typography,
  theme,
} from "antd";
import {
  SearchOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  SendOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useGetMyChecklistInstancesQuery,
  useStartChecklistInstanceMutation,
  useSubmitChecklistInstanceMutation,
  type ChecklistInstance,
} from "../checklistInstances.api";
import { App } from "antd";

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  pending: "blue",
  in_progress: "orange",
  submitted: "cyan",
  approved: "green",
  rejected: "red",
  overdue: "volcano",
};

const STATUS_DOT: Record<string, string> = {
  pending: "#1677ff",
  in_progress: "#fa8c16",
  submitted: "#13c2c2",
  approved: "#52c41a",
  rejected: "#ff4d4f",
  overdue: "#fa541c",
};

export default function MyChecklistsPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile =
    typeof screens.md === "undefined" ? window.innerWidth < 992 : !screens.md;
  const { token } = theme.useToken();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || undefined;
  const frequency = searchParams.get("frequency") || undefined;

  const { data, isLoading } = useGetMyChecklistInstancesQuery(
    {
      page,
      pageSize,
      search,
      status,
      frequency,
    },
    { refetchOnMountOrArgChange: true },
  );
  const [startInstance] = useStartChecklistInstanceMutation();
  const [submitInstance, { isLoading: submitting }] =
    useSubmitChecklistInstanceMutation();

  const getFillPath = (instance: ChecklistInstance) =>
    instance.locationId
      ? `/my-checklists/${instance.id}/fill`
      : `/my-checklists/${instance.id}/matrix`;

  const handleStart = async (id: string) => {
    try {
      const res: any = await startInstance(id).unwrap();
      if (res?.message) message.success(res.message);
      const instance = data?.data?.find((i) => i.id === id);
      navigate(instance ? getFillPath(instance) : `/my-checklists/${id}/fill`);
    } catch (err: any) {
      message.error(err?.data?.message || t("error.unexpected"));
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await submitInstance({ id }).unwrap();
      message.success(t("checklists.submittedForApproval"));
    } catch (err: any) {
      message.error(err?.data?.message || t("error.unexpected"));
    }
  };

  const formatDate = (v?: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    return (
      d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  };

  const isOverdue = (v?: string | null) => !!v && new Date(v) < new Date();

  const columns = [
    {
      title: t("checklists.templateName"),
      ellipsis: true,
      width: 260,

      render: (_: unknown, r: ChecklistInstance) => {
        const name = r.assignment?.name || r.template?.name;
        const description = r.assignment?.description || r.template?.description;
        return (
          <Space size={8} align="start">
            <FileTextOutlined
              style={{ color: token.colorPrimary, marginTop: 3, flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <Tooltip title={name}>
                <Text strong ellipsis style={{ display: 'block', maxWidth: 220 }}>
                  {name}
                </Text>
              </Tooltip>
              {description && (
                <Tooltip title={description}>
                  <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12, maxWidth: 220 }}>
                    {description}
                  </Text>
                </Tooltip>
              )}
            </div>
          </Space>
        );
      },
    },

    {
      title: t("checklists.dueAt"),
      dataIndex: "dueAt",
      width: 170,
      responsive: ["lg"] as any,
      render: (v: string) => (
        <Space size={4}>
          <CalendarOutlined
            style={{
              color: isOverdue(v) ? token.colorError : token.colorTextSecondary,
            }}
          />
          <Text
            type={isOverdue(v) ? "danger" : "secondary"}
            style={{ fontSize: 13 }}
          >
            {formatDate(v)}
          </Text>
        </Space>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      width: 140,
      render: (v: string) => (
        <Badge
          color={STATUS_DOT[v]}
          text={
            <Tag color={STATUS_COLORS[v]} style={{ margin: 0 }}>
              {t(`checklists.instanceStatus_${v}`)}
            </Tag>
          }
        />
      ),
    },
    {
      title: t("common.actions"),
      width: 280,
      align: "right" as const,
      render: (_: unknown, record: ChecklistInstance) => {
        if (record.status === "pending") {
          return (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record.id)}
                 style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    background: "#16a34a",
                    borderColor: "#16a34a",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
                  }}
            >
              {t("checklists.start")}
            </Button>
          );
        }
        if (record.status === "in_progress") {
          return (
            <Space size={8}>
               {record.canSubmit && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submitting}
                  onClick={() => handleSubmitForApproval(record.id)}
               
                >
                  {t("checklists.submitForApproval")}
                </Button>
              )}
              <Button
                icon={<ClockCircleOutlined />}
                onClick={() => navigate(getFillPath(record))}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  color: "#fa8c16",
                  borderColor: "#ffd591",
                  background: "#fff7e6",
                }}
              >
                {t("checklists.continue")}
              </Button>

             
            </Space>
          );
        }
        if (["submitted", "approved", "rejected"].includes(record.status)) {
          return (
            <Button
              icon={<EyeOutlined />}
              onClick={() => navigate(`/my-checklists/${record.id}/view`)}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                color: token.colorPrimary,
                borderColor: token.colorPrimaryBorder,
                background: token.colorPrimaryBg,
              }}
            >
              {t("checklists.viewEdit")}
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter bar */}
      <Card
        size="small"
        styles={{ body: { padding: "10px 16px" } }}
        style={{ borderRadius: token.borderRadiusLG }}
      >
        <Space wrap style={{ width: "100%" }}>
          <Input
            placeholder={t("common.search")}
            prefix={
              <SearchOutlined style={{ color: token.colorTextPlaceholder }} />
            }
            value={search}
            onChange={(e) =>
              setSearchParams((p) => {
                if (e.target.value) p.set("search", e.target.value);
                else p.delete("search");
                p.set("page", "1");
                return p;
              })
            }
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder={t("common.status")}
            value={status}
            onChange={(val) =>
              setSearchParams((p) => {
                if (val) p.set("status", val);
                else p.delete("status");
                p.set("page", "1");
                return p;
              })
            }
            style={{ width: 180 }}
            allowClear
            options={[
              {
                label: t("checklists.instanceStatus_pending"),
                value: "pending",
              },
              {
                label: t("checklists.instanceStatus_in_progress"),
                value: "in_progress",
              },
              {
                label: t("checklists.instanceStatus_submitted"),
                value: "submitted",
              },
              {
                label: t("checklists.instanceStatus_approved"),
                value: "approved",
              },
              {
                label: t("checklists.instanceStatus_rejected"),
                value: "rejected",
              },
              {
                label: t("checklists.instanceStatus_overdue"),
                value: "overdue",
              },
            ]}
          />
          <Select
            placeholder={t("inspections.recurrence")}
            value={frequency}
            onChange={(val) =>
              setSearchParams((p) => {
                if (val) p.set("frequency", val);
                else p.delete("frequency");
                p.set("page", "1");
                return p;
              })
            }
            style={{ width: 180 }}
            allowClear
            options={[
              { label: t("inspections.recurrence_once"), value: "once" },
              { label: t("inspections.recurrence_daily"), value: "daily" },
              { label: t("inspections.recurrence_weekly"), value: "weekly" },
              { label: t("inspections.recurrence_monthly"), value: "monthly" },
              { label: t("inspections.recurrence_quarterly"), value: "quarterly" },
              { label: t("inspections.recurrence_yearly"), value: "yearly" },
              { label: t("inspections.recurrence_custom"), value: "custom" },
            ]}
          />
          {(search || status || frequency) && (
            <Button
              onClick={() =>
                setSearchParams((p) => {
                  p.delete("search");
                  p.delete("status");
                  p.delete("frequency");
                  p.set("page", "1");
                  return p;
                })
              }
            >
              {t("common.clearFilters") || "Filterləri təmizlə"}
            </Button>
          )}
        </Space>
      </Card>

      {/* Table */}
      {isMobile ? (
        <div>
          {(data?.data ?? []).map((instance: ChecklistInstance) => {
            const overdue = isOverdue(instance.dueAt);
            const displayName = instance.assignment?.name || instance.template?.name;
            const displayDesc = instance.assignment?.description || instance.template?.description;
            return (
              <Card
                key={instance.id}
                size="small"
                style={{
                  marginBottom: 12,
                  borderRadius: token.borderRadiusLG,
                  borderLeft: `4px solid ${STATUS_DOT[instance.status] ?? token.colorBorder}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
                styles={{ body: { padding: 14 } }}
              >
                {/* Title + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <Space size={8} align="start" style={{ minWidth: 0 }}>
                    <FileTextOutlined style={{ color: token.colorPrimary, marginTop: 3, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <Text strong style={{ fontSize: 15, lineHeight: 1.3, display: 'block' }}>
                        {displayName}
                      </Text>
                      {displayDesc && (
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                          {displayDesc}
                        </Text>
                      )}
                    </div>
                  </Space>
                  <Tag color={STATUS_COLORS[instance.status]} style={{ margin: 0, flexShrink: 0 }}>
                    {t(`checklists.instanceStatus_${instance.status}`)}
                  </Tag>
                </div>

                {/* Meta: location + dueAt */}
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {instance.location && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      <EnvironmentOutlined style={{ marginRight: 6 }} />
                      {instance.location.building?.name} / {instance.location.name}
                    </Text>
                  )}
                  {instance.dueAt && (
                    <Text type={overdue ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {formatDate(instance.dueAt)}
                      {overdue && ` · ${t('checklists.instanceStatus_overdue')}`}
                    </Text>
                  )}
                </div>

                {/* Actions */}
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {instance.status === 'pending' && (
                    <Button
                      type="primary"
                      block
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleStart(instance.id)}
     style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    background: "#16a34a",
                    borderColor: "#16a34a",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
                  }}                    >
                      {t('checklists.start')}
                    </Button>
                  )}
                  {instance.status === 'in_progress' && (
                    <>
                      <Button
                        block
                        icon={<ClockCircleOutlined />}
                        onClick={() => navigate(getFillPath(instance))}
                        style={{
                          borderRadius: 8,
                          fontWeight: 600,
                          color: '#fa8c16',
                          borderColor: '#ffd591',
                          background: '#fff7e6',
                        }}
                      >
                        {t('checklists.continue')}
                      </Button>
                      {instance.canSubmit && (
                        <Button
                          type="primary"
                          block
                          icon={<SendOutlined />}
                          loading={submitting}
                          onClick={() => handleSubmitForApproval(instance.id)}
                       
                        >
                          {t('checklists.submitForApproval')}
                        </Button>
                      )}
                    </>
                  )}
                  {['submitted', 'approved', 'rejected'].includes(instance.status) && (
                    <Button
                      block
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/my-checklists/${instance.id}/view`)}
                      style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        color: token.colorPrimary,
                        borderColor: token.colorPrimaryBorder,
                        background: token.colorPrimaryBg,
                      }}
                    >
                      {t('checklists.viewEdit')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {!isLoading && (data?.data?.length ?? 0) === 0 && (
            <Card size="small" style={{ borderRadius: token.borderRadiusLG, textAlign: 'center' }}>
              <Text type="secondary">{t('common.noData') || 'Məlumat yoxdur'}</Text>
            </Card>
          )}
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          size="small"
          scroll={{ x: 820, y: "calc(100vh - 340px)" }}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total,
            showSizeChanger: true,
            showQuickJumper: true,
            position: ["bottomRight"],
            onChange: (p, ps) =>
              setSearchParams((prev) => {
                prev.set("page", String(p));
                prev.set("pageSize", String(ps));
                return prev;
              }),
          }}
          rowClassName={(r: ChecklistInstance) =>
            r.status === "overdue" ? "mcp-row-overdue" : ""
          }
          style={{ borderRadius: token.borderRadiusLG }}
          sticky
        />
      )}
      <style>{`
        .mcp-row-overdue td { background: rgba(255, 77, 79, 0.04) !important; }
        .mcp-row-overdue:hover td { background: rgba(255, 77, 79, 0.08) !important; }
      `}</style>
    </div>
  );
}
