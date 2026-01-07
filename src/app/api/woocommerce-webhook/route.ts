// /app/api/woocommerce-webhook/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";


export async function GET() {
  return NextResponse.json(
    { message: "WooCommerce Webhook is active" },
    { status: 200 }
  );
}


// export async function POST(request: Request) {
//   try {
//     const rawBody = await request.text();

//     console.log("🔵 RAW WEBHOOK BODY RECEIVED:", rawBody);

//     let order: any;

//     // Detect WooCommerce test webhook (webhook_id=1)
//     if (rawBody.startsWith("webhook_id")) {
//       console.log("ℹ️ Received WooCommerce test webhook:", rawBody);
//       return NextResponse.json(
//         { message: "Test webhook received (ignored)" },
//         { status: 200 }
//       );
//     }

//     // Parse incoming JSON
//     try {
//       order = JSON.parse(rawBody);
//       console.log("🟢 PARSED ORDER OBJECT:", order);
//     } catch (err) {
//       console.log("❌ JSON PARSE FAILED! Raw content:", rawBody);
//       return NextResponse.json(
//         { message: "Invalid JSON body" },
//         { status: 400 }
//       );
//     }

//     if (!order.id) {
//       console.log("❌ Missing order.id in payload:", order);
//       return NextResponse.json(
//         { message: "Missing order_id" },
//         { status: 400 }
//       );
//     }

//     // ============================================
//     // 🔶 FULL BOOKING LOGIC
//     // ============================================

//     const getMeta = (key: string) => {
//       const meta = order.meta_data?.find((m: any) => m.key === key);
//       return meta ? meta.value : null;
//     };

//     // Extracted fields
//     const building = order.shipping?.address_1 || getMeta("university") || "";
//     const bookingDate = getMeta("booking_date") || order.date_created;
//     const bookingTime = getMeta("booking_time") || "10:00";

//     let roomCounts = { standard: 0, deep: 0, "move-out": 0 };
//     order.line_items?.forEach((item: any) => {
//       const name = item.name.toLowerCase();
//       const quantity = item.quantity || 1;

//       if (name.includes("standard")) roomCounts.standard += quantity;
//       else if (name.includes("deep")) roomCounts.deep += quantity;
//       else if (name.includes("move-out") || name.includes("moveout"))
//         roomCounts["move-out"] += quantity;
//     });

//     // ============================================
//     // 🟦 PRINT EACH FIELD SEPARATELY FOR DEBUGGING
//     // ============================================
//     console.log("📌 META RECEIVED:", order.meta_data);

//     console.log("\n====== 📌 DEBUG: EXTRACTED ORDER FIELDS ======\n");

//     console.log("🆔 order.id:", order.id);
//     console.log("👤 customer_id:", order.customer_id);
//     console.log("👨‍💼 first_name:", order.billing.first_name);
//     console.log("👩‍💼 last_name:", order.billing.last_name);
//     console.log("📧 email:", order.billing.email);

//     console.log("🏢 building:", building);
//     console.log("🏬 floor:", getMeta("floor"));
//     console.log("🏠 apartmentType:", getMeta("apartment_type"));
//     console.log("🏘 apartmentNumber:", getMeta("apartment_number"));

//     console.log("🗓 bookingDate:", bookingDate);
//     console.log("⏰ bookingTime:", bookingTime);

//     console.log("🔁 frequency:", getMeta("frequency") || "One-time");

//     console.log("🧽 service items:", order.line_items?.map((i: any) => i.name));
//     console.log("🛏 roomCounts:", roomCounts);

//     console.log("💰 total price:", parseFloat(order.total));

//     console.log("\n==============================================\n");

//     // ============================================
//     // 🔶 Final booking object
//     // ============================================

//     const bookingData = {
//       userId: order.customer_id?.toString() || "guest",
//       userName:
//         `${order.billing.first_name || ""} ${order.billing.last_name || ""}`.trim(),
//       email: order.billing.email,
//       building,
//       floor: getMeta("floor") || "",
//       apartmentType: getMeta("apartment_type") || "",
//       apartmentNumber: getMeta("apartment_number") || "",
//       service: order.line_items?.map((i: any) => i.name).join(", "),
//       roomCounts,
//       date: bookingDate,
//       time: bookingTime,
//       frequency: getMeta("frequency") || "One-time",
//       price: parseFloat(order.total),
//       status: "Aligned",
//       provider: "Unassigned",
//       beforeImages: [],
//       afterImages: [],
//       createdAt: new Date(),
//     };

//     console.log("🟡 FINAL BOOKING DATA OBJECT:", bookingData);

//     // Insert into DB
//     const client = await clientPromise;
//     const db = client.db();
//     const result = await db.collection("bookings").insertOne(bookingData);

//     console.log("🟣 MONGODB INSERT RESULT:", result);

//     return NextResponse.json(
//       { message: "Booking created from Woo order", id: result.insertedId },
//       { status: 201 }
//     );

//   } catch (error) {
//     console.error("❌ Error creating booking from Woo order:", error);
//     return NextResponse.json(
//       { message: "Internal Server Error", error },
//       { status: 500 }
//     );
//   }
// }


