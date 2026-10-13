import { supabase } from '@/lib/supabase'
// 🟢 Create（追加）
export async function addVisit(data: {
  pet_id: number
  user_id?: string
  visit_date: string
  hospital_name: string
  purpose: string
  weight_kg?: number | string
  memo?: string
}) {
  const { error } = await supabase.from('visits').insert(data)
  if (error) throw error
}
// 🔵 Read（取得）
export async function getVisits(petId: number) {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('pet_id', petId)
  if (error) throw error
  return data
}
// 🟡 Update（更新）
export async function updateVisit(visitId: number, updates: {
  visit_date?: string
  hospital_name?: string
  purpose?: string
  memo?: string
}) {
  const { error } = await supabase.from('visits').update(updates).eq('visit_id', visitId)
  if (error) throw error
}
// 🔴 Delete（削除）
export async function deleteVisit(visitId: number) {
  const { error } = await supabase.from('visits').delete().eq('visit_id', visitId)
  if (error) throw error
}
