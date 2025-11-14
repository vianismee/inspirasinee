import { DropPointOrderForm } from "@/components/DropPoint/DropPointOrderForm";

export default async function DropPointLocationPage({ params }: { params: Promise<{ location: string }> }) {
  const resolvedParams = await params;
  return <DropPointOrderForm locationId={resolvedParams.location} />;
}