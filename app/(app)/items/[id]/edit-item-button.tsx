"use client";

import { FormOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateItem, type ItemRecord } from "@/lib/actions/items";
import {
  ItemFormModal,
  type ItemFormCategoryOption,
  type ItemFormLocationOption,
  type ItemFormValues,
} from "../item-form-modal";

type EditItemButtonProps = {
  item: ItemRecord;
  locations: ItemFormLocationOption[];
  categories: ItemFormCategoryOption[];
  brandOptions: string[];
};

export function EditItemButton({
  item,
  locations,
  categories,
  brandOptions,
}: EditItemButtonProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(values: ItemFormValues) {
    startTransition(async () => {
      const result = await updateItem({
        id: item.id,
        name: values.name,
        brand: values.brand ?? "",
        majorColor: values.majorColor ?? "",
        desc: values.desc,
        quantity: values.quantity,
        unit: values.unit,
        estimatedPrice: values.estimatedPrice ?? "",
        actualPrice: values.actualPrice ?? "",
        isBox: Boolean(values.isBox),
        boxPurpose: values.boxPurpose ?? "",
        purchaseDate: values.purchaseDate ?? "",
        notice: values.notice ?? "",
        remarks: values.remarks,
        locationId: values.locationId ?? null,
        categoryIds: values.categoryIds ?? [],
      });

      if (!result.ok) {
        message.error(result.message);
        return;
      }

      message.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="text"
        icon={<FormOutlined />}
        onClick={() => setOpen(true)}
        loading={pending}
        aria-label="Edit item"
        title="Edit item"
        style={{
          color: "var(--muted)",
          width: 36,
          height: 36,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      />
      <ItemFormModal
        open={open}
        editing={item}
        pending={pending}
        locations={locations}
        categories={categories}
        brandOptions={brandOptions}
        onCancel={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  );
}
