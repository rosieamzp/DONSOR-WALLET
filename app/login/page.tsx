import Image from 'next/image'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-primary-dark px-8 py-10">
      <Image
        src="/LOGO.jpg"
        alt="DONSOR Wallet"
        width={140}
        height={79}
        unoptimized
      />

      <div className="w-full max-w-sm">
        <LoginForm />
      </div>

      <p className="text-center text-xs text-white">© 2026 陳莘惠 設計</p>
    </div>
  )
}
