import { createClient } from '@supabase/supabase-js';
import { Database, SimpleUser } from '../types';

// Supabase configuration - .env dosyasından alınmalı
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Auth Service
export const authService = {
  // Telefon ile OTP gönderme
  async signInWithPhone(phone: string) {
    // Önce telefon numarasının desteklenen ülkede olup olmadığını kontrol et
    const isSupported = await this.checkPhoneSupport(phone);
    if (!isSupported) {
      throw new Error('Bu ülke kodu henüz desteklenmiyor.');
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    });
    
    if (error) throw error;
    return data;
  },

  // E-posta ile OTP gönderme
  async signInWithEmail(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'gurbetci://auth/verify', // Mobile app için deep link
      },
    });
    
    if (error) throw error;
    return data;
  },

  // E-posta ve şifre ile kayıt
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'gurbetci://auth/verify', // Mobile app için deep link
      },
    });
    
    if (error) {
      return { data, error };
    }
    
    // Kayıt başarılı ise users tablosuna ekle
    if (data.user) {
      try {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email.toLowerCase(),
            email_verified: false, // Yeni kullanıcılar doğrulanmamış başlar
          });
        
        if (userError) {
          console.error('Error creating user record:', userError);
          // Auth kaydı başarılı olduğu için hata vermeyiz, sadece log
        }

        // Custom OTP e-postası gönder
        try {
          const otpCode = this.generateOTPCode();
          
          // OTP kodunu database'e kaydet
          await this.saveOTPCode(data.user.id, otpCode, 'email_verification', email);
          
          // Custom e-posta gönder
          await this.sendCustomEmail(email, 'otp', { code: otpCode });
          
          console.log('Custom OTP email sent successfully');
        } catch (emailError) {
          console.error('Custom email send error:', emailError);
          // E-posta gönderimi başarısız olsa da kayıt devam eder
        }
      } catch (insertError) {
        console.error('Error inserting user record:', insertError);
        // Auth kaydı başarılı olduğu için hata vermeyiz, sadece log
      }
    }
    
    return { data, error };
  },

  // E-posta ve şifre ile giriş
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Giriş başarısız ise direkt return et
    if (error) {
      return { data, error };
    }
    
    // E-posta doğrulaması kontrolü
    if (data.user && data.user.email) {
      // Users tablosundan email_verified durumunu kontrol et
      const { data: userData } = await this.getUserByEmail(data.user.email);
      
      if (userData && !userData.email_verified) {
        console.log('Email not verified for user:', data.user.email);
        
        // Custom OTP kodu gönder
        try {
          const otpCode = this.generateOTPCode();
          await this.saveOTPCode(data.user.id, otpCode, 'email_verification', data.user.email);
          await this.sendCustomEmail(data.user.email, 'otp', { code: otpCode });
          
          console.log('Verification email sent to:', data.user.email);
          
          // E-posta doğrulaması gerekiyor hatası fırlat
          const emailError = new Error('E-posta adresiniz doğrulanmamış. Lütfen e-posta adresinize gönderilen doğrulama kodunu girin.');
          (emailError as any).code = 'EMAIL_NOT_VERIFIED';
          (emailError as any).email = data.user.email;
          throw emailError;
        } catch (emailError: any) {
          if (emailError.code === 'EMAIL_NOT_VERIFIED') {
            // E-posta doğrulaması gerekiyor hatası
            throw emailError;
          }
          
          console.error('Failed to send verification email:', emailError);
          // E-posta gönderimi başarısız olsa bile doğrulama gerekiyor
          const verificationError = new Error('E-posta doğrulaması gerekiyor, ancak doğrulama kodu gönderilemedi.');
          (verificationError as any).code = 'EMAIL_NOT_VERIFIED';
          (verificationError as any).email = data.user.email;
          throw verificationError;
        }
      }
    }
    
    return { data, error };
  },

  // Google ile giriş sonrası kullanıcı işlemleri
  async handleGoogleSignIn(user: any) {
    try {
      console.log('Handling Google sign-in for user:', user.email);
      
      // Supabase'de kullanıcı zaten oluştu, users tablosunda mevcut olup olmadığını kontrol et
      const { data: existingUser } = await this.getUserByEmail(user.email);
      
      if (!existingUser) {
        // Users tablosuna ekle
        console.log('Creating user record for Google user:', user.email);
        
        // UUID kontrolü yap - eğer geçerli UUID değilse yeni oluştur
        let userId = user.id;
        if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          // UUID generator function
          const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          userId = generateUUID();
          console.log('Generated new UUID for Google user:', userId);
        }
        
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: user.email.toLowerCase(),
            email_verified: true, // Google kullanıcıları doğrulanmış sayılır
            auth_provider: 'google',
            profile_data: {
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            },
          });
        
        if (userError) {
          console.error('Error creating Google user record:', userError);
          throw new Error('Kullanıcı kaydı oluşturulamadı');
        }
        
        console.log('Google user record created successfully');
        // Güncellenmiş user objesini dön
        const updatedUser = { ...user, id: userId };
        return { success: true, user: updatedUser };
      } else {
        console.log('Google user already exists in users table');
        return { success: true, user };
      }
    } catch (error: any) {
      console.error('Google sign-in handler error:', error);
      return { success: false, error: error.message };
    }
  },

  // OTP doğrulama
  async verifyOtp(emailOrPhone: string, token: string, type: 'email' | 'sms' = 'sms') {
    const { data, error } = await supabase.auth.verifyOtp({
      [type === 'email' ? 'email' : 'phone']: emailOrPhone,
      token,
      type,
    });
    
    if (error) throw error;
    
    // OTP doğrulama başarılı ise users tablosuna telefon numarasını ekle (telefon için)
    if (data.user && type === 'sms') {
      try {
        // Önce bu telefon numarasının kayıtlı olup olmadığını kontrol et
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', emailOrPhone)
          .single();
        
        if (!existingUser) {
          // Telefon numarası kayıtlı değil, yeni kayıt oluştur
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              phone: emailOrPhone,
              email: data.user.email || '', // E-posta varsa ekle
            });
          
          if (userError) {
            console.error('Error creating user record for phone:', userError);
          }
        }
      } catch (insertError) {
        console.error('Error handling user record for phone:', insertError);
      }
    }
    
    return data;
  },

  // Şifre sıfırlama
  async resetPassword(email: string) {
    try {
      // Önce kullanıcının var olup olmadığını kontrol et
      const { data: user } = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('Bu e-posta adresi ile kayıtlı bir hesap bulunamadı');
      }

      // 6 haneli OTP kodu oluştur
      const otpCode = this.generateOTPCode();
      
      // OTP kodunu database'e kaydet (user_id olmadan, email ile)
      const { data, error } = await supabase
        .from('otp_codes')
        .insert({
          code: otpCode,
          type: 'password_reset',
          email: email.toLowerCase(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 dakika
        });

      if (error) {
        console.error('OTP save error:', error);
        throw new Error('Doğrulama kodu kaydedilemedi');
      }
      
      // Custom OTP e-postası gönder
      await this.sendCustomEmail(email, 'password-reset-otp', { code: otpCode });
      
      console.log('Password reset OTP sent successfully');
      return { success: true, message: 'Şifre sıfırlama kodu gönderildi' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Şifre sıfırlama OTP doğrulama
  async verifyPasswordResetOTP(email: string, code: string) {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('code', code)
        .eq('type', 'password_reset')
        .eq('email', email.toLowerCase())
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Geçersiz veya süresi dolmuş kod');
      }

      // Kodu kullanıldı olarak işaretle
      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ is_used: true })
        .eq('id', data[0].id);

      if (updateError) throw updateError;

      return { success: true, otpId: data[0].id };
    } catch (error) {
      console.error('Password reset OTP verify error:', error);
      throw error;
    }
  },

  // Yeni şifre belirleme (OTP doğrulaması sonrası)
  async updatePasswordWithOTP(email: string, newPassword: string) {
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          email,
          newPassword,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Şifre güncellenirken hata oluştu');
      }

      return data;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  },

  // Kullanıcı şifresini güncelle
  async updateUserPassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    
    return { data, error };
  },

  // Telefon numarasının desteklenip desteklenmediğini kontrol et
  async checkPhoneSupport(phone: string): Promise<boolean> {
    try {
      // Telefon numarasından ülke kodunu çıkar
      const dialCode = this.extractDialCode(phone);
      
      const { data, error } = await supabase
        .from('supported_countries')
        .select('is_active')
        .eq('dial_code', dialCode)
        .eq('is_active', true)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return false; // Ülke kodu bulunamadı
      }
      
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Phone support check error:', error);
      return false;
    }
  },

  // Telefon numarasından ülke kodunu çıkar
  extractDialCode(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Desteklenen ülke kodları
    const supportedDialCodes = ['+48', '+90', '+49']; // Polonya, Türkiye, Almanya
    
    for (const dialCode of supportedDialCodes) {
      if (phone.startsWith(dialCode)) {
        return dialCode;
      }
    }
    
    return '';
  },



  // Telefon numarasına göre kullanıcı bilgisi getir
  async getUserByPhone(phone: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    
    if (error) throw error;
    return { data, error: null };
  },

  // E-posta adresine göre kullanıcı bilgisi getir
  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone, email_verified, created_at, updated_at')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    
    if (error) throw error;
    return { data, error: null };
  },

  // Kullanıcı profili oluşturma
  async createUserProfile(userData: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Kullanıcı adı kontrolü
  async checkUsernameAvailability(username: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      return { available: true };
    }
    
    if (error) throw error;
    return { available: false };
  },

  // Mevcut kullanıcıyı getir
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Kullanıcı profilini getir
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profil bulunamadı
      return { data: null, error: null };
    }

    if (error) throw error;
    return { data, error: null };
  },

  // Auth durumu değişikliklerini dinle
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Çıkış yap
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Desteklenen ülkeleri getir
  async getSupportedCountries() {
    const { data, error } = await supabase
      .from('supported_countries')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data;
  },

  // Ülkeye göre şehirleri getir
  async getCitiesByCountry(countryCode: string) {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  // E-posta varlığını kontrol et
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('Checking email existence:', email);
      
      // Users tablosundan e-posta varlığını kontrol et
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Kayıt bulunamadı - e-posta mevcut değil
          console.log('Email does not exist');
          return false;
        }
        
        // Başka bir hata oluştu
        console.error('Email check error:', error);
        return false;
      }
      
      // Kayıt bulundu - e-posta mevcut
      console.log('Email exists');
      return true;
    } catch (error) {
      console.error('Email check unexpected error:', error);
      return false;
    }
  },

  // E-posta önerileri
  getEmailSuggestions(inputEmail: string): string[] {
    const atIndex = inputEmail.indexOf('@');
    if (atIndex === -1) return [];
    
    const username = inputEmail.substring(0, atIndex);
    const domain = inputEmail.substring(atIndex + 1);
    
    const suggestions = ['gmail.com', 'outlook.com', 'icloud.com'];
    
    return suggestions
      .filter(suggestion => suggestion.startsWith(domain))
      .map(suggestion => `${username}@${suggestion}`);
  },

  // Custom e-posta gönderimi
  async sendCustomEmail(to: string, template: 'otp' | 'password-reset' | 'welcome', data: any) {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          template,
          data,
        },
      });

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Custom email send error:', error);
      throw error;
    }
  },

  // OTP kodu generate et
  generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // OTP kodu database'e kaydet
  async saveOTPCode(userId: string | null, code: string, type: 'email_verification' | 'password_reset', email?: string, phone?: string) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 dakika geçerli

      const insertData: any = {
        code,
        type,
        expires_at: expiresAt.toISOString(),
      };

      // User ID varsa ekle
      if (userId) {
        insertData.user_id = userId;
      }

      // Email varsa ekle
      if (email) {
        insertData.email = email.toLowerCase();
      }

      // Phone varsa ekle
      if (phone) {
        insertData.phone = phone;
      }

      const { data, error } = await supabase
        .from('otp_codes')
        .insert(insertData);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OTP save error:', error);
      throw error;
    }
  },

  // OTP kodu doğrula
  async verifyOTPCode(code: string, type: 'email_verification' | 'password_reset', email?: string, phone?: string) {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('code', code)
        .eq('type', type)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Geçersiz veya süresi dolmuş kod');
      }

      const otpRecord = data[0];

      // Email veya phone kontrolü
      if (email && otpRecord.email !== email) {
        throw new Error('Kod bu e-posta adresi için geçerli değil');
      }

      if (phone && otpRecord.phone !== phone) {
        throw new Error('Kod bu telefon numarası için geçerli değil');
      }

      // Kodu kullanıldı olarak işaretle
      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ is_used: true })
        .eq('id', otpRecord.id);

      if (updateError) throw updateError;

      // E-posta doğrulaması için email_verified'ı güncelle
      if (type === 'email_verification' && email) {
        await this.markEmailVerified(email);
      }

      return otpRecord;
    } catch (error) {
      console.error('OTP verify error:', error);
      throw error;
    }
  },

  // E-posta doğrulaması işaretleme
  async markEmailVerified(email: string) {
    try {
      // Users tablosunda email_verified'ı true yap
      const { error } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Error marking email as verified:', error);
        throw error;
      }

      console.log('Email marked as verified:', email);
    } catch (error) {
      console.error('Mark email verified error:', error);
      throw error;
    }
  },

  // E-posta doğrulaması durumunu kontrol et
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email_verified')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Kullanıcı bulunamadı
        }
        throw error;
      }

      return data?.email_verified || false;
    } catch (error) {
      console.error('Email verification check error:', error);
      return false;
    }
  },
};

