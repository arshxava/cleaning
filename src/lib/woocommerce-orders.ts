import WooCommerce from "@/lib/woocommerce";

export async function getWooOrders() {
  try {
    const response = await WooCommerce.get("orders"); // fetch all orders
    return response.data; // array of orders
  } catch (error) {
    console.error("Error fetching WooCommerce orders:", error);
    return [];
  }
}
