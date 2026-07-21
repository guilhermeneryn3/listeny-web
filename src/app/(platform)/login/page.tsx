import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid flex-1 place-items-center bg-bg px-6 text-ink">
      <LoginForm defaultNext="/painel" brandName="Listeny" />
    </main>
  );
}
