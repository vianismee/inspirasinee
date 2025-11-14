import DropPointOrderApp from "@/components/DropPoint/DropPointOrderApp";

export default async function DropPointOrderPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const resolvedParams = await params;
  return <DropPointOrderApp />;
}