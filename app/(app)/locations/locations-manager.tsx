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
  Pagination,
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
  MobileEmpty,
  MobileRecordList,
  mobileRecordCardStyle,
  mobileRecordMetaStyle,
} from "@/components/mobile-record-list";
import { TableFrame } from "@/components/table-frame";
import {
  createLocation,
  deleteLocation,
  setDefaultLocation,
  updateLocation,
  type LocationRecord,
} from "@/lib/actions/locations";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

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
  const isExpiredChecked = Form.useWatch("isExpired", form);
  const itemCount = editing?.itemCount ?? 0;
  // Can turn expired off anytime; can turn it on only when no items belong here.
  const expireDisabled =
    Boolean(editing) && itemCount > 0 && !Boolean(isExpiredChecked);
  const expiredExtra =
    editing && itemCount > 0
      ? itemCount === 1
        ? "Move or reassign the 1 item at this location before marking it expired."
        : `Move or reassign the ${itemCount} items at this location before marking it expired.`
      : "Only locations with no items can be marked expired.";

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
      width="min(520px, calc(100vw - 24px))"
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
                  : Promise.reject(new Error("Location name is required")),
            },
          ]}
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
        <Form.Item
          label="Expired"
          name="isExpired"
          valuePropName="checked"
          extra={expiredExtra}
        >
          <Switch disabled={expireDisabled} />
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
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRecord | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageItems = locations.slice((page - 1) * pageSize, page * pageSize);

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

  function renderActions(record: LocationRecord) {
    return (
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
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 600 }}>
          Locations
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          block={isMobile}
        >
          Add location
        </Button>
      </div>

      {isMobile ? (
        locations.length === 0 ? (
          <MobileEmpty>No locations yet. Add your first location.</MobileEmpty>
        ) : (
          <MobileRecordList>
            {pageItems.map((record) => (
              <div key={record.id} style={mobileRecordCardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          wordBreak: "break-word",
                        }}
                      >
                        {record.name}
                      </span>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          record.isDefault ? <StarFilled /> : <StarOutlined />
                        }
                        onClick={() => onSetDefault(record.id)}
                        disabled={record.isDefault}
                        aria-label={
                          record.isDefault
                            ? "Default location"
                            : "Set as default"
                        }
                        style={
                          record.isDefault ? { color: "#1677ff" } : undefined
                        }
                      />
                      {record.isExpired ? (
                        <Tag color="red">Expired</Tag>
                      ) : (
                        <Tag color="green">Active</Tag>
                      )}
                    </div>
                    <div style={mobileRecordMetaStyle}>
                      <span>{record.address.trim() || "No address"}</span>
                      {record.lat || record.lon ? (
                        <span>
                          {[record.lat, record.lon].filter(Boolean).join(", ")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {renderActions(record)}
                </div>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <Pagination
                simple
                current={page}
                pageSize={pageSize}
                total={locations.length}
                showSizeChanger
                pageSizeOptions={[10, 20, 50, 100]}
                onChange={(nextPage, nextSize) => {
                  if (nextSize && nextSize !== pageSize) {
                    setPageSize(nextSize);
                    setPage(1);
                    return;
                  }
                  setPage(nextPage);
                }}
              />
            </div>
          </MobileRecordList>
        )
      ) : (
        <TableFrame>
          <Table<LocationRecord>
            rowKey="id"
            dataSource={locations}
            loading={pending}
            pagination={{ pageSize: 10, simple: true }}
            scroll={{ x: 720 }}
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
                  value ? (
                    <Tag color="red">Yes</Tag>
                  ) : (
                    <Tag color="green">No</Tag>
                  ),
              },
              {
                title: "Actions",
                key: "actions",
                width: 96,
                render: (_, record) => renderActions(record),
              },
            ]}
            locale={{
              emptyText: "No locations yet. Add your first location.",
            }}
          />
        </TableFrame>
      )}

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
