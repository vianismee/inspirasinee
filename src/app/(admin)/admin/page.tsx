import TableJob from "@/components/Dashboard/TableJob";
import { Headers } from "@/components/MainComponent/Header";

export default function Page() {
  return (
    <div className="flex flex-col py-4 md:gap-6 md:py-6 px-6">
      <Headers title="Dashboard" desc="Admin dashbord untuk update Tracking" />
      <TableJob />
    </div>
  );
}
