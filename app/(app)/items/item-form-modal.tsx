"use client";

import {
  AutoComplete,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";
import type { Color } from "antd/es/color-picker";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { ItemRecord } from "@/lib/actions/items";

export type ItemFormLocationOption = {
  id: string;
  name: string;
  isExpired: boolean;
  isDefault: boolean;
};

export type ItemFormCategoryOption = {
  id: string;
  name: string;
  color: string;
};

export type ItemFormValues = {
  name: string;
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  actualPrice: string;
  isBox: boolean;
  boxPurpose: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationId: string | null;
  categoryIds: string[];
};

export const emptyItemFormValues: ItemFormValues = {
  name: "",
  brand: "",
  majorColor: "",
  desc: "",
  quantity: 1,
  unit: "個",
  estimatedPrice: "",
  actualPrice: "",
  isBox: false,
  boxPurpose: "",
  purchaseDate: "",
  notice: "",
  remarks: "",
  locationId: null,
  categoryIds: [],
};

export function getDefaultLocationId(
  locations: ItemFormLocationOption[],
): string | null {
  const markedDefault = locations.find((location) => location.isDefault);
  if (markedDefault) {
    return markedDefault.id;
  }
  if (locations.length === 1) {
    return locations[0].id;
  }
  return null;
}

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function MajorColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const trimmed = (value ?? "").trim();
  const hasColor = Boolean(trimmed) && isHexColor(trimmed);

  function handleChange(color: Color) {
    onChange?.(color.toHexString());
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ColorPicker
        value={hasColor ? trimmed : undefined}
        onChange={handleChange}
        allowClear
        onClear={() => onChange?.("")}
        showText={false}
        size="large"
        aria-label="Pick major color"
      />
      <span style={{ color: "var(--muted)", fontSize: 13 }}>
        {hasColor ? "Tap swatch to change" : "No color"}
      </span>
    </div>
  );
}

type ItemFormModalProps = {
  open: boolean;
  editing: ItemRecord | null;
  pending: boolean;
  locations: ItemFormLocationOption[];
  categories: ItemFormCategoryOption[];
  brandOptions: string[];
  onCancel: () => void;
  onSubmit: (values: ItemFormValues) => void;
};

export function ItemFormModal({
  open,
  editing,
  pending,
  locations,
  categories,
  brandOptions,
  onCancel,
  onSubmit,
}: ItemFormModalProps) {
  const [form] = Form.useForm<ItemFormValues>();
  const [brandSearch, setBrandSearch] = useState("");
  const isBox = Form.useWatch("isBox", form);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        brand: editing.brand,
        majorColor: editing.majorColor,
        desc: editing.desc,
        quantity: editing.quantity,
        unit: editing.unit,
        estimatedPrice: editing.estimatedPrice,
        actualPrice: editing.actualPrice,
        isBox: editing.isBox,
        boxPurpose: editing.boxPurpose,
        purchaseDate: editing.purchaseDate,
        notice: editing.notice,
        remarks: editing.remarks,
        locationId: editing.locationId,
        categoryIds: editing.categories.map((category) => category.id),
      });
      setBrandSearch(editing.brand);
      return;
    }
    form.setFieldsValue({
      ...emptyItemFormValues,
      locationId: getDefaultLocationId(locations),
      categoryIds: [],
    });
    setBrandSearch("");
  }, [open, editing, form, locations]);

  const brandQuery = brandSearch.trim().toLowerCase();
  const filteredBrandOptions = (
    brandQuery
      ? brandOptions.filter((brand) => brand.toLowerCase().includes(brandQuery))
      : brandOptions
  ).map((brand) => ({ value: brand }));

  if (!open) {
    return null;
  }

  return (
    <Modal
      title={editing ? "Edit item" : "Add item"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={pending}
      okText={editing ? "Save" : "Create"}
      destroyOnHidden
      width="min(520px, calc(100vw - 24px))"
      styles={{
        body: {
          maxHeight: "min(60vh, 480px)",
          overflowY: "auto",
          paddingRight: 4,
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSubmit}
        initialValues={emptyItemFormValues}
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
                  : Promise.reject(new Error("Item name is required")),
            },
          ]}
        >
          <Input placeholder="USB-C 充電線" />
        </Form.Item>
        <Form.Item label="Location" name="locationId">
          <Select
            allowClear
            placeholder="Select a location"
            options={locations.map((location) => ({
              value: location.id,
              label: location.isExpired
                ? `${location.name} (expired)`
                : location.name,
            }))}
          />
        </Form.Item>
        <Form.Item label="Categories" name="categoryIds">
          <Select
            mode="multiple"
            allowClear
            placeholder="Select categories"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item label="Brand" name="brand">
          <AutoComplete
            allowClear
            options={filteredBrandOptions}
            placeholder="e.g. Apple"
            onSearch={setBrandSearch}
            onSelect={(value) => setBrandSearch(value)}
            onChange={(value) => setBrandSearch(value ?? "")}
            filterOption={false}
          />
        </Form.Item>
        <Form.Item label="Major color" name="majorColor">
          <MajorColorPicker />
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
        <Form.Item label="Actual price" name="actualPrice">
          <Input placeholder="e.g. 100 HKD" />
        </Form.Item>
        <Form.Item
          label="Is a container"
          name="isBox"
          valuePropName="checked"
          extra="Box, bag, case, or anything that can hold other items"
        >
          <Switch />
        </Form.Item>
        {isBox ? (
          <Form.Item label="Mainly for" name="boxPurpose">
            <Input.TextArea
              rows={2}
              placeholder="e.g. Charging cables and adapters"
              maxLength={500}
              showCount
            />
          </Form.Item>
        ) : null}
        <Form.Item
          label="Purchase date"
          name="purchaseDate"
          getValueProps={(value: string) => ({
            value: value ? dayjs(value) : null,
          })}
          normalize={(value) => (value ? value.format("YYYY-MM-DD") : "")}
        >
          <DatePicker style={{ width: "100%" }} allowClear />
        </Form.Item>
        <Form.Item label="Notice" name="notice">
          <Input.TextArea
            rows={2}
            placeholder="Optional notice (stands out from remarks)"
            maxLength={1000}
            showCount
          />
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
