"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createUser,
  deleteUser,
  updateUser,
  type AdminUserRecord,
} from "@/lib/actions/admin-users";

type UserFormValues = {
  email: string;
  username?: string;
  phone?: string;
  role: "USER" | "ADMIN";
  password?: string;
};

type UsersManagerProps = {
  users: AdminUserRecord[];
  currentUserId: string;
};

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

export function UsersManager({ users, currentUserId }: UsersManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRecord | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        email: editing.email,
        username: editing.username,
        phone: editing.phone,
        role: editing.role,
        password: "",
      });
      return;
    }
    form.setFieldsValue({
      email: "",
      username: "",
      phone: "",
      role: "USER",
      password: "",
    });
  }, [open, editing, form]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(user: AdminUserRecord) {
    setEditing(user);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: UserFormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateUser({
            id: editing.id,
            email: values.email,
            username: values.username,
            phone: values.phone,
            role: values.role,
            password: values.password,
          })
        : await createUser({
            email: values.email,
            username: values.username,
            phone: values.phone,
            role: values.role,
            password: values.password ?? "",
          });

      if (!result.ok) {
        message.error(result.message);
        return;
      }

      message.success(result.message);
      closeModal();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteUser(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add user
        </Button>
      </div>

      <Table<AdminUserRecord>
        rowKey="id"
        dataSource={users}
        loading={pending}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
        columns={[
          {
            title: "Username",
            dataIndex: "username",
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>—</span>,
          },
          {
            title: "Email",
            dataIndex: "email",
            ellipsis: true,
          },
          {
            title: "Phone",
            dataIndex: "phone",
            width: 120,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>—</span>,
          },
          {
            title: "Role",
            dataIndex: "role",
            width: 100,
            render: (value: "USER" | "ADMIN") => (
              <Tag color={value === "ADMIN" ? "blue" : "default"}>
                {value === "ADMIN" ? "Admin" : "User"}
              </Tag>
            ),
          },
          {
            title: "Created",
            dataIndex: "createdAt",
            width: 120,
            render: (value: string) => formatDate(value),
          },
          {
            title: "Actions",
            key: "actions",
            width: 96,
            render: (_, record) => {
              const isSelf = record.id === currentUserId;
              return (
                <Space size={0}>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                    aria-label="Edit user"
                  />
                  <Popconfirm
                    title="Delete this user?"
                    description="Their items, locations, and posts will be removed."
                    okText="Delete"
                    cancelText="Cancel"
                    disabled={isSelf}
                    onConfirm={() => onDelete(record.id)}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={isSelf}
                      aria-label="Delete user"
                    />
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
        locale={{ emptyText: "No users yet." }}
      />

      <Modal
        title={editing ? "Edit user" : "Add user"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={pending}
        okText={editing ? "Save" : "Create"}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={onSubmit}
          initialValues={{ role: "USER" }}
        >
          <Form.Item
            label="Email"
            name="email"
            required
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item label="Username" name="username">
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select
              options={[
                { value: "USER", label: "User" },
                { value: "ADMIN", label: "Admin" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={editing ? "New password" : "Password"}
            name="password"
            required={!editing}
            rules={
              editing
                ? [
                    {
                      validator: (_, value: string) =>
                        !value || value.length >= 6
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Password must be at least 6 characters"),
                            ),
                    },
                  ]
                : [
                    { required: true, message: "Password is required" },
                    {
                      min: 6,
                      message: "Password must be at least 6 characters",
                    },
                  ]
            }
            extra={editing ? "Leave blank to keep the current password." : undefined}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
