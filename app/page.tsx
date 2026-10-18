'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Activity,
  Bell,
  ChevronRight,
  ClipboardPlus,
  Eye,
  EyeOff,
  LogOut,
  PawPrint,
  Plus,
  Pencil,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Trash2,
  X,
} from 'lucide-react'

type Pet = {
  id: number
  name: string
  species: string
  breed: string
  gender: string
  birth: string
  icon: string
}

type Vaccine = {
  id: number
  petId: number
  name: string
  date: string
  next: string
  memo: string
}

type Visit = {
  id: number
  petId: number
  date: string
  hospital: string
  purpose: string
  weight: string
  memo: string
}

type EditTarget =
  | { kind: 'pet'; item: Pet }
  | { kind: 'visit'; item: Visit }
  | { kind: 'vaccine'; item: Vaccine }

const initialPets: Pet[] = [
  { id: 1, name: 'ポチ', species: '犬', breed: '柴犬', gender: 'オス', birth: '2021-04-12', icon: '🐕' },
  { id: 2, name: 'ミルク', species: '猫', breed: 'スコティッシュフォールド', gender: 'メス', birth: '2022-09-03', icon: '🐈' },
  { id: 3, name: 'モカ', species: '犬', breed: 'トイプードル', gender: 'メス', birth: '2020-11-21', icon: '🐩' },
]

const initialVaccines: Vaccine[] = [
  { id: 1, petId: 1, name: '混合ワクチン（5種）', date: '2025-10-10', next: '2026-10-10', memo: '年1回接種' },
  { id: 2, petId: 1, name: '狂犬病ワクチン', date: '2025-04-15', next: '2026-04-15', memo: '' },
  { id: 3, petId: 2, name: '混合ワクチン（3種）', date: '2025-08-22', next: '2026-09-28', memo: '体調を確認して接種' },
]

const initialVisits: Visit[] = [
  { id: 1, petId: 1, date: '2026-09-07', hospital: 'みどり動物病院', purpose: '定期健診', weight: '8.4 kg', memo: '健康状態良好。歯石ケアを継続。' },
  { id: 2, petId: 1, date: '2026-06-18', hospital: 'みどり動物病院', purpose: '皮膚の診察', weight: '8.2 kg', memo: '経過観察。次回も状態を確認。' },
  { id: 3, petId: 2, date: '2026-08-22', hospital: 'さくら動物医療センター', purpose: 'ワクチン接種', weight: '4.1 kg', memo: '接種後の体調に問題なし。' },
]

function daysUntil(date: string) {
  const today = new Date('2026-09-25T00:00:00')
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#36724f] text-white shadow-sm">
        <PawPrint size={21} />
      </span>
      <span className="text-lg font-bold tracking-tight text-[#234431]">Pet Care</span>
    </div>
  )
}

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません。'
  if (message.includes('email not confirmed')) return 'メールアドレスの確認が完了していません。確認メールをご確認ください。'
  if (message.includes('already registered') || message.includes('user already exists')) return 'このメールアドレスはすでに登録されています。ログインしてください。'
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) return 'パスワードは6文字以上で入力してください。'
  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) return 'GoogleログインがSupabaseで有効になっていません。管理者に設定を確認してください。'
  if (message.includes('redirect') && (message.includes('not allowed') || message.includes('mismatch'))) return '認証後のリダイレクトURLが許可されていません。SupabaseのURL Configurationを確認してください。'
  if (message.includes('access_denied') || message.includes('user denied')) return 'Googleログインはキャンセルされました。'
  return '認証に失敗しました。入力内容とSupabaseの認証設定をご確認ください。'
}

