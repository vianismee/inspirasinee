import Link from "next/link";
import { Logo } from "../Logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";

interface TrackingErrorProps {
  params: string;
}

export function TrackingError({ params }: TrackingErrorProps) {
  return (
    <div className="min-h-screen w-full bg-white relative flex items-center justify-center">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
          linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
          radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
          radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
        `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      {/* 2. Hapus `bg-white` dan tambahkan `relative` agar `z-10` berfungsi */}
      <div className="flex flex-col gap-10 relative z-10 w-full max-w-md p-4">
        <Logo size={15} className="scale-120" />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">{params}</CardTitle>
            <CardDescription className="text-center">
              Hmm, Sepertinya kode Invoice yang kamu masukkan Salah atau Kurang
              Tepat!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center">
              <Link href={`/tracking/`}>
                <Button>Kembali</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
