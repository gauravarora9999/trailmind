import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvdwytgomcipecuxhtik.supabase.co'
const supabaseAnonKey = 'sb_publishable__xDLYzH2w4qWVas0gbmLZg_DuyqQxGO'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
