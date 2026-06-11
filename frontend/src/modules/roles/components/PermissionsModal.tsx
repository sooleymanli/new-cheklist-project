import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  App,
  Spin,
  Card,
  Checkbox,
  Row,
  Col,
  Tag,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import {
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useAssignPermissionsMutation,
  type Role,
} from "../roles.api";

const { Text } = Typography;

const RESOURCE_COLORS: Record<string, string> = {
  user: "blue",
  role: "purple",
  building: "green",
  floor: "cyan",
  location: "orange",
  checklist: "magenta",
  incident: "red",
  report: "gold",
  notification: "geekblue",
};

interface Props {
  role: Role | null;
  onClose: () => void;
}

export function PermissionsModal({ role, onClose }: Props) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { data: permissions, isLoading: loadingAll } = useGetPermissionsQuery(
    undefined,
    { skip: !role },
  );
  const { data: rolePermissions, isLoading: loadingRole } =
    useGetRolePermissionsQuery(role?.id!, { skip: !role });
  const [assignPermissions, { isLoading: assigning }] =
    useAssignPermissionsMutation();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (rolePermissions) {
      setSelected(rolePermissions.map((p) => p.id));
    }
  }, [rolePermissions]);

  const handleSave = async () => {
    if (!role) return;
    try {
      const res = await assignPermissions({
        roleId: role.id,
        permissionIds: selected,
      }).unwrap();
      message.success(res.message || "✓");
      onClose();
    } catch (err: any) {
      message.error(err?.data?.message || t("error.unexpected"));
    }
  };

  const grouped = useMemo(() => {
    return (
      permissions?.reduce(
        (acc, p) => {
          const [resource] = p.name.split(".");
          if (!resource) return acc;
          if (!acc[resource]) acc[resource] = [];
          acc[resource].push(p);
          return acc;
        },
        {} as Record<string, typeof permissions>,
      ) || {}
    );
  }, [permissions]);

  const handleGroupToggle = (perms: typeof permissions, checked: boolean) => {
    if (!perms) return;
    const permIds = perms.map((p) => p.id);
    if (checked) {
      setSelected((prev) => [...new Set([...prev, ...permIds])]);
    } else {
      setSelected((prev) =>
        prev.filter((id) => !permIds.some((pid) => pid === id)),
      );
    }
  };

  const isGroupAllSelected = (perms: typeof permissions) => {
    if (!perms) return false;
    return perms.every((p) => selected.includes(p.id));
  };

  const isGroupIndeterminate = (perms: typeof permissions) => {
    if (!perms) return false;
    const some = perms.some((p) => selected.includes(p.id));
    const all = perms.every((p) => selected.includes(p.id));
    return some && !all;
  };

  return (
    <Modal
      title={`${t("roles.permissionsTitle")} — ${role?.name || ""}`}
      open={!!role}
      onOk={handleSave}
      onCancel={onClose}
      confirmLoading={assigning}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      width="100vw"
      style={{ top: 0, maxWidth: '100vw', paddingBottom: 0 }}
      styles={{ body: { height: 'calc(100vh - 110px)', overflow: 'auto' } }}
    >
      {loadingAll || loadingRole ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ paddingRight: 4 }}>
          <Row gutter={[12, 12]}>
            {Object.entries(grouped).map(([resource, perms]) => (
              <Col xs={24} sm={12} key={resource}>
                <Card
                  size="small"
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Tag
                        color={RESOURCE_COLORS[resource] || "default"}
                        style={{ margin: 0 }}
                      >
                        {t(`permissions.resources.${resource}`, resource)}
                      </Tag>
                      <Checkbox
                        checked={isGroupAllSelected(perms)}
                        indeterminate={isGroupIndeterminate(perms)}
                        onChange={(e) =>
                          handleGroupToggle(perms, e.target.checked)
                        }
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t("common.all")}
                        </Text>
                      </Checkbox>
                    </div>
                  }
                  styles={{ body: { padding: "8px 12px" } }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {perms!.map((p) => {
                      const action = p.name.split(".")[1] || "";
                      return (
                        <Checkbox
                          key={p.id}
                          checked={selected.includes(p.id)}
                          onChange={(e) => {
                            setSelected((prev) =>
                              e.target.checked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id),
                            );
                          }}
                        >
                          {t(`permissions.actions.${action}`, action)}
                        </Checkbox>
                      );
                    })}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Modal>
  );
}
