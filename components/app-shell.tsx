"use client";

import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import Text from "antd/es/typography/Text";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const { Sider, Content, Header } = Layout;

type AppShellProps = {
  email: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

const navItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: "/items",
    icon: <AppstoreOutlined />,
    label: <Link href="/items">Items</Link>,
  },
  {
    key: "/profile",
    icon: <UserOutlined />,
    label: <Link href="/profile">Profile</Link>,
  },
];

export function AppShell({ email, signOutAction, children }: AppShellProps) {
  const pathname = usePathname();
  const selectedKey =
    navItems.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
      ?.key ?? "/dashboard";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={64}
        width={220}
        style={{ background: "#001529" }}
      >
        <div
          style={{
            height: 64,
            margin: "0 16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Link href="/dashboard">
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
              Inventory Book
            </Text>
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems}
          style={{ borderInlineEnd: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            paddingInline: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 16,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Text type="secondary">{email}</Text>
          <form action={signOutAction}>
            <Button htmlType="submit" icon={<LogoutOutlined />}>
              Sign out
            </Button>
          </form>
        </Header>
        <Content style={{ padding: 24, background: "#f5f5f5", minHeight: 280 }}>
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minHeight: "100%",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