// Ülke ve şehir hizmetleri
export const countryService = {
  // Polonya şehirlerini getir
  async getPolandCities() {
    try {
      // Polonya'nın büyük şehirleri - City interface'ine uygun format
      const polandCities = [
        { id: '1', name: 'Warszawa', name_tr: 'Varşova', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '2', name: 'Kraków', name_tr: 'Krakov', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '3', name: 'Gdańsk', name_tr: 'Gdansk', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '4', name: 'Wrocław', name_tr: 'Wroclaw', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '5', name: 'Poznań', name_tr: 'Poznan', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '6', name: 'Łódź', name_tr: 'Lodz', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '7', name: 'Szczecin', name_tr: 'Szczecin', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '8', name: 'Bydgoszcz', name_tr: 'Bydgoszcz', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '9', name: 'Lublin', name_tr: 'Lublin', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '10', name: 'Katowice', name_tr: 'Katowice', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '11', name: 'Białystok', name_tr: 'Bialystok', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '12', name: 'Gdynia', name_tr: 'Gdynia', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '13', name: 'Częstochowa', name_tr: 'Czestochowa', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '14', name: 'Radom', name_tr: 'Radom', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '15', name: 'Sosnowiec', name_tr: 'Sosnowiec', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '16', name: 'Toruń', name_tr: 'Torun', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '17', name: 'Kielce', name_tr: 'Kielce', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '18', name: 'Rzeszów', name_tr: 'Rzeszow', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '19', name: 'Gliwice', name_tr: 'Gliwice', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '20', name: 'Zabrze', name_tr: 'Zabrze', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '21', name: 'Bytom', name_tr: 'Bytom', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '22', name: 'Olsztyn', name_tr: 'Olsztyn', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '23', name: 'Bielsko-Biała', name_tr: 'Bielsko-Biala', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '24', name: 'Rybnik', name_tr: 'Rybnik', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '25', name: 'Opole', name_tr: 'Opole', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '26', name: 'Tychy', name_tr: 'Tychy', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '27', name: 'Gorzów Wielkopolski', name_tr: 'Gorzow Wielkopolski', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '28', name: 'Dąbrowa Górnicza', name_tr: 'Dabrowa Gornicza', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '29', name: 'Elbląg', name_tr: 'Elblag', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: '30', name: 'Płock', name_tr: 'Plock', country_code: 'PL', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      return polandCities;
    } catch (error) {
      console.error('Error loading Poland cities:', error);
      throw error;
    }
  },

  // Desteklenen ülkeleri getir
  async getSupportedCountries() {
    return authService.getSupportedCountries();
  },

  // Ülkeye göre şehirleri getir
  async getCitiesByCountry(countryCode: string) {
    return authService.getCitiesByCountry(countryCode);
  },
};

// Utility fonksiyonlar
export const generateUsername = (firstName: string, lastName: string): string => {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const random = Math.floor(Math.random() * 1000);
  return `${base}${random}`;
};

export const generateBrandUsername = (brandName: string): string => {
  const base = brandName.toLowerCase().replace(/\s+/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${base}${random}`;
};

export const createInitialsAvatar = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  switch (countryCode) {
    case '+48': // Polonya
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`;
    
    case '+90': // Türkiye
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
    
    case '+49': // Almanya
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)} ${numbers.slice(7, 11)}`;
    
    default:
      return numbers;
  }
}; 