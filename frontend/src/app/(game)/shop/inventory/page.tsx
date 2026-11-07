import { redirect } from "next/navigation";

export default function ShopInventoryRedirectPage() {
  redirect("/shop?mode=inventory");
}

