"use client";

import {
  AppstoreOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  TagsOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Grid, Layout, Menu, Tooltip } from "antd";
import Text from "antd/es/typography/Text";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageAboveCardProvider } from "@/components/page-above-card";
import { ThemeToggle } from "@/components/theme-toggle";

const { Sider, Content, Header, Footer } = Layout;
const { useBreakpoint } = Grid;

type AppShellProps = {
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

const baseNavItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/sales",
    icon: <ShopOutlined />,
    label: "Selling now",
  },
  {
    key: "/sales/mine",
    icon: <TagOutlined />,
    label: "My posts",
  },
  {
    key: "/items",
    icon: <AppstoreOutlined />,
    label: "Items",
  },
  {
    key: "/locations",
    icon: <EnvironmentOutlined />,
    label: "Locations",
  },
  {
    key: "/categories",
    icon: <TagsOutlined />,
    label: "Categories",
  },
];

const adminNavItem = {
  key: "/admin/users",
  icon: <TeamOutlined />,
  label: "Users",
};

function SideNav({
  email,
  username,
  role,
  selectedKey,
  collapsed,
  onNavigate,
}: {
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  selectedKey: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const profileActive = selectedKey === "/profile";
  const displayName = username.trim() || "Account";
  const navItems =
    role === "ADMIN" ? [...baseNavItems, adminNavItem] : baseNavItems;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          height: 64,
          margin: collapsed ? "0 8px" : "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          overflow: "hidden",
          whiteSpace: "nowrap",
          flexShrink: 0,
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
        selectedKeys={
          selectedKey === "/profile" ? [] : selectedKey ? [selectedKey] : []
        }
        items={navItems.flatMap((item) => {
          const menuItem = {
            ...item,
            label: (
              <Link href={item.key} onClick={onNavigate}>
                {item.label}
              </Link>
            ),
          };
          // Group breaks: Dashboard | Selling | Items + Locations + Categories | Users (admin)
          if (
            item.key === "/dashboard" ||
            item.key === "/sales/mine" ||
            (item.key === "/categories" && role === "ADMIN")
          ) {
            return [
              menuItem,
              { type: "divider" as const, key: `${item.key}-divider` },
            ];
          }
          return [menuItem];
        })}
        style={{
          borderInlineEnd: 0,
          background: "transparent",
          flex: 1,
          minHeight: 0,
        }}
      />

      <div
        style={{
          flexShrink: 0,
          padding: collapsed ? "12px 8px" : "12px 12px",
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Tooltip title={email} placement="right">
          <Link
            href="/profile"
            onClick={onNavigate}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
              padding: collapsed ? "10px 0" : "10px 12px",
              borderRadius: 8,
              background: profileActive
                ? "rgba(22, 119, 255, 0.85)"
                : "transparent",
              color: "#fff",
              textDecoration: "none",
              overflow: "hidden",
            }}
          >
            <UserOutlined style={{ fontSize: 16, flexShrink: 0 }} />
            {!collapsed ? (
              <Text
                style={{
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {displayName}
              </Text>
            ) : null}
          </Link>
        </Tooltip>
      </div>
    </div>
  );
}

export function AppShell({
  email,
  username,
  role,
  signOutAction,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const screens = useBreakpoint();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = mounted ? !screens.lg : false;
  const navItems =
    role === "ADMIN" ? [...baseNavItems, adminNavItem] : baseNavItems;

  const selectedKey = pathname.startsWith("/profile")
    ? "/profile"
    : ([...navItems]
      .sort((a, b) => b.key.length - a.key.length)
      .find(
        (item) =>
          pathname === item.key || pathname.startsWith(`${item.key}/`),
      )?.key ?? "/dashboard");

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
          <div style={{ height: "100%" }}>
            <SideNav
              email={email}
              username={username}
              role={role}
              selectedKey={selectedKey}
              collapsed={collapsed}
            />
          </div>
        </Sider>
      ) : null}

      <Drawer
        placement="left"
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size={240}
        styles={{
          body: {
            padding: 0,
            background: "var(--sider-bg)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
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
          email={email}
          username={username}
          role={role}
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
            padding: isMobile ? 12 : 24,
            background: "var(--page-bg)",
            minHeight: 280,
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          <PageAboveCardProvider>
            <div
              style={{
                background: "var(--card-bg)",
                padding: isMobile ? 14 : 24,
                borderRadius: 8,
                minHeight: "100%",
                minWidth: 0,
                maxWidth: "100%",
                overflowX: "hidden",
                color: "var(--foreground)",
              }}
            >
              {children}
            </div>
          </PageAboveCardProvider>
        </Content>
        <Footer
          style={{
            textAlign: "center",
            background: "var(--page-bg)",
            color: "var(--muted)",
            padding: "12px 24px 20px",
            fontSize: 13,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0 10px",
              rowGap: 6,
            }}
          >
            <Link href="/terms" style={{ color: "var(--muted)" }}>
              Terms
            </Link>
            <span aria-hidden style={{ opacity: 0.45 }}>
              |
            </span>
            <Link href="/privacy" style={{ color: "var(--muted)" }}>
              Privacy
            </Link>
            <span aria-hidden style={{ opacity: 0.45 }}>
              |
            </span>
            <span>Created by AndrewL. All rights reserved.</span>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
}