function AuthScreen({
  onLogin,
  notice,
}: {
  onLogin: () => void | Promise<void>
  notice?: string
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setMessageIsError(false)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password'))
    const name = String(formData.get('name') ?? '').trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('有効なメールアドレスを入力してください。')
      setMessageIsError(true)
      return
    }
    if (password.length < 6) {
      setMessage('パスワードは6文字以上で入力してください。')
      setMessageIsError(true)
      return
    }
    if (mode === 'signup' && !name) {
      setMessage('お名前を入力してください。')
      setMessageIsError(true)
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setMessage(getAuthErrorMessage(error))
          setMessageIsError(true)
          return
        }
        await onLogin()
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })
      if (error) {
        setMessage(getAuthErrorMessage(error))
        setMessageIsError(true)
        return
      }

      if (data.session) {
        await onLogin()
      } else if (data.user?.identities?.length === 0) {
        setMessage('このメールアドレスはすでに登録されています。ログインしてください。')
        setMessageIsError(true)
      } else {
        setMessage('確認メールを送信しました。メール内のリンクから登録を完了してください。')
      }
    } catch (error) {
      setMessage(getAuthErrorMessage(error))
      setMessageIsError(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function signInWithGoogle() {
    setMessage('')
    setMessageIsError(false)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
    } catch (error) {
      setMessage(getAuthErrorMessage(error))
      setMessageIsError(true)
    }
  }

  return (
    <main className="flex min-h-screen bg-[#f7faf7] text-[#27352d]">
      <section className="hidden flex-1 flex-col justify-between bg-[#deefe2] p-12 lg:flex xl:p-20">
        <div>
          <Logo />
          <div className="mt-24">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#5c8b6c]">あなたと、ペットの毎日に</p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-[#234d34]">
              大切な家族の
              <br />
              健康を、ひとつに。
            </h1>
            <p className="mt-6 max-w-md leading-8 text-[#587564]">
              通院記録やワクチン予定をかんたんに管理。忙しい毎日でも、ペットの健康を見守れます。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5b7d66]">
          <ShieldCheck size={18} />
          安心して使えるペット健康管理
        </div>
      </section>

      <section className="flex w-full items-center justify-center px-5 py-10 sm:px-10 lg:w-[500px] xl:w-[560px]">
        <div className="w-full max-w-[370px]">
          <div className="mb-12 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {mode === 'login' ? 'おかえりなさい' : 'アカウントを作成'}
          </h2>
          <p className="mt-2 text-sm text-[#7b877f]">
            {mode === 'login' ? 'ペットの健康管理を続けましょう。' : '無料でPet Careをはじめましょう。'}
          </p>

          <div className="mt-8 grid grid-cols-2 rounded-xl bg-[#e9efea] p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setMessage('')
              }}
              className={`rounded-lg py-2.5 ${mode === 'login' ? 'bg-white text-[#36724f] shadow-sm' : 'text-[#89958d]'}`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setMessage('')
              }}
              className={`rounded-lg py-2.5 ${mode === 'signup' ? 'bg-white text-[#36724f] shadow-sm' : 'text-[#89958d]'}`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {mode === 'signup' && <Field label="お名前" name="name" placeholder="山田 太郎" />}
            <Field label="メールアドレス" name="email" type="email" placeholder="you@example.com" />
            <Field label="パスワード" name="password" type="password" placeholder="6文字以上" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            <button disabled={submitting} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36724f] text-sm font-semibold text-white shadow-lg shadow-[#36724f]/20 transition hover:bg-[#2c5e40] disabled:cursor-wait disabled:opacity-60">
              {submitting ? '処理中…' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
              <ChevronRight size={17} />
            </button>
          </form>

          {(message || notice) && (
            <p role={messageIsError ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-center text-sm ${messageIsError ? 'bg-[#fde8e6] text-[#a94f49]' : 'bg-[#e6f3e9] text-[#36724f]'}`}>
              {message || notice}
            </p>
          )}

          <div className="my-7 flex items-center gap-3 text-xs text-[#a0aba2]">
            <span className="h-px flex-1 bg-[#e1e8e2]" />
            または
            <span className="h-px flex-1 bg-[#e1e8e2]" />
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dce5dd] bg-white text-sm font-medium transition hover:bg-[#f7faf7]"
          >
            <GoogleMark />
            Googleで{mode === 'login' ? 'ログイン' : '登録'}
          </button>

          <p className="mt-8 text-center text-xs leading-5 text-[#9aa69d]">
            続けることで、利用規約と
            <br />
            プライバシーポリシーに同意したものとします。
          </p>
        </div>
      </section>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z" />
      <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z" />
    </svg>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  placeholder: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  const inputType = type === 'password' && visible ? 'text' : type

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <span className="relative block">
        <input
          name={name}
          required
          minLength={type === 'password' ? 6 : undefined}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete ?? (name === 'email' ? 'email' : 'name')}
          className={`h-12 w-full rounded-xl border border-[#dce5dd] bg-white px-4 text-sm outline-none transition placeholder:text-[#b4beb6] focus:border-[#75a486] focus:ring-4 focus:ring-[#e1f0e4] ${type === 'password' ? 'pr-12' : ''}`}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'} className="absolute inset-y-0 right-3 flex items-center text-[#849189]">
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
    </label>
  )
}

function Home({
  selectedPet,
  upcoming,
  pets,
  onSelect,
  onView,
}: {
  selectedPet: Pet
  upcoming: { vaccine: Vaccine; pet?: Pet; days: number } | undefined
  pets: Pet[]
  onSelect: (id: number) => void
  onView: (view: 'visits' | 'vaccines' | 'record') => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-[#deefe2] p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-sm font-medium text-[#5b8066]">今日も健康管理を続けましょう</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#244b35]">{selectedPet.name}の健康状態</h2>
          <p className="mt-2 text-sm text-[#65816d]">{selectedPet.species}・{selectedPet.breed}</p>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/70 text-6xl shadow-sm">
          {selectedPet.icon}
        </div>
      </div>

      {upcoming && (
        <button
          onClick={() => onView('vaccines')}
          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:shadow-md ${
            upcoming.days <= 3 ? 'border-[#f2c988] bg-[#fff8e9]' : 'border-[#dce9de] bg-white'
          }`}
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              upcoming.days <= 3 ? 'bg-[#fff0c9] text-[#bd7b17]' : 'bg-[#e4f2e7] text-[#36724f]'
            }`}
          >
            <Bell size={20} />
            <span className="sr-only">リマインダー</span>
          </span>
          <span className="min-w-0 flex-1">
            <b className="block text-sm">ワクチンのお知らせ</b>
            <span className="mt-1 block truncate text-sm text-[#68766e]">
              {upcoming.pet?.name}の{upcoming.vaccine.name}
            </span>
            <span className={`mt-1 block text-xs font-semibold ${upcoming.days <= 3 ? 'text-[#bf7b18]' : 'text-[#568064]'}`}>
              {upcoming.days < 0
                ? `予定日を${Math.abs(upcoming.days)}日過ぎています`
                : upcoming.days === 0
                  ? '接種予定日です'
                  : `予定日まであと${upcoming.days}日`}
            </span>
          </span>
          <ChevronRight size={18} className="text-[#9aa69d]" />
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <ActionCard icon={PawPrint} title="ペット一覧" detail={`${pets.length}頭を管理中`} onClick={() => onView('visits')} />
        <ActionCard icon={Stethoscope} title="通院履歴" detail="記録を確認する" onClick={() => onView('visits')} />
        <ActionCard icon={Syringe} title="ワクチン履歴" detail="次回予定を確認" onClick={() => onView('vaccines')} />
      </div>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: typeof Activity
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-[#e3ebe4] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f2e7] text-[#36724f]">
        <Icon size={20} />
      </span>
      <b className="mt-4 block text-sm">{title}</b>
      <span className="mt-1 block text-xs text-[#89968d]">{detail}</span>
    </button>
  )
}

function PetList({
  pets,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  pets: Pet[]
  selectedId: number
  onSelect: (id: number) => void
  onAdd: () => void
  onEdit: (pet: Pet) => void
  onDelete: (pet: Pet) => void
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[#839087]">登録されているペット</p>
        <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-[#36724f] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={17} />
          ペットを登録
        </button>
      </div>

      {pets.length === 0 ? (
        <EmptyState label="ペットはまだ登録されていません" onAdd={onAdd} />
      ) : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <article
            key={pet.id}
            className={`rounded-2xl border bg-white p-5 transition hover:shadow-lg ${
              selectedId === pet.id ? 'border-[#78a886]' : 'border-[#e3ebe4]'
            }`}
          >
            <button type="button" onClick={() => onSelect(pet.id)} className="w-full text-left">
              <div className="flex items-start justify-between">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef6ef] text-4xl">{pet.icon}</span>
                <ChevronRight size={18} className="text-[#a0aca3]" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{pet.name}</h2>
              <p className="mt-1 text-sm text-[#738077]">{pet.species}・{pet.breed}</p>
              <p className="mt-4 border-t border-[#edf1ed] pt-3 text-xs text-[#8b978f]">誕生日 {pet.birth ? formatDate(pet.birth) : '未登録'}</p>
            </button>
            <div className="mt-4 flex gap-2 border-t border-[#edf1ed] pt-3">
              <button type="button" onClick={() => onEdit(pet)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#eef6ef] px-3 py-2.5 text-sm font-medium text-[#36724f]">
                <Pencil size={15} />編集
              </button>
              <button type="button" onClick={() => onDelete(pet)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#fff1ef] px-3 py-2.5 text-sm font-medium text-[#b45249]">
                <Trash2 size={15} />削除
              </button>
            </div>
          </article>
        ))}
      </div>}
    </div>
  )
}

function VisitList({
  visits,
  pet,
  onAdd,
  onEdit,
  onDelete,
}: {
  visits: Visit[]
  pet: Pet
  onAdd: () => void
  onEdit: (visit: Visit) => void
  onDelete: (visit: Visit) => void
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[#839087]">
          <span className="mr-2 text-xl">{pet.icon}</span>
          {pet.name}の通院記録
        </p>
        <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-[#36724f] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={17} />
          記録を追加
        </button>
      </div>

      {visits.length ? (
        <div className="space-y-3">
          {visits.map((visit) => (
            <article key={visit.id} className="rounded-2xl border border-[#e3ebe4] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#6f9b7a]">{formatDate(visit.date)}</p>
                  <h2 className="mt-1 font-semibold">{visit.hospital}</h2>
                </div>
                <span className="rounded-full bg-[#edf6ef] px-3 py-1 text-xs font-medium text-[#4b7f5c]">
                  {visit.purpose}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-5 text-sm text-[#68766e]">
                {visit.weight && <span>体重 {visit.weight}</span>}
                <span>{visit.memo}</span>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-[#edf1ed] pt-3">
                <button type="button" onClick={() => onEdit(visit)} className="flex items-center gap-2 rounded-lg bg-[#eef6ef] px-3 py-2 text-sm font-medium text-[#36724f]">
                  <Pencil size={15} />編集
                </button>
                <button type="button" onClick={() => onDelete(visit)} className="flex items-center gap-2 rounded-lg bg-[#fff1ef] px-3 py-2 text-sm font-medium text-[#b45249]">
                  <Trash2 size={15} />削除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label="通院記録はまだありません" onAdd={onAdd} />
      )}
    </div>
  )
}

function VaccineList({ vaccines, pet, onEdit, onDelete }: {
  vaccines: Vaccine[]
  pet: Pet
  onEdit: (vaccine: Vaccine) => void
  onDelete: (vaccine: Vaccine) => void
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-sm text-[#839087]">
        <span className="text-xl">{pet.icon}</span>
        {pet.name}のワクチン履歴
      </div>

      {vaccines.length ? (
        <div className="space-y-3">
          {vaccines.map((vaccine) => {
            const days = daysUntil(vaccine.next)
            const urgent = days <= 3

            return (
              <article
                key={vaccine.id}
                className={`rounded-2xl border bg-white p-5 ${urgent ? 'border-[#f1ca8a]' : 'border-[#e3ebe4]'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{vaccine.name}</h2>
                    <p className="mt-1 text-xs text-[#849189]">前回接種 {formatDate(vaccine.date)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      days < 0
                        ? 'bg-[#fde8e6] text-[#bd5750]'
                        : urgent
                          ? 'bg-[#fff1d0] text-[#af741b]'
                          : 'bg-[#e7f3e9] text-[#4a7c58]'
                    }`}
                  >
                    {days < 0 ? '期限超過' : days === 0 ? '今日' : urgent ? 'まもなく' : '正常'}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7faf7] px-4 py-3">
                  <span className="text-sm text-[#68766e]">次回接種予定</span>
                  <b className={urgent ? 'text-[#b87b1e]' : 'text-[#426e50]'}>
                    {formatDate(vaccine.next)}（{days < 0 ? `${Math.abs(days)}日超過` : `あと${days}日`}）
                  </b>
                </div>

                {vaccine.memo && <p className="mt-3 text-xs text-[#849189]">メモ：{vaccine.memo}</p>}
                <div className="mt-4 flex justify-end gap-2 border-t border-[#edf1ed] pt-3">
                  <button type="button" onClick={() => onEdit(vaccine)} className="flex items-center gap-2 rounded-lg bg-[#eef6ef] px-3 py-2 text-sm font-medium text-[#36724f]">
                    <Pencil size={15} />編集
                  </button>
                  <button type="button" onClick={() => onDelete(vaccine)} className="flex items-center gap-2 rounded-lg bg-[#fff1ef] px-3 py-2 text-sm font-medium text-[#b45249]">
                    <Trash2 size={15} />削除
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState label="ワクチン記録はまだありません" />
      )}
    </div>
  )
}

function EmptyState({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ccdacf] bg-white px-5 py-14 text-center">
      <ClipboardPlus className="mx-auto text-[#9db5a2]" size={32} />
      <p className="mt-3 text-sm text-[#78867d]">{label}</p>
      {onAdd && (
        <button onClick={onAdd} className="mt-4 text-sm font-semibold text-[#36724f]">
          ＋ 記録を追加
        </button>
      )}
    </div>
  )
}

function RecordForm({
  type,
  pet,
  onType,
  onVisit,
  onVaccine,
}: {
  type: 'visit' | 'vaccine'
  pet: Pet
  onType: (type: 'visit' | 'vaccine') => void
  onVisit: (event: FormEvent<HTMLFormElement>) => void
  onVaccine: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex gap-2 rounded-xl bg-[#e9f0ea] p-1">
        <button
          onClick={() => onType('visit')}
          className={`flex-1 rounded-lg py-3 text-sm font-medium ${
            type === 'visit' ? 'bg-white text-[#36724f] shadow-sm' : 'text-[#89968d]'
          }`}
        >
          <Stethoscope className="mr-2 inline" size={17} />
          通院・健康記録
        </button>
        <button
          onClick={() => onType('vaccine')}
          className={`flex-1 rounded-lg py-3 text-sm font-medium ${
            type === 'vaccine' ? 'bg-white text-[#36724f] shadow-sm' : 'text-[#89968d]'
          }`}
        >
          <Syringe className="mr-2 inline" size={17} />
          ワクチン記録
        </button>
      </div>

      <form
        onSubmit={type === 'visit' ? onVisit : onVaccine}
        className="space-y-5 rounded-2xl border border-[#e3ebe4] bg-white p-5 sm:p-7"
      >
        <p className="text-sm text-[#718077]">
          記録するペット：<b className="text-[#27352d]">{pet.icon} {pet.name}</b>
        </p>

        {type === 'visit' ? (
          <>
            <FormInput label="通院日" name="date" type="date" required />
            <FormInput label="病院名" name="hospital" placeholder="みどり動物病院" required />
            <FormInput label="診察・通院カテゴリ" name="purpose" placeholder="定期健診" required />
            <FormInput label="体重（kg）" name="weight" type="number" step="0.1" placeholder="8.4" />
            <FormInput label="メモ" name="memo" placeholder="気になったことを入力" />
          </>
        ) : (
          <>
            <FormInput label="ワクチン名・種類" name="name" placeholder="混合ワクチン（5種）" required />
            <FormInput label="接種日" name="date" type="date" required />
            <FormInput label="次回接種予定日" name="next" type="date" required />
            <FormInput label="メモ" name="memo" placeholder="メモを入力" />
          </>
        )}

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36724f] text-sm font-semibold text-white">
          <Plus size={17} />
          記録を保存
        </button>
      </form>
    </div>
  )
}

function EditModal({
  target,
  onClose,
  onSubmit,
}: {
  target: EditTarget
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const title = target.kind === 'pet' ? 'ペット情報を編集' : target.kind === 'visit' ? '通院記録を編集' : 'ワクチン記録を編集'

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#203429]/40 p-0 sm:items-center sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title" className="my-auto w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="edit-dialog-title" className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="rounded-lg p-2 text-[#87948b] hover:bg-[#f1f5f1]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {target.kind === 'pet' ? (
            <>
              <FormInput label="ペット名" name="name" defaultValue={target.item.name} required />
              <FormInput label="種類" name="species" defaultValue={target.item.species} required />
              <FormInput label="品種" name="breed" defaultValue={target.item.breed} />
              <FormInput label="性別" name="gender" defaultValue={target.item.gender} />
              <FormInput label="生年月日" name="birth" type="date" defaultValue={target.item.birth} />
              <FormInput label="アイコン" name="icon" defaultValue={target.item.icon} />
            </>
          ) : target.kind === 'visit' ? (
            <>
              <FormInput label="通院日" name="date" type="date" defaultValue={target.item.date} required />
              <FormInput label="病院名" name="hospital" defaultValue={target.item.hospital} required />
              <FormInput label="診察・通院カテゴリ" name="purpose" defaultValue={target.item.purpose} required />
              <FormInput label="体重（kg）" name="weight" type="number" step="0.1" defaultValue={target.item.weight.replace(/\s*kg$/, '')} />
              <FormInput label="メモ" name="memo" defaultValue={target.item.memo} />
            </>
          ) : (
            <>
              <FormInput label="ワクチン名・種類" name="name" defaultValue={target.item.name} required />
              <FormInput label="接種日" name="date" type="date" defaultValue={target.item.date} required />
              <FormInput label="次回接種予定日" name="next" type="date" defaultValue={target.item.next} required />
              <FormInput label="メモ" name="memo" defaultValue={target.item.memo} />
            </>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="h-12 flex-1 rounded-xl border border-[#dce5dd] text-sm font-semibold text-[#68766e]">キャンセル</button>
            <button className="h-12 flex-1 rounded-xl bg-[#36724f] text-sm font-semibold text-white">変更を保存</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  step,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  step?: string
  defaultValue?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        step={step}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-xl border border-[#dce5dd] bg-white px-4 text-sm outline-none focus:border-[#75a486] focus:ring-4 focus:ring-[#e1f0e4]"
      />
    </label>
  )
}

function AddPetModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#203429]/30 p-0 sm:items-center sm:p-5">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">ペットを登録</h2>
          <button onClick={onClose} aria-label="閉じる" className="rounded-lg p-2 text-[#87948b] hover:bg-[#f1f5f1]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="ペット名" name="name" placeholder="ポチ" required />
          <FormInput label="種類" name="species" placeholder="犬 / 猫" required />
          <FormInput label="品種" name="breed" placeholder="柴犬" />
          <FormInput label="性別" name="gender" placeholder="オス / メス" />
          <FormInput label="生年月日" name="birth" type="date" />
          <FormInput label="アイコン" name="icon" placeholder="🐕" />
          <button className="h-12 rounded-xl bg-[#36724f] text-sm font-semibold text-white sm:col-span-2">
            登録する
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Page() {
  const [authReady, setAuthReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [pets, setPets] = useState(initialPets)
  const [vaccines, setVaccines] = useState(initialVaccines)
  const [visits, setVisits] = useState(initialVisits)
  const [selectedId, setSelectedId] = useState(1)
  const [view, setView] = useState<'home' | 'pets' | 'visits' | 'vaccines' | 'record'>('home')
  const [recordType, setRecordType] = useState<'visit' | 'vaccine'>('visit')
  const [showAddPet, setShowAddPet] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | undefined>()
  const selectedPet = pets.find((pet) => pet.id === selectedId) ?? pets[0]
  const petVaccines = vaccines.filter((vaccine) => vaccine.petId === selectedId)
  const petVisits = visits.filter((visit) => visit.petId === selectedId).sort((a, b) => b.date.localeCompare(a.date))
  const upcoming = useMemo(
    () =>
      vaccines
        .map((vaccine) => ({
          vaccine,
          pet: pets.find((pet) => pet.id === vaccine.petId),
          days: daysUntil(vaccine.next),
        }))
        .filter((item) => item.pet && item.days <= 30)
        .sort((a, b) => a.days - b.days)[0],
    [vaccines, pets],
  )

  const handleLogin = useCallback(async () => {
    setSaveError(null)
    setAuthNotice(undefined)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setAuthNotice('認証後にユーザー情報を確認できませんでした。もう一度ログインしてください。')
      return
    }

    const id = userData.user.id
    setUserId(id)
    const [petResult, visitResult, vaccineResult] = await Promise.all([
      supabase.from('pets').select('*').eq('user_id', id),
      supabase.from('visits').select('*').eq('user_id', id),
      supabase.from('vaccines').select('*').eq('user_id', id),
    ])

    const loadErrors = [petResult.error, visitResult.error, vaccineResult.error].filter(Boolean)
    if (loadErrors.length) setSaveError(`データの読み込みに失敗しました: ${loadErrors.map((error) => error?.message).join(' / ')}`)

    const loadedPets: Pet[] = (petResult.data ?? []).map((row) => ({
      id: Number(row.pet_id), name: row.name ?? '', species: row.species ?? '', breed: row.breed ?? '',
      gender: row.gender ?? '', birth: row.birth ?? '', icon: row.icon ?? '🐾',
    }))
    const loadedVisits: Visit[] = (visitResult.data ?? []).map((row) => ({
      id: Number(row.visit_id), petId: Number(row.pet_id), date: row.visit_date ?? '',
      hospital: row.hospital_name ?? '', purpose: row.purpose ?? '',
      weight: row.weight_kg == null ? '' : `${row.weight_kg} kg`, memo: row.memo ?? '',
    }))
    const loadedVaccines: Vaccine[] = (vaccineResult.data ?? []).map((row) => ({
      id: Number(row.vaccine_id), petId: Number(row.pet_id), name: row.vaccine_name ?? '',
      date: row.vaccination_date ?? '', next: row.next_date ?? '', memo: row.memo ?? '',
    }))

    setPets(loadedPets)
    setVisits(loadedVisits)
    setVaccines(loadedVaccines)
    setSelectedId(loadedPets[0]?.id ?? 0)
    setLoggedIn(true)
  }, [])

  useEffect(() => {
    let active = true
    const query = new URLSearchParams(window.location.search)
    if (query.has('error') || query.has('error_description')) {
      setAuthNotice(getAuthErrorMessage(new Error(query.get('error_description') ?? query.get('error') ?? '')))
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setLoggedIn(false)
        setUserId(null)
        setPets([])
        setVisits([])
        setVaccines([])
      }
    })

    void supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (!active) return
        if (error) {
          setAuthNotice('ログイン状態を確認できませんでした。もう一度ログインしてください。')
        } else if (data.session) {
          try {
            await handleLogin()
          } catch {
            setAuthNotice('ユーザー情報を読み込めませんでした。もう一度ログインしてください。')
          }
        }
      })
      .catch(() => {
        if (active) setAuthNotice('ログイン状態を確認できませんでした。ネットワークを確認して再度お試しください。')
      })
      .finally(() => {
        if (active) setAuthReady(true)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [handleLogin])

  async function handleLogout() {
    setSaveError(null)
    setSaveNotice(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSaveError('ログアウトできませんでした。時間をおいて再度お試しください。')
      return
    }
    setLoggedIn(false)
    setUserId(null)
    setPets([])
    setVisits([])
    setVaccines([])
    setAuthNotice('ログアウトしました。')
  }

  async function addVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaveNotice(null)
    if (!userId) {
      setSaveError('ログイン状態を確認できません。再度ログインしてください。')
      return
    }
    const data = new FormData(event.currentTarget)
    const weight = String(data.get('weight') ?? '')
    const payload = {
      pet_id: selectedId,
      user_id: userId,
      visit_date: String(data.get('date') ?? ''),
      hospital_name: String(data.get('hospital') ?? ''),
      purpose: String(data.get('purpose') ?? ''),
      weight_kg: weight ? Number(weight) : null,
      memo: String(data.get('memo') ?? ''),
    }
    try {
      const { data: saved, error } = await supabase.from('visits').insert(payload).select('visit_id').maybeSingle()
      if (error) throw error
      setVisits((current) => [{
        id: Number(saved.visit_id), petId: selectedId, date: payload.visit_date,
        hospital: payload.hospital_name, purpose: payload.purpose,
        weight: weight ? `${weight} kg` : '', memo: payload.memo,
      }, ...current])
      setSaveNotice('通院記録を保存しました。')
      setView('visits')
    } catch {
      setSaveError('通院記録を保存できませんでした。入力内容とSupabaseのテーブル設定をご確認ください。')
    }
  }
  async function addVaccine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaveNotice(null)
    if (!userId) {
      setSaveError('ログイン状態を確認できません。再度ログインしてください。')
      return
    }
    const data = new FormData(event.currentTarget)
    const payload = {
      pet_id: selectedId,
      user_id: userId,
      vaccine_name: String(data.get('name') ?? ''),
      vaccination_date: String(data.get('date') ?? ''),
      next_date: String(data.get('next') ?? ''),
      memo: String(data.get('memo') ?? ''),
    }
    try {
      const { data: saved, error } = await supabase.from('vaccines').insert(payload).select('vaccine_id').maybeSingle()
      if (error) throw error
      setVaccines((current) => [{
        id: Number(saved.vaccine_id), petId: selectedId, name: payload.vaccine_name,
        date: payload.vaccination_date, next: payload.next_date, memo: payload.memo,
      }, ...current])
      setSaveNotice('ワクチン記録を保存しました。')
      setView('vaccines')
    } catch {
      setSaveError('ワクチン記録を保存できませんでした。入力内容とSupabaseのテーブル設定をご確認ください。')
    }
  }
  async function addPet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaveNotice(null)
    if (!userId) {
      setSaveError('ログイン状態を確認できません。再度ログインしてください。')
      return
    }
    const data = new FormData(event.currentTarget)
    const payload = {
      user_id: userId,
      name: String(data.get('name') ?? ''),
      species: String(data.get('species') ?? ''),
      breed: String(data.get('breed') ?? ''),
      gender: String(data.get('gender') ?? ''),
      birth: String(data.get('birth') ?? ''),
      icon: String(data.get('icon') ?? '') || '🐾',
    }
    try {
      const { data: saved, error } = await supabase.from('pets').insert(payload).select('pet_id').maybeSingle()
      if (error) throw error
      const pet: Pet = { id: Number(saved.pet_id), name: payload.name, species: payload.species, breed: payload.breed, gender: payload.gender, birth: payload.birth, icon: payload.icon }
      setPets((current) => [...current, pet])
      setSelectedId(pet.id)
      setShowAddPet(false)
      setSaveNotice('ペットを登録しました。')
    } catch {
      setSaveError('ペットを保存できませんでした。入力内容とSupabaseのテーブル設定をご確認ください。')
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaveNotice(null)
    if (!editTarget || !userId) {
      setSaveError('ログイン情報を確認できません。再度ログインしてください。')
      return
    }

    const data = new FormData(event.currentTarget)
    try {
      if (editTarget.kind === 'pet') {
        const payload = {
          name: String(data.get('name') || ''), species: String(data.get('species') || ''),
          breed: String(data.get('breed') || ''), gender: String(data.get('gender') || ''),
          birth: String(data.get('birth') || ''), icon: String(data.get('icon') || '🐾'),
        }
        const { error } = await supabase.from('pets').update(payload)
          .eq('pet_id', editTarget.item.id).eq('user_id', userId).select('pet_id').maybeSingle()
        if (error) throw error
        setPets((current) => current.map((pet) => pet.id === editTarget.item.id ? { ...pet, ...payload } : pet))
        setSaveNotice('ペット情報を更新しました。')
      } else if (editTarget.kind === 'visit') {
        const weight = String(data.get('weight') || '')
        const payload = {
          visit_date: String(data.get('date') || ''), hospital_name: String(data.get('hospital') || ''),
          purpose: String(data.get('purpose') || ''), weight_kg: weight ? Number(weight) : null,
          memo: String(data.get('memo') || ''),
        }
        const { error } = await supabase.from('visits').update(payload)
          .eq('visit_id', editTarget.item.id).eq('user_id', userId).select('visit_id').maybeSingle()
        if (error) throw error
        const updated: Visit = {
          ...editTarget.item, date: payload.visit_date, hospital: payload.hospital_name,
          purpose: payload.purpose, weight: weight ? `${weight} kg` : '', memo: payload.memo,
        }
        setVisits((current) => current.map((visit) => visit.id === updated.id ? updated : visit))
        setSaveNotice('通院記録を更新しました。')
      } else {
        const payload = {
          vaccine_name: String(data.get('name') || ''), vaccination_date: String(data.get('date') || ''),
          next_date: String(data.get('next') || ''), memo: String(data.get('memo') || ''),
        }
        const { error } = await supabase.from('vaccines').update(payload)
          .eq('vaccine_id', editTarget.item.id).eq('user_id', userId).select('vaccine_id').maybeSingle()
        if (error) throw error
        const updated: Vaccine = {
          ...editTarget.item, name: payload.vaccine_name, date: payload.vaccination_date,
          next: payload.next_date, memo: payload.memo,
        }
        setVaccines((current) => current.map((vaccine) => vaccine.id === updated.id ? updated : vaccine))
        setSaveNotice('ワクチン記録を更新しました。')
      }
      setEditTarget(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '変更を保存できませんでした。')
    }
  }

  async function deleteVisit(visit: Visit) {
    if (!window.confirm(`${formatDate(visit.date)}の通院記録を削除しますか？`)) return
    if (!userId) { setSaveError('ログイン情報を確認できません。'); return }
    setSaveError(null)
    setSaveNotice(null)
    try {
      const { error } = await supabase.from('visits').delete()
        .eq('visit_id', visit.id).eq('user_id', userId).select('visit_id').maybeSingle()
      if (error) throw error
      setVisits((current) => current.filter((item) => item.id !== visit.id))
      setSaveNotice('通院記録を削除しました。')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '通院記録を削除できませんでした。')
    }
  }

  async function deleteVaccine(vaccine: Vaccine) {
    if (!window.confirm(`「${vaccine.name}」のワクチン記録を削除しますか？`)) return
    if (!userId) { setSaveError('ログイン情報を確認できません。'); return }
    setSaveError(null)
    setSaveNotice(null)
    try {
      const { error } = await supabase.from('vaccines').delete()
        .eq('vaccine_id', vaccine.id).eq('user_id', userId).select('vaccine_id').maybeSingle()
      if (error) throw error
      setVaccines((current) => current.filter((item) => item.id !== vaccine.id))
      setSaveNotice('ワクチン記録を削除しました。')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'ワクチン記録を削除できませんでした。')
    }
  }

  async function deletePet(pet: Pet) {
    if (!window.confirm(`「${pet.name}」を削除しますか？関連する履歴がある場合は削除できません。`)) return
    if (!userId) { setSaveError('ログイン情報を確認できません。'); return }
    setSaveError(null)
    setSaveNotice(null)
    try {
      const [visitCheck, vaccineCheck] = await Promise.all([
        supabase.from('visits').select('visit_id').eq('pet_id', pet.id).eq('user_id', userId),
        supabase.from('vaccines').select('vaccine_id').eq('pet_id', pet.id).eq('user_id', userId),
      ])
      if (visitCheck.error) throw visitCheck.error
      if (vaccineCheck.error) throw vaccineCheck.error
      if ((visitCheck.data?.length ?? 0) > 0 || (vaccineCheck.data?.length ?? 0) > 0) {
        setSaveError('このペットには通院またはワクチン履歴があります。先に履歴を個別に削除してください。')
        return
      }

      const { error } = await supabase.from('pets').delete()
        .eq('pet_id', pet.id).eq('user_id', userId).select('pet_id').maybeSingle()
      if (error) throw error
      const remaining = pets.filter((item) => item.id !== pet.id)
      setPets(remaining)
      if (selectedId === pet.id) setSelectedId(remaining[0]?.id ?? 0)
      setSaveNotice('ペットを削除しました。関連履歴は削除していません。')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'ペットを削除できませんでした。')
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8f5] text-[#27352d]">
      {!authReady ? (
        <div className="flex min-h-screen items-center justify-center bg-[#f7faf7] text-sm text-[#688071]" role="status">
          ログイン状態を確認しています…
        </div>
      ) : !loggedIn ? (
        <AuthScreen onLogin={handleLogin} notice={authNotice} />
      ) : (
        <>
          <header className="sticky top-0 z-20 border-b border-[#e5ebe5] bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-8">
              <Logo />
              <div className="flex items-center gap-3">
                {selectedPet && <div className="hidden items-center gap-2 rounded-xl bg-[#eef6ef] px-3 py-2 text-sm sm:flex">
                  <span className="text-xl">{selectedPet.icon}</span>
                  <span>
                    <b className="block text-xs text-[#315c40]">選択中のペット</b>
                    <span className="text-[#6e7b72]">{selectedPet.name}</span>
                  </span>
                </div>}
                <button
                  onClick={handleLogout}
                  className="rounded-xl p-2.5 text-[#829087] transition hover:bg-[#f1f5f1]"
                  aria-label="ログアウト"
                >
                  <LogOut size={19} />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-8">
            <aside className="hidden w-56 shrink-0 md:block">
              <nav className="space-y-1">
                {([
                  { key: 'home', label: 'ホーム', icon: Activity },
                  { key: 'pets', label: 'ペット一覧', icon: PawPrint },
                  { key: 'visits', label: '通院履歴', icon: Stethoscope },
                  { key: 'vaccines', label: 'ワクチン履歴', icon: Syringe },
                  { key: 'record', label: '記録を追加', icon: ClipboardPlus },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      view === key ? 'bg-[#e3f1e6] text-[#36724f]' : 'text-[#78867d] hover:bg-[#edf4ee]'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="mt-10 rounded-2xl bg-[#e2f0e4] p-4">
                <ShieldCheck size={20} className="text-[#36724f]" />
                <p className="mt-3 text-xs leading-5 text-[#557361]">
                  大切な記録を、いつでも安全に確認できます。
                </p>
              </div>
            </aside>

            <section className="min-w-0 flex-1 pb-20">
              <div className="mb-7">
                <p className="text-sm text-[#839087]">2026年9月25日（金）</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {view === 'home'
                    ? 'こんにちは、田中さん'
                    : view === 'pets'
                      ? 'ペット一覧'
                      : view === 'visits'
                        ? '通院履歴'
                        : view === 'vaccines'
                          ? 'ワクチン履歴'
                          : '記録を追加'}
                </h1>
              </div>

              {saveError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
              {saveNotice && (
                <div role="status" className="mb-4 rounded-xl border border-[#cce4d1] bg-[#edf7ef] px-4 py-3 text-sm text-[#36724f]">
                  {saveNotice}
                </div>
              )}

              {view === 'home' && selectedPet && (
                <Home
                  selectedPet={selectedPet}
                  upcoming={upcoming}
                  pets={pets}
                  onSelect={setSelectedId}
                  onView={(next) => {
                    setView(next)
                  }}
                />
              )}
              {view === 'home' && !selectedPet && (
                <EmptyState label="ペットを登録すると健康管理を始められます" onAdd={() => setShowAddPet(true)} />
              )}

              {view === 'pets' && (
                <PetList
                  pets={pets}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onAdd={() => setShowAddPet(true)}
                  onEdit={(pet) => setEditTarget({ kind: 'pet', item: pet })}
                  onDelete={deletePet}
                />
              )}

              {view === 'visits' && selectedPet && (
                <VisitList
                  visits={petVisits}
                  pet={selectedPet}
                  onAdd={() => {
                    setRecordType('visit')
                    setView('record')
                  }}
                  onEdit={(visit) => setEditTarget({ kind: 'visit', item: visit })}
                  onDelete={deleteVisit}
                />
              )}
              {view === 'visits' && !selectedPet && <EmptyState label="通院履歴を見るには、先にペットを登録してください" onAdd={() => setShowAddPet(true)} />}

              {view === 'vaccines' && selectedPet && (
                <VaccineList vaccines={petVaccines} pet={selectedPet}
                  onEdit={(vaccine) => setEditTarget({ kind: 'vaccine', item: vaccine })}
                  onDelete={deleteVaccine} />
              )}
              {view === 'vaccines' && !selectedPet && <EmptyState label="ワクチン履歴を見るには、先にペットを登録してください" onAdd={() => setShowAddPet(true)} />}

              {view === 'record' && selectedPet && (
                <RecordForm
                  type={recordType}
                  pet={selectedPet}
                  onType={setRecordType}
                  onVisit={addVisit}
                  onVaccine={addVaccine}
                />
              )}
              {view === 'record' && !selectedPet && <EmptyState label="記録を追加するには、先にペットを登録してください" onAdd={() => setShowAddPet(true)} />}
            </section>
          </div>
        </>
      )}

      {showAddPet && <AddPetModal onClose={() => setShowAddPet(false)} onSubmit={addPet} />}
      {editTarget && <EditModal target={editTarget} onClose={() => setEditTarget(null)} onSubmit={saveEdit} />}
      {loggedIn && (
        <nav aria-label="メインナビゲーション" className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-2xl border border-[#dfe8e0] bg-white p-1.5 shadow-xl md:hidden">
          {([
            { key: 'home', icon: Activity },
            { key: 'pets', icon: PawPrint },
            { key: 'visits', icon: Stethoscope },
            { key: 'vaccines', icon: Syringe },
            { key: 'record', icon: Plus },
          ] as const).map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === 'record') setRecordType('visit')
                setView(key)
              }}
              className={`rounded-xl p-3 ${view === key ? 'bg-[#e3f1e6] text-[#36724f]' : 'text-[#89968d]'}`}
              aria-label={key}
              aria-current={view === key ? 'page' : undefined}
            >
              <Icon size={19} />
            </button>
          ))}
        </nav>
      )}
    </main>
  )
}
