"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createItem,
  deleteItem,
  updateItem,
  type ItemRecord,
} from "@/lib/actions/items";

type ItemFormValues = {
  name: string;
  quantity: number;
  unit: string;
};

type ItemsManagerProps = {
  items: ItemRecord[];
};

export function ItemsManager({ items }: ItemsManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItemRecord | null>(null);
  const [form] = Form.useForm<ItemFormValues>();

  function openCreate() {
    setEditing(null);
    form.setFieldsValue({ name: "", quantity: 1, unit: "個" });
    setOpen(true);
  }

  function openEdit(item: ItemRecord) {
    setEditing(item);
    form.setFieldsValue({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  }

  function onSubmit(values: ItemFormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateItem({
            id: editing.id,
            name: values.name,
            quantity: values.quantity,
            unit: values.unit,
          })
        : await createItem({
            name: values.name,
            quantity: values.quantity,
            unit: values.unit,
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
      const result = await deleteItem(id);
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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Items</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add item
        </Button>
      </div>

      <Table<ItemRecord>
        rowKey="id"
        dataSource={items}
        loading={pending}
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
          },
          {
            title: "Quantity",
            dataIndex: "quantity",
            width: 120,
          },
          {
            title: "Unit",
            dataIndex: "unit",
            width: 100,
          },
          {
            title: "Actions",
            key: "actions",
            width: 160,
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(record)}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this item?"
                  okText="Delete"
                  cancelText="Cancel"
                  onConfirm={() => onDelete(record.id)}
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        locale={{ emptyText: "No items yet. Add your first item." }}
      />

      <Modal
        title={editing ? "Edit item" : "Add item"}
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
          requiredMark={false}
          onFinish={onSubmit}
          initialValues={{ name: "", quantity: 1, unit: "個" }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="USB-C 充電線" />
          </Form.Item>
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Quantity is required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Unit"
            name="unit"
            rules={[{ required: true, message: "Unit is required" }]}
          >
            <Input placeholder="個" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
