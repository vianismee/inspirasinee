import { DropPointOrderForm } from "@/components/DropPoint/DropPointOrderForm";

export default async function DropPointNewOrderPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const resolvedParams = await params;
  return <DropPointOrderForm locationId={resolvedParams.location} />;
}