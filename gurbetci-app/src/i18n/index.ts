import * as Localization from 'expo-localization';
import { tr } from './tr';

export type TranslationKey = keyof typeof tr;

class I18n {
  private locale: string;
  private translations: Record<string, any>;

  constructor() {
    try {
      // Localization.locale undefined olabilir, bu yüzden güvenli kontrol yapıyoruz
      const deviceLocale = Localization.locale || Localization.locales?.[0] || 'tr-TR';
      this.locale = deviceLocale.toLowerCase().startsWith('tr') ? 'tr' : 'tr'; // Varsayılan Türkçe
    } catch (error) {
      console.warn('Locale detection failed, using default Turkish:', error);
      this.locale = 'tr'; // Hata durumunda varsayılan Türkçe
    }
    
    this.translations = {
      tr: tr,
    };
  }

  t(key: TranslationKey): string {
    try {
      return this.translations[this.locale][key] || key;
    } catch (error) {
      console.warn(`Translation key "${key}" not found:`, error);
      return key; // Hata durumunda key'i döndür
    }
  }

  setLocale(locale: string) {
    this.locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }
}

export const i18n = new I18n();
export const t = (key: TranslationKey): string => i18n.t(key); 