import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  email: string
  newPassword: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, newPassword }: ResetPasswordRequest = await req.json()

    if (!email || !newPassword) {
      throw new Error('E-posta ve yeni şifre gerekli')
    }

    // Auth kullanıcısını e-posta ile bul
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const authUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!authUser) {
      throw new Error('Kullanıcı bulunamadı')
    }

    // Şifreyi güncelle
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Şifreniz başarıyla güncellendi',
        userId: authUser.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Password reset error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Şifre güncellenirken hata oluştu' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 