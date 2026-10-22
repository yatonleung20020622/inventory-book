"use client";

import { Alert, Button, Card, Form, Input } from "antd";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFinish(values: LoginValues) {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email, username, or password.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card style={{ width: "100%", maxWidth: 420 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Sign in
      </Title>
      <Paragraph type="secondary">Inventory Book</Paragraph>

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Form<LoginValues>
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        initialValues={{ email: "", password: "" }}
      >
        <Form.Item
          label="Email or username"
          name="email"
          rules={[
            {
              required: true,
              message: "Email or username is required",
            },
          ]}
        >
          <Input
            autoComplete="username"
            size="large"
            placeholder="Email or username"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Password is required" }]}
        >
          <Input.Password autoComplete="current-password" size="large" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            Sign in
          </Button>
        </Form.Item>
      </Form>

      <Paragraph
        type="secondary"
        style={{ marginBottom: 0, marginTop: 8, textAlign: "center", fontSize: 13 }}
      >
        <Link href="/terms">Terms</Link>
        {" · "}
        <Link href="/privacy">Privacy</Link>
      </Paragraph>
    </Card>
  );
}
