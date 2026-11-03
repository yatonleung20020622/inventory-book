"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  ColorPicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
} from "antd";
import type { Color } from "antd/es/color-picker";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CategoryTag } from "@/components/category-tag";
import {
  createTravelGroup,
  deleteTravelGroup,
  updateTravelGroup,
  type TravelGroupRecord,
} from "@/lib/actions/travel-groups";

type GroupFormValues = {
  name: string;
  color: string;
};

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function GroupColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const trimmed = (value ?? "").trim();
  const hasColor = Boolean(trimmed) && isHexColor(trimmed);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ColorPicker
        value={hasColor ? trimmed : "#1677FF"}
        onChange={(color: Color) => onChange?.(color.toHexString())}
        allowClear
        onClear={() => onChange?.("")}
        showText
        size="large"
        aria-label="Pick group color"
      />
      <span style={{ color: "var(--muted)", fontSize: 13 }}>
        {hasColor ? trimmed.toUpperCase() : "No color"}
      </span>
    </div>
  );
}

export function TravelGroupsModal({
  open,
  groups,
  onClose,
}: {
  open: boolean;
  groups: TravelGroupRecord[];
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TravelGroupRecord | null>(null);
  const [form] = Form.useForm<GroupFormValues>();

  useEffect(() => {
    if (!formOpen) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        color: editing.color || "",
      });
      return;
    }
    form.setFieldsValue({ name: "", color: "#1677FF" });
  }, [editing, form, formOpen]);

  function submitGroup(values: GroupFormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateTravelGroup({
            id: editing.id,
            name: values.name,
            color: values.color ?? "",
          })
        : await createTravelGroup({
            name: values.name,
            color: values.color,
          });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setFormOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTravelGroup(id);
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
      <Modal
        title="Travel groups"
        open={open}
        onCancel={onClose}
        footer={null}
        width="min(720px, calc(100vw - 24px))"
        destroyOnHidden
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add group
          </Button>
        </div>
        <Table<TravelGroupRecord>
          rowKey="id"
          size="middle"
          dataSource={groups}
          pagination={false}
          locale={{ emptyText: "No groups yet." }}
          columns={[
            {
              title: "Group",
              key: "name",
              render: (_value, record) => (
                <CategoryTag name={record.name} color={record.color} />
              ),
            },
            {
              title: "Places",
              dataIndex: "placeCount",
              key: "placeCount",
              width: 90,
              align: "right",
            },
            {
              title: "Action",
              key: "action",
              width: 100,
              render: (_value, record) => (
                <Space size={0}>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    aria-label="Edit group"
                    onClick={() => {
                      setEditing(record);
                      setFormOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete this group?"
                    description="Places stay; they become ungrouped."
                    onConfirm={() => onDelete(record.id)}
                    okButtonProps={{ danger: true, loading: pending }}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="Delete group"
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title={editing ? "Edit group" : "Add group"}
        open={formOpen}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={pending}
        okText={editing ? "Save" : "Create"}
        destroyOnHidden
        width="min(480px, calc(100vw - 24px))"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitGroup}
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Hong Kong, Japan 2024" />
          </Form.Item>
          <Form.Item name="color" label="Color">
            <GroupColorPicker />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
