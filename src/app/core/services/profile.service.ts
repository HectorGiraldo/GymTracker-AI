import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  name: string;
  weight: number | null; // kg
  height: number | null; // cm
  level: string;
  defaultEquipment: string;
  injuries: string;
  isConfigured: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly STORAGE_KEY = 'gymtracker_profile';

  private defaultProfile: UserProfile = {
    name: '',
    weight: null,
    height: null,
    level: 'Principiante',
    defaultEquipment: 'Gimnasio completo',
    injuries: '',
    isConfigured: false
  };

  profile = signal<UserProfile>(this.loadProfile());

  constructor() { }

  private loadProfile(): UserProfile {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old array format to string if necessary
        if (Array.isArray(parsed.defaultEquipment)) {
          parsed.defaultEquipment = parsed.defaultEquipment[0] || 'Gimnasio completo';
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing profile from local storage', e);
      }
    }
    return { ...this.defaultProfile };
  }

  saveProfile(data: Partial<UserProfile>) {
    const current = this.profile();
    const updated: UserProfile = { 
      ...current, 
      ...data, 
      isConfigured: true 
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    this.profile.set(updated);
  }

  clearProfile() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.profile.set({ ...this.defaultProfile });
  }
}