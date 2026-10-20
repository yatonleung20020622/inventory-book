"use client";

import { Alert, Button, Card, Form, Input } from "antd";
import Title from "antd/es/typography/Title";
import { startTransition, useActionState, useEffect } from "react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/lib/actions/password";

const initialState: ChangePasswordState | null = null;

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const [form] = Form.useForm();

  useEffect(() => {
    if (state?.ok) {
      form.resetFields();
    }
  }, [state, form]);

  return (
    <Card style={{ maxWidth: 480 }}>
      <Title level={4} style={{ marginTop: 0 }}>
        Reset password
      </Title>

      {state ? (
        <Alert
          type={state.ok ? "success" : "error"}
          title={state.message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => {
          const data = new FormData();
          data.set("currentPassword", values.currentPassword);
          data.set("newPassword", values.newPassword);
          data.set("confirmPassword", values.confirmPassword);
          startTransition(() => {
            formAction(data);
          });
        }}
      >
        <Form.Item
          label="Current password"
          name="currentPassword"
          rules={[{ required: true, message: "Current password is required" }]}
        >
          <Input.Password autoComplete="current-password" size="large" />
        </Form.Item>

        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: "New password is required" },
            { min: 6, message: "At least 6 characters" },
          ]}
        >
          <Input.Password autoComplete="new-password" size="large" />
        </Form.Item>

        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" size="large" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={pending}
          >
            Update password
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
