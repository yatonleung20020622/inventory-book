"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  App,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createLocation,
  deleteLocation,
  setDefaultLocation,
  updateLocation,
  type LocationRecord,
} from "@/lib/actions/locations";

type LocationFormValues = {
  name: string;
  address: string;
  lat: string;
  lon: string;
  isExpired: boolean;
  isDefault: boolean;
};

type LocationsManagerProps = {
  locations: LocationRecord[];
};

const emptyFormValues: LocationFormValues = {
  name: "",
  address: "",
  lat: "",
  lon: "",
  isExpired: false,
  isDefault: false,
};

function LocationFormModal({
  open,
  editing,
  pending,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  editing: LocationRecord | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: LocationFormValues) => void;
}) {
  const [form] = Form.useForm<LocationFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        address: editing.address,
        lat: editing.lat,
        lon: editing.lon,
        isExpired: editing.isExpired,
        isDefault: editing.isDefault,
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
      title={editing ? "Edit location" : "Add location"}
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
        requiredMark={false}
        onFinish={onSubmit}
        initialValues={emptyFormValues}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="Home" />
        </Form.Item>
        <Form.Item label="Address" name="address">
          <Input.TextArea rows={2} placeholder="Street, city" />
        </Form.Item>
        <Form.Item label="Latitude" name="lat">
          <Input placeholder="e.g. 22.3193" />
        </Form.Item>
        <Form.Item label="Longitude" name="lon">
          <Input placeholder="e.g. 114.1694" />
        </Form.Item>
        <Form.Item label="Expired" name="isExpired" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          label="Default location"
          name="isDefault"
          valuePropName="checked"
          extra="Used as the default when adding items."
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function LocationsManager({ locations }: LocationsManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRecord | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(location: LocationRecord) {
    setEditing(location);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: LocationFormValues) {
    startTransition(async () => {
      const payload = {
        name: values.name,
        address: values.address,
        lat: values.lat,
        lon: values.lon,
        isExpired: values.isExpired,
        isDefault: values.isDefault,
      };

      const result = editing
        ? await updateLocation({ id: editing.id, ...payload })
        : await createLocation(payload);

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
      const result = await deleteLocation(id);
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      router.refresh();
    });
  }

  function onSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultLocation(id);
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Locations</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add location
        </Button>
      </div>

      <Table<LocationRecord>
        rowKey="id"
        dataSource={locations}
        loading={pending}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            width: 140,
          },
          {
            title: "Default",
            dataIndex: "isDefault",
            width: 96,
            align: "center",
            render: (value: boolean, record) => (
              <Button
                type="text"
                icon={value ? <StarFilled /> : <StarOutlined />}
                onClick={() => onSetDefault(record.id)}
                disabled={value}
                aria-label={value ? "Default location" : "Set as default"}
                style={value ? { color: "#1677ff" } : undefined}
              />
            ),
          },
          {
            title: "Address",
            dataIndex: "address",
            ellipsis: true,
          },
          {
            title: "Lat",
            dataIndex: "lat",
            width: 100,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
          },
          {
            title: "Lon",
            dataIndex: "lon",
            width: 100,
            render: (value: string) =>
              value ? value : <span style={{ opacity: 0.45 }}>-</span>,
          },
          {
            title: "Expired",
            dataIndex: "isExpired",
            width: 90,
            render: (value: boolean) =>
              value ? <Tag color="red">Yes</Tag> : <Tag color="green">No</Tag>,
          },
          {
            title: "Actions",
            key: "actions",
            width: 96,
            render: (_, record) => (
              <Space size={0}>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(record)}
                  aria-label="Edit location"
                />
                <Popconfirm
                  title="Delete this location?"
                  okText="Delete"
                  cancelText="Cancel"
                  onConfirm={() => onDelete(record.id)}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Delete location"
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        locale={{ emptyText: "No locations yet. Add your first location." }}
      />

      <LocationFormModal
        open={open}
        editing={editing}
        pending={pending}
        onCancel={closeModal}
        onSubmit={onSubmit}
      />
    </>
  );
}
