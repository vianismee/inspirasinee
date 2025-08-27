import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo size={15} />
        <LoginForm />
      </div>
    </div>
  );
}
