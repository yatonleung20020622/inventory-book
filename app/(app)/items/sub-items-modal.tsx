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
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
} from "antd";
import { useEffect, useState, useTransition } from "react";
import {
  createSubItem,
  deleteSubItem,
  listSubItems,
  updateSubItem,
  type SubItemRecord,
} from "@/lib/actions/sub-items";

type SubItemFormValues = {
  name: string;
  quantity: number;
  unit: string;
  remarks: string;
};

const emptyFormValues: SubItemFormValues = {
  name: "",
  quantity: 1,
  unit: "個",
  remarks: "",
};

type SubItemsModalProps = {
  open: boolean;
  itemId: string | null;
  itemName: string;
  onClose: () => void;
};

function SubItemFormModal({
  open,
  editing,
  pending,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  editing: SubItemRecord | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: SubItemFormValues) => void;
}) {
  const [form] = Form.useForm<SubItemFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        quantity: editing.quantity,
        unit: editing.unit,
        remarks: editing.remarks,
      });
      return;
    }
    form.setFieldsValue(emptyFormValues);
  }, [open, editing, form]);

  if (!open) {
    return null;
  }

  return (
    <Modal
      title={editing ? "Edit sub-item" : "Add sub-item"}
      open={open}
      onCancel={onCancel}
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
        initialValues={emptyFormValues}
      >
        <Form.Item
          label="Name"
          name="name"
          required
          rules={[
            {
              validator: (_, value: string) =>
                value?.trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error("Sub-item name is required")),
            },
          ]}
        >
          <Input placeholder="e.g. Charging cable" />
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
  );
}

export function SubItemsModal({
  open,
  itemId,
  itemName,
  onClose,
}: SubItemsModalProps) {
  const { message } = App.useApp();
  const [pending, startTransition] = useTransition();
  const [subItems, setSubItems] = useState<SubItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubItemRecord | null>(null);

  useEffect(() => {
    if (!open || !itemId) {
      setSubItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    listSubItems(itemId)
      .then((rows) => {
        if (!cancelled) {
          setSubItems(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          message.error("Failed to load sub-items.");
          setSubItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, itemId, message]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(subItem: SubItemRecord) {
    setEditing(subItem);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function refreshList() {
    if (!itemId) return;
    startTransition(async () => {
      try {
        const rows = await listSubItems(itemId);
        setSubItems(rows);
      } catch {
        message.error("Failed to refresh sub-items.");
      }
    });
  }

  function onSubmit(values: SubItemFormValues) {
    if (!itemId) return;

    startTransition(async () => {
      const payload = {
        name: values.name,
        quantity: values.quantity,
        unit: values.unit,
        remarks: values.remarks ?? "",
      };

      const result = editing
        ? await updateSubItem({ id: editing.id, itemId, ...payload })
        : await createSubItem({ itemId, ...payload });

      if (!result.ok) {
        message.error(result.message);
        return;
      }

      message.success(result.message);
      closeForm();
      refreshList();
    });
  }

  function onDelete(id: string) {
    if (!itemId) return;

    startTransition(async () => {
      const result = await deleteSubItem({ id, itemId });
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      refreshList();
    });
  }

  return (
    <>
      <Modal
        title={`Sub-items — ${itemName}`}
        open={open}
        onCancel={onClose}
        footer={null}
        width={720}
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
            onClick={openCreate}
            disabled={!itemId}
          >
            Add sub-item
          </Button>
        </div>

        <Table<SubItemRecord>
          rowKey="id"
          size="small"
          dataSource={subItems}
          loading={loading || pending}
          pagination={false}
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              ellipsis: true,
            },
            {
              title: "Qty",
              dataIndex: "quantity",
              width: 72,
            },
            {
              title: "Unit",
              dataIndex: "unit",
              width: 72,
            },
            {
              title: "Remarks",
              dataIndex: "remarks",
              ellipsis: true,
              render: (value: string) =>
                value ? value : <span style={{ opacity: 0.45 }}>-</span>,
            },
            {
              title: "Actions",
              key: "actions",
              width: 88,
              render: (_, record) => (
                <Space size={0}>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                    aria-label="Edit sub-item"
                  />
                  <Popconfirm
                    title="Delete this sub-item?"
                    okText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => onDelete(record.id)}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="Delete sub-item"
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: "No sub-items yet." }}
        />
      </Modal>

      <SubItemFormModal
        open={formOpen}
        editing={editing}
        pending={pending}
        onCancel={closeForm}
        onSubmit={onSubmit}
      />
    </>
  );
}
