"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
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
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TableFrame } from "@/components/table-frame";
import {
  deleteTrainExercise,
  upsertTrainExercise,
  type TrainExerciseRecord,
} from "@/lib/actions/training";

type FormValues = {
  name: string;
  defaultRestSec: number;
  notes: string;
  sortOrder: number;
};

const emptyValues: FormValues = {
  name: "",
  defaultRestSec: 60,
  notes: "",
  sortOrder: 0,
};

export function TrainingExercisesManager({
  exercises,
}: {
  exercises: TrainExerciseRecord[];
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TrainExerciseRecord | null>(null);
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        defaultRestSec: editing.defaultRestSec,
        notes: editing.notes,
        sortOrder: editing.sortOrder,
      });
      return;
    }
    form.setFieldsValue(emptyValues);
  }, [open, editing, form]);

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await upsertTrainExercise({
        id: editing?.id,
        name: values.name,
        defaultRestSec: values.defaultRestSec,
        notes: values.notes ?? "",
        sortOrder: values.sortOrder ?? 0,
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
      const result = await deleteTrainExercise(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Exercises</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            Catalog of movements with default rest between sets.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Add exercise
        </Button>
      </div>

      <TableFrame>
        <Table
          rowKey="id"
          dataSource={exercises}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: "Name", dataIndex: "name" },
            {
              title: "Default rest",
              dataIndex: "defaultRestSec",
              width: 120,
              render: (sec: number) => `${sec}s`,
            },
            {
              title: "Order",
              dataIndex: "sortOrder",
              width: 80,
            },
            {
              title: "Notes",
              dataIndex: "notes",
              ellipsis: true,
            },
            {
              title: "Actions",
              key: "actions",
              width: 120,
              render: (_: unknown, row: TrainExerciseRecord) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete this exercise?"
                    onConfirm={() => onDelete(row.id)}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={pending}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </TableFrame>

      <Modal
        title={editing ? "Edit exercise" : "Add exercise"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={pending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={emptyValues}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Push-up" />
          </Form.Item>
          <Form.Item
            label="Default rest (seconds)"
            name="defaultRestSec"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Sort order" name="sortOrder">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
