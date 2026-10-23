import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const sslEnabled =
  process.env.DATABASE_SSL === "true" ||
  process.env.DATABASE_URL?.includes("ssl-mode=REQUIRED") === true;

const adapter = new PrismaMariaDb(
  {
    host: process.env.DATABASE_HOST ?? "127.0.0.1",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? "root",
    password: process.env.DATABASE_PASSWORD ?? "",
    database: process.env.DATABASE_NAME ?? "inventory_book",
    connectionLimit: 5,
    connectTimeout: 30_000,
    acquireTimeout: 30_000,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
  },
  { useTextProtocol: true },
);

const prisma = new PrismaClient({ adapter });

const SEED_MARK = "[seed]";
const TARGET_ITEM_COUNT = 100;

async function upsertUser(input: {
  email: string;
  username: string;
  phone: string;
  role: "ADMIN" | "USER";
  password: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      username: input.username,
      phone: input.phone,
      role: input.role,
    },
    create: {
      email: input.email,
      username: input.username,
      phone: input.phone,
      role: input.role,
      passwordHash,
    },
  });
}

async function clearDemoData(userId: string) {
  await prisma.item.deleteMany({
    where: { userId, remarks: SEED_MARK },
  });
  await prisma.category.deleteMany({
    where: {
      userId,
      name: {
        in: [
          "Electronics",
          "Cables",
          "Furniture",
          "Kitchen",
          "Books",
          "Wearables",
          "Tools",
          "Stationery",
          "Sports",
          "Misc",
        ],
      },
    },
  });
  await prisma.location.deleteMany({
    where: {
      userId,
      name: { in: ["Home", "Office", "Storage locker", "Parents' house"] },
    },
  });
}

function padDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type ItemSeed = {
  name: string;
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  purchaseDate: string;
  notice: string;
  locationId: string;
  categoryIds: string[];
  forSale?: { salePrice: string; condition: string; note: string };
};

