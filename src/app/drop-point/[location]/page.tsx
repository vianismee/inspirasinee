import { DropPointCheckIn } from "@/components/DropPoint/DropPointCheckIn";

export default async function DropPointLocationPage({ params }: { params: Promise<{ location: string }> }) {
  const resolvedParams = await params;
  return <DropPointCheckIn locationId={resolvedParams.location} />;
}