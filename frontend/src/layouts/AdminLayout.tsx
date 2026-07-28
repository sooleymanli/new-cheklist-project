import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Button, Avatar, Dropdown, Space, Drawer, Grid, Badge, Tooltip } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BankOutlined,
  CheckSquareOutlined,
  FormOutlined,
  FileTextOutlined,
  WarningOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  BellOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/useStore';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { logout, setCredentials } from '@/store/auth.slice';
import { toggleTheme } from '@/store/ui.slice';
import { useGetProfileQuery, useLogoutMutation } from '@/modules/auth/auth.api';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const LANGUAGES = [
  { key: 'az', label: '🇦🇿 Azərbaycanca', flag: '🇦🇿' },
  { key: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
  { key: 'ru', label: '🇷🇺 Русский', flag: '🇷🇺' },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const darkMode = useAppSelector((state) => state.ui.darkMode);
  const { has, hasAny } = usePermissions();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !!user || !accessToken });
  const [logoutMutation] = useLogoutMutation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  if (profile && !user) {
    dispatch(setCredentials({ accessToken: accessToken!, user: { ...profile, role: { ...profile.role, permissions: profile.permissions } } }));
  }

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('menu.dashboard'), permission: 'dashboard.view' },
    { key: '/roles', icon: <SettingOutlined />, label: t('menu.roles'), permission: 'role.view' },
    { key: '/users', icon: <UserOutlined />, label: t('menu.users'), permission: 'user.view' },
    { key: '/buildings', icon: <BankOutlined />, label: t('menu.buildings'), permission: 'building.view' },
    { key: '/checklist-templates', icon: <FormOutlined />, label: t('menu.checklistTemplates'), permission: 'checklist-template.view' },
    { key: '/inspection-assignments', icon: <ScheduleOutlined />, label: t('menu.inspectionAssignments'), permission: 'checklist-template.view' },
    { key: '/checklist-instances', icon: <CheckSquareOutlined />, label: t('menu.checklistInstances'), anyPermission: ['checklist-instance.view-all', 'checklist-instance.view-approver'] },
    { key: '/my-checklists', icon: <FileTextOutlined />, label: t('menu.myChecklists'), permission: 'checklist-instance.submit' },
    { key: '/incidents', icon: <WarningOutlined />, label: t('menu.incidents'), permission: 'incident.view' },
    { key: '/reports', icon: <BarChartOutlined />, label: t('menu.reports'), permission: 'report.view' },
  ].filter((item) => {
    const i = item as { permission?: string; anyPermission?: string[] };
    if (i.anyPermission) return hasAny(i.anyPermission);
    return has(i.permission);
  });

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // ignore network/auth errors; clear client state regardless
    }
    dispatch(logout());
    navigate('/login');
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) setDrawerOpen(false);
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: t('common.logout'), onClick: handleLogout },
  ];

  const activeMenuKey = menuItems.find((item) => location.pathname === item.key || (item.key !== '/' && location.pathname.startsWith(item.key + '/')))?.key || location.pathname;

  const getPageTitle = (): string => {
    const path = location.pathname;
    // Sub-route specific titles
    if (path === '/checklist-templates/new') return t('checklists.createTemplate');
    if (path.match(/^\/checklist-templates\/.+/) && path !== '/checklist-templates/new') return t('checklists.editTemplate');
    if (path === '/inspection-assignments/new') return t('inspections.assign');
    if (path.match(/^\/inspection-assignments\/.+/) && path !== '/inspection-assignments/new') return t('inspections.editAssignment');
    // Default: menu item label
    return (menuItems.find((item) => item.key === activeMenuKey)?.label as string) || '';
  };

  const siderMenu = (
    <>
      <div style={{ height: 48, margin: '12px 24px', display: 'flex', alignItems: 'center', }}>
        {collapsed && !isMobile
          ? <img src="/brand/mark-white.svg" alt="logo" style={{ height: 32, width: 'auto' }} />
          : <img src="/brand/logo-white.svg" alt="Facility" style={{ height: 32, width: 'auto' }} />
        }
      </div>
      <Menu
        theme="dark"
        mode="inline"
        style={{ background: darkMode ? '#141414' : '#001529' }}
        selectedKeys={[activeMenuKey]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{ background: darkMode ? '#141414' : '#001529' }}
        >
          {siderMenu}
        </Sider>
      )}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={250}
        styles={{ body: { padding: 0, background: darkMode ? '#141414' : '#001529' } }}
        closable={false}
      >
        {siderMenu}
      </Drawer>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}` }}>
          <Space align="center">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {getPageTitle()}
            </span>
          </Space>
          <Space size={isMobile ? 'small' : 'middle'} align="center">
            <Dropdown
              menu={{
                items: LANGUAGES.map((lang) => ({
                  key: lang.key,
                  label: lang.label,
                })),
                selectedKeys: [i18n.language],
                onClick: ({ key }) => handleLanguageChange(key),
              }}
              trigger={['click']}
            >
              <Button type="text" style={{ fontSize: 18, padding: '4px 8px', lineHeight: 1 }}>
                {LANGUAGES.find((l) => l.key === i18n.language)?.flag || '🇦🇿'}
              </Button>
            </Dropdown>
            <Tooltip title={darkMode ? t('common.lightMode') : t('common.darkMode')}>
              <Button
                type="text"
                shape="circle"
                icon={darkMode ? <SunOutlined style={{ color: '#faad14' }} /> : <MoonOutlined />}
                onClick={() => dispatch(toggleTheme())}
              />
            </Tooltip>
            <Tooltip title={t('menu.notifications') || 'Notifications'}>
              <Badge count={0} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined />}
                  onClick={() => navigate('/notifications')}
                />
              </Badge>
            </Tooltip>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer', marginLeft: 4 }}>
                {!isMobile && (
                  <div style={{ lineHeight: 1.3, textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.firstName} {user?.lastName}</div>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>{user?.role?.name}</div>
                  </div>
                )}
                <Avatar
                  style={{ backgroundColor: darkMode ? '#177ddc' : '#1677ff' }}
                  size={36}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, paddingBottom: 16, background: colorBgContainer, borderRadius: borderRadiusLG, overflow: 'auto', flex: 1 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
