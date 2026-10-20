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
import { useEffect, useState, useTransition } from "react";
import {
  createItem,
  deleteItem,
  updateItem,
  type ItemRecord,
} from "@/lib/actions/items";

type ItemFormValues = {
  name: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  boughtYear: string;
  remarks: string;
};

type ItemsManagerProps = {
  items: ItemRecord[];
};

const emptyFormValues: ItemFormValues = {
  name: "",
  desc: "",
  quantity: 1,
  unit: "個",
  estimatedPrice: "",
  boughtYear: "",
  remarks: "",
};

export function ItemsManager({ items }: ItemsManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItemRecord | null>(null);
  const [form] = Form.useForm<ItemFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        desc: editing.desc,
        quantity: editing.quantity,
        unit: editing.unit,
        estimatedPrice: editing.estimatedPrice,
        boughtYear: editing.boughtYear,
        remarks: editing.remarks,
      });
      return;
    }
    form.setFieldsValue(emptyFormValues);
  }, [open, editing, form]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: ItemRecord) {
    setEditing(item);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: ItemFormValues) {
    startTransition(async () => {
      const payload = {
        name: values.name,
        desc: values.desc,
        quantity: values.quantity,
        unit: values.unit,
        estimatedPrice: values.estimatedPrice,
        boughtYear: values.boughtYear,
        remarks: values.remarks,
      };

      const result = editing
        ? await updateItem({ id: editing.id, ...payload })
        : await createItem(payload);

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
        scroll={{ x: 1100 }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            fixed: "left",
            width: 160,
          },
          {
            title: "Desc",
            dataIndex: "desc",
            ellipsis: true,
            width: 180,
          },
          {
            title: "Quantity",
            dataIndex: "quantity",
            width: 100,
          },
          {
            title: "Unit",
            dataIndex: "unit",
            width: 80,
          },
          {
            title: "Est. price",
            dataIndex: "estimatedPrice",
            width: 120,
            ellipsis: true,
          },
          {
            title: "Bought year",
            dataIndex: "boughtYear",
            width: 110,
          },
          {
            title: "Remarks",
            dataIndex: "remarks",
            ellipsis: true,
            width: 180,
          },
          {
            title: "Actions",
            key: "actions",
            width: 160,
            fixed: "right",
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
        forceRender
        afterClose={() => form.resetFields()}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSubmit}
          initialValues={emptyFormValues}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="USB-C 充電線" />
          </Form.Item>
          <Form.Item label="Desc" name="desc">
            <Input.TextArea
              rows={2}
              placeholder="Optional description"
              maxLength={1000}
              showCount
            />
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
          <Form.Item label="Estimated price" name="estimatedPrice">
            <Input placeholder="e.g. 120 HKD" />
          </Form.Item>
          <Form.Item label="Bought year" name="boughtYear">
            <Input placeholder="e.g. 2024" />
          </Form.Item>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea
              rows={2}
              placeholder="Optional remarks"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
