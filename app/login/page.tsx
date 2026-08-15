import Image from 'next/image'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-primary-light px-4 py-10">
      <div className="w-full max-w-sm rounded-[var(--radius-default)] bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/LOGO.jpg"
            alt="DONSOR Wallet"
            width={180}
            height={101}
            unoptimized
            className="rounded-xl"
          />
        </div>
        <LoginForm />
      </div>
      <p className="text-center text-xs text-muted">© 2026 陳莘惠 設計</p>
    </div>
  )
}
