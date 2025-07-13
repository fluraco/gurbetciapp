import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  template: 'otp' | 'password-reset' | 'password-reset-otp' | 'welcome'
  data: {
    code?: string
    name?: string
    resetLink?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, data }: EmailRequest = await req.json()

    // SMTP Configuration
    const SMTP_CONFIG = {
      host: 'smtp-relay.brevo.com',
      port: 587,
      user: '91edc1001@smtp-brevo.com',
      pass: 'BdzhH2kGbt9qcA15',
      fromEmail: 'noreply@gurbetci.com',
      fromName: 'Gurbetçi',
    }

    // E-posta template'leri
    const templates = {
      otp: {
        subject: 'Gurbetçi - E-posta Doğrulama Kodu',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>E-posta Doğrulama</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #DC2626; }
              .code { font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 5px; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🇹🇷 Gurbetçi</div>
                <h1>E-posta Doğrulama</h1>
              </div>
              <p>Merhaba,</p>
              <p>Gurbetçi'ye hoş geldiniz! E-posta adresinizi doğrulamak için aşağıdaki 6 haneli kodu kullanın:</p>
              <div class="code">${data.code}</div>
              <p>Bu kod 10 dakika geçerlidir. Kodu kimseyle paylaşmayın.</p>
              <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
              <div class="footer">
                <p>© 2024 Gurbetçi. Tüm hakları saklıdır.</p>
                <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
              </div>
            </div>
          </body>
          </html>
        `
      },
      'password-reset': {
        subject: 'Gurbetçi - Şifre Sıfırlama',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Şifre Sıfırlama</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #DC2626; }
              .button { display: inline-block; background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🇹🇷 Gurbetçi</div>
                <h1>Şifre Sıfırlama</h1>
              </div>
              <p>Merhaba,</p>
              <p>Şifrenizi sıfırlamak için bir talepte bulundunuz. Aşağıdaki bağlantıya tıklayarak yeni şifrenizi oluşturabilirsiniz:</p>
              <p style="text-align: center;">
                <a href="${data.resetLink}" class="button">Şifremi Sıfırla</a>
              </p>
              <p>Bu bağlantı 1 saat geçerlidir.</p>
              <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
              <div class="footer">
                <p>© 2024 Gurbetçi. Tüm hakları saklıdır.</p>
                <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
              </div>
            </div>
          </body>
          </html>
        `
             },
       'password-reset-otp': {
         subject: 'Gurbetçi - Şifre Sıfırlama Kodu',
         html: `
           <!DOCTYPE html>
           <html>
           <head>
             <meta charset="utf-8">
             <title>Şifre Sıfırlama Kodu</title>
             <style>
               body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
               .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
               .header { text-align: center; margin-bottom: 30px; }
               .logo { font-size: 24px; font-weight: bold; color: #DC2626; }
               .code { font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 5px; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
               .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
             </style>
           </head>
           <body>
             <div class="container">
               <div class="header">
                 <div class="logo">🇹🇷 Gurbetçi</div>
                 <h1>Şifre Sıfırlama</h1>
               </div>
               <p>Merhaba,</p>
               <p>Şifrenizi sıfırlamak için aşağıdaki 6 haneli doğrulama kodunu kullanın:</p>
               <div class="code">${data.code}</div>
               <p>Bu kod 10 dakika geçerlidir. Kodu kimseyle paylaşmayın.</p>
               <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
               <div class="footer">
                 <p>© 2024 Gurbetçi. Tüm hakları saklıdır.</p>
                 <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
               </div>
             </div>
           </body>
           </html>
         `
       },
       welcome: {
        subject: 'Gurbetçi\'ye Hoş Geldiniz! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Hoş Geldiniz</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #DC2626; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🇹🇷 Gurbetçi</div>
                <h1>Hoş Geldiniz!</h1>
              </div>
              <p>Merhaba ${data.name},</p>
              <p>Gurbetçi ailesine katıldığınız için teşekkür ederiz! 🎉</p>
              <p>Artık yurtdışındaki Türk toplumunun bir parçasısınız. Uygulamamızda:</p>
              <ul>
                <li>📰 Güncel haberler ve gelişmeler</li>
                <li>🏢 İş imkanları ve kariyer fırsatları</li>
                <li>👥 Topluluk etkinlikleri</li>
                <li>🛡️ Hukuki destek ve danışmanlık</li>
                <li>📋 Resmi işlemler rehberi</li>
              </ul>
              <p>Profilinizi tamamlayarak daha kişiselleştirilmiş bir deneyim yaşayabilirsiniz.</p>
              <p>Sorularınız için destek ekibimizle iletişime geçebilirsiniz: destek@gurbetci.com</p>
              <div class="footer">
                <p>© 2024 Gurbetçi. Tüm hakları saklıdır.</p>
                <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    }

    // Template seçimi
    const emailTemplate = templates[template]
    if (!emailTemplate) {
      throw new Error('Geçersiz template')
    }

    // Brevo API key'ini environment variable'dan al (güvenli yöntem)
    // @ts-ignore - Deno global objesi Edge Functions'da mevcut
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || 'xkeysib-GERÇEK_API_KEY_BURAYA_GELECEK'
    
    // API key kontrolü
    if (!BREVO_API_KEY || BREVO_API_KEY.startsWith('xkeysib-GERÇEK_API_KEY')) {
      throw new Error('Brevo API key\'i yapılandırılmamış. Environment variable BREVO_API_KEY\'i ayarlayın.')
    }
    
    // Brevo API ile e-posta gönderimi
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          email: SMTP_CONFIG.fromEmail,
          name: SMTP_CONFIG.fromName,
        },
        to: [{ email: to }],
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`E-posta gönderimi başarısız: ${error}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'E-posta başarıyla gönderildi' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('E-posta gönderimi hatası:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 