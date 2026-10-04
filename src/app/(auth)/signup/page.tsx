import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <div className="w-full"><span className="eyebrow">Start with the basics</span><h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Create your account</h1><p className="mt-3 text-[#68736e]">No external identity provider. Your account lives in Roomly.</p><AuthForm mode="signup" /></div>;
}