async function seedDemoInventory(userId: string, commenterId: string) {
  const home = await prisma.location.create({
    data: {
      name: "Home",
      address: "88 Queen's Road Central, Hong Kong",
      lat: "22.2819",
      lon: "114.1556",
      isDefault: true,
      isExpired: false,
      userId,
    },
  });
  const office = await prisma.location.create({
    data: {
      name: "Office",
      address: "1 Science Park East Avenue, Sha Tin",
      lat: "22.4264",
      lon: "114.2110",
      isDefault: false,
      isExpired: false,
      userId,
    },
  });
  const locker = await prisma.location.create({
    data: {
      name: "Storage locker",
      address: "Mini-storage #12, Kowloon Bay",
      lat: "22.3235",
      lon: "114.2080",
      isDefault: false,
      isExpired: false,
      userId,
    },
  });
  await prisma.location.create({
    data: {
      name: "Parents' house",
      address: "Tai Po old flat (expired lease)",
      isDefault: false,
      isExpired: true,
      userId,
    },
  });

  const categoryNames = [
    "Electronics",
    "Cables",
    "Furniture",
    "Kitchen",
    "Books",
    "Wearables",
    "Tools",
    "Stationery",
    "Sports",
    "Misc",
  ] as const;
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({ data: { name, userId } }),
    ),
  );
  const cat = Object.fromEntries(
    categories.map((category) => [category.name, category.id]),
  ) as Record<(typeof categoryNames)[number], string>;

  const locations = [home.id, office.id, locker.id];
  const colors = [
    "#111111",
    "#FFFFFF",
    "#C0C0C0",
    "#1C1C1E",
    "#C41E3A",
    "#1677FF",
    "#52C41A",
    "#FAAD14",
    "#722ED1",
    "#D2B48C",
    "#3A3A3A",
    "#F5F5F7",
  ];

  const featured: ItemSeed[] = [
    {
      name: "MacBook Pro 14\"",
      brand: "Apple",
      majorColor: "#C0C0C0",
      desc: "M3 Pro, 18GB RAM, 512GB SSD. Daily driver.",
      quantity: 1,
      unit: "部",
      estimatedPrice: "12000 HKD",
      purchaseDate: "2024-03-12",
      notice: "AppleCare+ until 2027",
      locationId: home.id,
      categoryIds: [cat.Electronics],
      forSale: {
        salePrice: "9800",
        condition: "Like new",
        note: "Includes original box and charger",
      },
    },
    {
      name: "iPhone 15",
      brand: "Apple",
      majorColor: "#1C1C1E",
      desc: "128GB, black. Light scratches on the frame.",
      quantity: 1,
      unit: "部",
      estimatedPrice: "4500 HKD",
      purchaseDate: "2023-09-22",
      notice: "",
      locationId: home.id,
      categoryIds: [cat.Electronics, cat.Wearables],
    },
    {
      name: "AirPods Pro 2",
      brand: "Apple",
      majorColor: "#F5F5F7",
      desc: "USB-C case. Missing one ear tip set.",
      quantity: 1,
      unit: "副",
      estimatedPrice: "1200 HKD",
      purchaseDate: "2024-01-05",
      notice: "",
      locationId: home.id,
      categoryIds: [cat.Electronics, cat.Wearables],
      forSale: {
        salePrice: "850",
        condition: "Good",
        note: "Works fine, battery ~85%",
      },
    },
    {
      name: "USB-C 充電線 2m",
      brand: "Anker",
      majorColor: "#111111",
      desc: "240W braided cable, two pieces.",
      quantity: 2,
      unit: "條",
      estimatedPrice: "150 HKD",
      purchaseDate: "2025-06-01",
      notice: "",
      locationId: office.id,
      categoryIds: [cat.Cables, cat.Electronics],
    },
    {
      name: "HDMI 2.1 線",
      brand: "Belkin",
      majorColor: "#222222",
      desc: "8K@60Hz, 2 metres.",
      quantity: 1,
      unit: "條",
      estimatedPrice: "220 HKD",
      purchaseDate: "2024-11-18",
      notice: "",
      locationId: office.id,
      categoryIds: [cat.Cables],
    },
    {
      name: "Dell UltraSharp 27\"",
      brand: "Dell",
      majorColor: "#2F2F2F",
      desc: "U2723QE 4K USB-C monitor.",
      quantity: 1,
      unit: "部",
      estimatedPrice: "3200 HKD",
      purchaseDate: "2023-05-30",
      notice: "Has slight backlight bleed at bottom",
      locationId: office.id,
      categoryIds: [cat.Electronics],
    },
    {
      name: "機械鍵盤",
      brand: "Keychron",
      majorColor: "#6B4F3A",
      desc: "K2 V2, brown switches, Mac layout.",
      quantity: 1,
      unit: "個",
      estimatedPrice: "650 HKD",
      purchaseDate: "2022-12-01",
      notice: "",
      locationId: office.id,
      categoryIds: [cat.Electronics],
      forSale: {
        salePrice: "Free",
        condition: "Fair",
        note: "Keycaps worn; giveaway if local pickup",
      },
    },
    {
      name: "IKEA 書桌",
      brand: "IKEA",
      majorColor: "#D2B48C",
      desc: "120cm white oak effect desk.",
      quantity: 1,
      unit: "張",
      estimatedPrice: "800 HKD",
      purchaseDate: "2021-08-14",
      notice: "",
      locationId: home.id,
      categoryIds: [cat.Furniture],
    },
    {
      name: "辦公椅",
      brand: "Herman Miller",
      majorColor: "#3A3A3A",
      desc: "Aeron Remastered size B.",
      quantity: 1,
      unit: "張",
      estimatedPrice: "6500 HKD",
      purchaseDate: "2022-02-20",
      notice: "",
      locationId: office.id,
      categoryIds: [cat.Furniture],
    },
    {
      name: "空氣炸鍋",
      brand: "Philips",
      majorColor: "#111111",
      desc: "XXL model, rarely used.",
      quantity: 1,
      unit: "部",
      estimatedPrice: "900 HKD",
      purchaseDate: "2023-01-10",
      notice: "",
      locationId: home.id,
      categoryIds: [cat.Kitchen],
      forSale: {
        salePrice: "400",
        condition: "Like new",
        note: "Includes basket and recipe booklet",
      },
    },
    {
      name: "Switch OLED",
      brand: "Nintendo",
      majorColor: "#FFFFFF",
      desc: "White OLED model + dock.",
      quantity: 1,
      unit: "部",
      estimatedPrice: "2200 HKD",
      purchaseDate: "2022-10-08",
      notice: "",
      locationId: home.id,
      categoryIds: [cat.Electronics],
      forSale: {
        salePrice: "1600",
        condition: "Good",
        note: "Joy-Cons drift slightly on left stick",
      },
    },
  ];

  const catalogs: {
    label: string;
    brand: string;
    unit: string;
    category: (typeof categoryNames)[number];
    basePrice: number;
  }[] = [
    { label: "USB-A to C 轉接頭", brand: "UGREEN", unit: "個", category: "Cables", basePrice: 45 },
    { label: "Lightning 線", brand: "Baseus", unit: "條", category: "Cables", basePrice: 80 },
    { label: "延長線 6位", brand: "Huntkey", unit: "條", category: "Electronics", basePrice: 120 },
    { label: "無線滑鼠", brand: "Logitech", unit: "隻", category: "Electronics", basePrice: 250 },
    { label: "USB 手指 64GB", brand: "SanDisk", unit: "支", category: "Electronics", basePrice: 90 },
    { label: "外置 SSD 1TB", brand: "Samsung", unit: "個", category: "Electronics", basePrice: 780 },
    { label: "Webcam", brand: "Logitech", unit: "部", category: "Electronics", basePrice: 450 },
    { label: "藍牙喇叭", brand: "JBL", unit: "個", category: "Electronics", basePrice: 600 },
    { label: "移動電源 20000mAh", brand: "Anker", unit: "個", category: "Electronics", basePrice: 320 },
    { label: "螢幕掛燈", brand: "Xiaomi", unit: "盞", category: "Electronics", basePrice: 280 },
    { label: "摺疊層架", brand: "MUJI", unit: "個", category: "Furniture", basePrice: 199 },
    { label: "收納箱", brand: "IKEA", unit: "個", category: "Furniture", basePrice: 79 },
    { label: "書檔", brand: "IKEA", unit: "對", category: "Furniture", basePrice: 59 },
    { label: "掛牆層板", brand: "IKEA", unit: "塊", category: "Furniture", basePrice: 149 },
    { label: "陶瓷碗套裝", brand: "IKEA", unit: "套", category: "Kitchen", basePrice: 120 },
    { label: "廚刀", brand: "Global", unit: "把", category: "Kitchen", basePrice: 480 },
    { label: "咖啡磨", brand: "Timemore", unit: "個", category: "Kitchen", basePrice: 350 },
    { label: "保溫杯", brand: "Zojirushi", unit: "個", category: "Kitchen", basePrice: 260 },
    { label: "小說", brand: "Penguin", unit: "本", category: "Books", basePrice: 120 },
    { label: "技術手冊", brand: "O'Reilly", unit: "本", category: "Books", basePrice: 420 },
    { label: "漫畫單行本", brand: "Shueisha", unit: "本", category: "Books", basePrice: 70 },
    { label: "運動手環", brand: "Xiaomi", unit: "隻", category: "Wearables", basePrice: 180 },
    { label: "太陽眼鏡", brand: "Uniqlo", unit: "副", category: "Wearables", basePrice: 99 },
    { label: "背包", brand: "Herschel", unit: "個", category: "Wearables", basePrice: 550 },
    { label: "螺絲批套裝", brand: "Wera", unit: "套", category: "Tools", basePrice: 380 },
    { label: "膠水槍", brand: "Bosch", unit: "支", category: "Tools", basePrice: 160 },
    { label: "捲尺 5m", brand: "Stanley", unit: "把", category: "Tools", basePrice: 55 },
    { label: "筆記本 A5", brand: "Moleskine", unit: "本", category: "Stationery", basePrice: 110 },
    { label: "原子筆盒", brand: "Pilot", unit: "盒", category: "Stationery", basePrice: 45 },
    { label: "白板筆", brand: "Staedtler", unit: "支", category: "Stationery", basePrice: 18 },
    { label: "瑜珈墊", brand: "Lululemon", unit: "張", category: "Sports", basePrice: 480 },
    { label: "啞鈴 5kg", brand: "Decathlon", unit: "對", category: "Sports", basePrice: 220 },
    { label: "跳繩", brand: "Decathlon", unit: "條", category: "Sports", basePrice: 60 },
    { label: "雜物袋", brand: "无印良品", unit: "個", category: "Misc", basePrice: 39 },
    { label: "雨傘", brand: "Amvel", unit: "把", category: "Misc", basePrice: 150 },
    { label: "口罩盒", brand: "Generic", unit: "個", category: "Misc", basePrice: 25 },
  ];

  const generated: ItemSeed[] = [];
  let n = 1;
  while (featured.length + generated.length < TARGET_ITEM_COUNT) {
    const template = catalogs[(n - 1) % catalogs.length];
    const variant = Math.floor((n - 1) / catalogs.length) + 1;
    const year = 2020 + ((n * 3) % 6);
    const month = 1 + ((n * 5) % 12);
    const day = 1 + ((n * 7) % 28);
    const price = template.basePrice + ((n * 17) % 90);
    const qty = 1 + (n % 4);

    generated.push({
      name: `${template.label} #${String(n).padStart(3, "0")}${variant > 1 ? ` v${variant}` : ""}`,
      brand: template.brand,
      majorColor: colors[n % colors.length],
      desc: `Demo ${template.label} sample #${n} for development UI / pagination testing.`,
      quantity: qty,
      unit: template.unit,
      estimatedPrice: `${price} HKD`,
      purchaseDate: padDate(year, month, day),
      notice: n % 11 === 0 ? "Check before lending out" : "",
      locationId: locations[n % locations.length],
      categoryIds: [cat[template.category]],
      ...(n % 17 === 0
        ? {
            forSale: {
              salePrice: String(Math.max(20, Math.floor(price * 0.6))),
              condition: n % 2 === 0 ? "Good" : "Fair",
              note: "Seeded listing for Selling now",
            },
          }
        : {}),
    });
    n += 1;
  }

  const itemSeeds = [...featured, ...generated];
  const createdItems: { item: { id: string; name: string; brand: string; unit: string; desc: string; notice: string; purchaseDate: string }; forSale?: ItemSeed["forSale"] }[] = [];

  for (const seed of itemSeeds) {
    const item = await prisma.item.create({
      data: {
        name: seed.name,
        brand: seed.brand,
        majorColor: seed.majorColor,
        desc: seed.desc,
        quantity: seed.quantity,
        unit: seed.unit,
        estimatedPrice: seed.estimatedPrice,
        purchaseDate: seed.purchaseDate,
        notice: seed.notice,
        remarks: SEED_MARK,
        locationId: seed.locationId,
        userId,
        categories: {
          create: seed.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
    createdItems.push({ item, forSale: seed.forSale });
  }

  const byName = Object.fromEntries(
    createdItems.map(({ item }) => [item.name, item]),
  );

  const relations: { from: string; to: string; type: string }[] = [
    { from: "MacBook Pro 14\"", to: "USB-C 充電線 2m", type: "uses" },
    { from: "MacBook Pro 14\"", to: "Dell UltraSharp 27\"", type: "paired with" },
    { from: "iPhone 15", to: "AirPods Pro 2", type: "accessory" },
    { from: "IKEA 書桌", to: "辦公椅", type: "set with" },
    { from: "Switch OLED", to: "HDMI 2.1 線", type: "needs" },
  ];

  for (const relation of relations) {
    const fromItem = byName[relation.from];
    const toItem = byName[relation.to];
    if (!fromItem || !toItem) continue;
    await prisma.itemRelation.create({
      data: {
        fromItemId: fromItem.id,
        toItemId: toItem.id,
        type: relation.type,
        userId,
      },
    });
  }

  const listings = [];
  for (const { item, forSale } of createdItems) {
    if (!forSale) continue;
    const listing = await prisma.saleListing.create({
      data: {
        itemId: item.id,
        userId,
        name: item.name,
        brand: item.brand,
        quantity: 1,
        unit: item.unit,
        desc: item.desc,
        notice: item.notice,
        purchaseDate: item.purchaseDate,
        condition: forSale.condition,
        isVirtual: false,
        salePrice: forSale.salePrice,
        note: forSale.note,
      },
    });
    listings.push(listing);
  }

  if (listings[0]) {
    await prisma.saleListingComment.createMany({
      data: [
        {
          listingId: listings[0].id,
          userId: commenterId,
          body: "Is this still available? Can I pick up in Central this weekend?",
        },
        {
          listingId: listings[0].id,
          userId,
          body: "Yes — Saturday afternoon works. DM me a time.",
        },
      ],
    });
  }
  if (listings[1]) {
    await prisma.saleListingComment.create({
      data: {
        listingId: listings[1].id,
        userId: commenterId,
        body: "Would you take 700?",
      },
    });
  }

  return {
    locations: 4,
    categories: categories.length,
    items: createdItems.length,
    relations: relations.length,
    listings: listings.length,
  };
}

async function main() {
  const admin = await upsertUser({
    email: "yatonleung20020622@gmail.com",
    username: "Andrew Leung",
    phone: "66913032",
    role: "ADMIN",
    password: "password",
  });
  console.log(
    `Seeded user: ${admin.username} <${admin.email}> phone=${admin.phone} role=${admin.role}`,
  );

  const demoUser = await upsertUser({
    email: "demo@inventory-book.local",
    username: "Demo User",
    phone: "91234567",
    role: "USER",
    password: "password",
  });
  console.log(
    `Seeded user: ${demoUser.username} <${demoUser.email}> role=${demoUser.role}`,
  );

  const reset =
    process.env.SEED_RESET === "1" || process.env.SEED_RESET === "true";
  const existingSeedItems = await prisma.item.count({
    where: { userId: admin.id, remarks: SEED_MARK },
  });

  if (existingSeedItems > 0 && !reset) {
    console.log(
      `Demo inventory already present (${existingSeedItems} items). Set SEED_RESET=1 to recreate.`,
    );
    return;
  }

  if (existingSeedItems > 0 && reset) {
    console.log("SEED_RESET=1 — clearing previous demo inventory…");
    await clearDemoData(admin.id);
  }

  const summary = await seedDemoInventory(admin.id, demoUser.id);
  console.log(
    `Demo data: ${summary.locations} locations, ${summary.categories} categories, ${summary.items} items, ${summary.relations} relations, ${summary.listings} sale listings`,
  );
  console.log("Log in as Andrew Leung / password (or the email).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
