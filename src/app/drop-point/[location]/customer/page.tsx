import { DropPointOrderApp } from "@/components/DropPoint/DropPointOrderApp";

export default async function DropPointCustomerPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  return <DropPointOrderApp />;
}