export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    console.log("🔵 RAW WEBHOOK BODY RECEIVED:", rawBody);

    let order: any;

    // Detect WooCommerce test webhook (webhook_id=1)
    if (rawBody.startsWith("webhook_id")) {
      console.log("ℹ️ Received WooCommerce test webhook:", rawBody);
      return NextResponse.json(
        { message: "Test webhook received (ignored)" },
        { status: 200 }
      );
    }

    // Parse incoming JSON
    try {
      order = JSON.parse(rawBody);
      console.log("🟢 PARSED ORDER OBJECT:", order);
    } catch (err) {
      console.log("❌ JSON PARSE FAILED! Raw content:", rawBody);
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (!order.id) {
      console.log("❌ Missing order.id in payload:", order);
      return NextResponse.json({ message: "Missing order_id" }, { status: 400 });
    }

    // ============================================
    // 🔶 HELPER: find meta from order or line_items
    // ============================================
    const getMeta = (key: string) => {
      // 1️⃣ Check order-level meta_data
      let meta = order.meta_data?.find((m: any) => m.key === key);
      if (meta) return meta.value;

      // 2️⃣ Check line_items meta_data
      for (const item of order.line_items || []) {
        meta = item.meta_data?.find((m: any) => m.key === key);
        if (meta) return meta.value;
      }

      return null;
    };

    // ============================================
    // 🔶 EXTRACT FIELDS
    // ============================================
    const building = order.shipping?.address_1 || getMeta("university") || "";
    const floor = getMeta("floor") || "";
    const apartmentType = getMeta("room-size") || getMeta("apartment_type") || "";
    const apartmentNumber = getMeta("apartment_number") || "";
    let bookingDate = getMeta("booking_date") || order.date_created;
    let bookingTime = getMeta("booking_time") || "10:00";
    const frequency = getMeta("frequency") || "One-time";

// Check line_items meta for "date" and "time"
for (const item of order.line_items || []) {
  const dateMeta = item.meta_data?.find((m: any) => m.key === "date");
  const timeMeta = item.meta_data?.find((m: any) => m.key === "time");
  if (dateMeta) bookingDate = dateMeta.value;
  if (timeMeta) bookingTime = timeMeta.value;
}

console.log("🗓 bookingDate:", bookingDate);
console.log("⏰ bookingTime:", bookingTime);


    // Compute room counts dynamically
    let roomCounts = { standard: 0, deep: 0, "move-out": 0 };
    order.line_items?.forEach((item: any) => {
      const name = item.name.toLowerCase();
      const quantity = item.quantity || 1;

      if (name.includes("standard")) roomCounts.standard += quantity;
      else if (name.includes("deep")) roomCounts.deep += quantity;
      else if (name.includes("move-out") || name.includes("moveout"))
        roomCounts["move-out"] += quantity;
    });

    // ============================================
    // 🔶 LOG EACH FIELD FOR DEBUGGING
    // ============================================
    console.log("📌 META RECEIVED:", order.meta_data);
    console.log("\n====== 📌 DEBUG: EXTRACTED ORDER FIELDS ======\n");
    console.log("🆔 order.id:", order.id);
    console.log("👤 customer_id:", order.customer_id);
    console.log("👨‍💼 first_name:", order.billing.first_name);
    console.log("👩‍💼 last_name:", order.billing.last_name);
    console.log("📧 email:", order.billing.email);
    console.log("🏢 building:", building);
    console.log("🏬 floor:", floor);
    console.log("🏠 apartmentType:", apartmentType);
    console.log("🏘 apartmentNumber:", apartmentNumber);
    console.log("🗓 bookingDate:", bookingDate);
    console.log("⏰ bookingTime:", bookingTime);
    console.log("🔁 frequency:", frequency);
    console.log("🧽 service items:", order.line_items?.map((i: any) => i.name));
    console.log("🛏 roomCounts:", roomCounts);
    console.log("💰 total price:", parseFloat(order.total));
    console.log("\n==============================================\n");

    // ============================================
    // 🔶 FINAL BOOKING OBJECT
    // ============================================
    const bookingData = {
      userId: order.customer_id?.toString() || "guest",
      userName: `${order.billing.first_name || ""} ${order.billing.last_name || ""}`.trim(),
      email: order.billing.email || "",
      building,
      floor,
      apartmentType,
      apartmentNumber,
      service: order.line_items?.map((i: any) => i.name).join(", "),
      roomCounts,
      date: bookingDate,
      time: bookingTime,
      frequency,
      price: parseFloat(order.total),
      status: "New Request",
      provider: "Unassigned",
      beforeImages: [],
      afterImages: [],
      createdAt: new Date(),
    };

    console.log("🟡 FINAL BOOKING DATA OBJECT:", bookingData);

    // ============================================
    // 🔶 INSERT INTO MONGODB
    // ============================================
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("bookings").insertOne(bookingData);
    console.log("🟣 MONGODB INSERT RESULT:", result);

    return NextResponse.json(
      { message: "Booking created from Woo order", id: result.insertedId },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Error creating booking from Woo order:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error },
      { status: 500 }
    );
  }
}

