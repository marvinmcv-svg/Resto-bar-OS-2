import { TABLES } from "@/modules/pos/demo-data";
import { OrderScreen } from "./order-screen";

// Pre-render every demo table so the app also works as a static export (demo previews).
export function generateStaticParams() {
  return TABLES.map((t) => ({ tableId: t.id }));
}

export default async function OrderPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  return <OrderScreen tableId={tableId} />;
}
