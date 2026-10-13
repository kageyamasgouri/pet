import { supabase } from '@/lib/supabase'
// 🟢 Create（追加）
export async function addPet(data: {
  name: string
  species: string
  user_id: string
  breed?: string
  gender?: string
  birth?: string
  icon?: string
}) {
  const { error } = await supabase.from('pets').insert(data)
  if (error) throw error
}
// 🔵 Read（取得）
export async function getPets(userId: string) {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}
// 🟡 Update（更新）
export async function updatePet(petId: number, updates: { name?: string }) {
  const { error } = await supabase.from('pets').update(updates).eq('pet_id', petId)
  if (error) throw error
}
// 🔴 Delete（削除）
export async function deletePet(petId: number) {
  const { error } = await supabase.from('pets').delete().eq('pet_id', petId)
  if (error) throw error
}
