"use client";

import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Grid, Layout, Menu } from "antd";
import Text from "antd/es/typography/Text";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const { Sider, Content, Header } = Layout;
const { useBreakpoint } = Grid;

type AppShellProps = {
  email: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

const navItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/items",
    icon: <AppstoreOutlined />,
    label: "Items",
  },
  {
    key: "/profile",
    icon: <UserOutlined />,
    label: "Profile",
  },
];

function SideNav({
  selectedKey,
  collapsed,
  onNavigate,
}: {
  selectedKey: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div
        style={{
          height: 64,
          margin: collapsed ? "0 8px" : "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <Link href="/dashboard" onClick={onNavigate}>
          <Text
            style={{
              color: "#fff",
              fontSize: collapsed ? 14 : 16,
              fontWeight: 600,
            }}
          >
            {collapsed ? "IB" : "Inventory Book"}
          </Text>
        </Link>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={navItems.map((item) => ({
          ...item,
          label: (
            <Link href={item.key} onClick={onNavigate}>
              {item.label}
            </Link>
          ),
        }))}
        style={{ borderInlineEnd: 0, background: "transparent" }}
      />
    </>
  );
}

export function AppShell({ email, signOutAction, children }: AppShellProps) {
  const pathname = usePathname();
  const screens = useBreakpoint();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Avoid SSR/client breakpoint mismatch; treat as desktop until mounted.
  const isMobile = mounted ? !screens.lg : false;

  const selectedKey =
    navItems.find(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
    )?.key ?? "/dashboard";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile ? (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={220}
          collapsedWidth={80}
          style={{ background: "var(--sider-bg)" }}
        >
          <SideNav selectedKey={selectedKey} collapsed={collapsed} />
        </Sider>
      ) : null}

      <Drawer
        placement="left"
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={240}
        styles={{
          body: { padding: 0, background: "var(--sider-bg)" },
          header: {
            background: "var(--sider-bg)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          },
        }}
        title={
          <Text style={{ color: "#fff", fontWeight: 600 }}>Inventory Book</Text>
        }
        closeIcon={<span style={{ color: "#fff" }}>×</span>}
      >
        <SideNav
          selectedKey={selectedKey}
          onNavigate={() => setDrawerOpen(false)}
        />
      </Drawer>

      <Layout>
        <Header
          style={{
            background: "var(--header-bg)",
            paddingInline: isMobile ? 12 : 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isMobile ? (
              <Button
                type="text"
                aria-label="Open navigation"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
              />
            ) : (
              <Button
                type="text"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((value) => !value)}
              />
            )}
            {isMobile ? (
              <Text strong style={{ color: "var(--foreground)" }}>
                Inventory Book
              </Text>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 4 : 12,
              minWidth: 0,
            }}
          >
            <ThemeToggle />
            {!isMobile ? (
              <Text
                style={{
                  color: "var(--muted)",
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email}
              </Text>
            ) : null}
            <form action={signOutAction}>
              <Button
                htmlType="submit"
                icon={<LogoutOutlined />}
                aria-label="Sign out"
              >
                {isMobile ? null : "Sign out"}
              </Button>
            </form>
          </div>
        </Header>
        <Content
          style={{
            padding: isMobile ? 16 : 24,
            background: "var(--page-bg)",
            minHeight: 280,
          }}
        >
          <div
            style={{
              background: "var(--card-bg)",
              padding: isMobile ? 16 : 24,
              borderRadius: 8,
              minHeight: "100%",
              color: "var(--foreground)",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
