import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <div className="w-full"><span className="eyebrow">Welcome back</span><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Log in to Roomly</h1><p className="mt-3 text-[#68736e]">Manage your coworking spaces and team.</p><AuthForm mode="login" /></div>;
}
