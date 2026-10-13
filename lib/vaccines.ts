import { supabase } from '@/lib/supabase'
// 🟢 Create（追加）
export async function addVaccine(data: {
  pet_id: number
  user_id?: string
  vaccine_name: string
  vaccination_date: string
  next_date?: string
  memo?: string
}) {
  const { error } = await supabase.from('vaccines').insert(data)
  if (error) throw error
}
// 🔵 Read（取得）
export async function getVaccines(petId: number) {
  const { data, error } = await supabase
    .from('vaccines')
    .select('*')
    .eq('pet_id', petId)
  if (error) throw error
  return data
}
// 🟡 Update（更新）
export async function updateVaccine(vaccineId: number, updates: {
  vaccine_name?: string
  vaccination_date?: string
  next_date?: string
  memo?: string
}) {
  const { error } = await supabase.from('vaccines').update(updates).eq('vaccine_id', vaccineId)
  if (error) throw error
}
// 🔴 Delete（削除）
export async function deleteVaccine(vaccineId: number) {
  const { error } = await supabase.from('vaccines').delete().eq('vaccine_id', vaccineId)
  if (error) throw error
}