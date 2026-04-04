import { Injectable, signal, inject, effect } from '@angular/core';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class WorkoutStateService {
  private profileService = inject(ProfileService);

  activeRoutine = signal<any>(null);
  activeDayIndex = signal<number>(0);
  completedDays = signal<number[]>([]);

  constructor() {
    effect(() => {
      const profile = this.profileService.profile();
      if (profile && profile.activeRoutine) {
        // Only update if it's different to avoid infinite loops
        if (JSON.stringify(this.activeRoutine()) !== JSON.stringify(profile.activeRoutine)) {
          this.activeRoutine.set(profile.activeRoutine);
        }
        if (profile.completedDays && JSON.stringify(this.completedDays()) !== JSON.stringify(profile.completedDays)) {
          this.completedDays.set(profile.completedDays);
        }
      } else {
        this.activeRoutine.set(null);
        this.completedDays.set([]);
      }
    }, { allowSignalWrites: true });
  }

  setRoutine(routine: any, dayIndex: number = 0) {
    this.activeRoutine.set(routine);
    this.activeDayIndex.set(dayIndex);
    this.completedDays.set([]);
    
    // Save to profile
    this.profileService.saveProfile({ activeRoutine: routine, completedDays: [] });
  }

  clearRoutine() {
    this.activeRoutine.set(null);
    this.activeDayIndex.set(0);
    this.completedDays.set([]);
    
    // Remove from profile
    this.profileService.saveProfile({ activeRoutine: null, completedDays: [] });
  }

  markDayCompleted(dayIndex: number) {
    const current = this.completedDays();
    if (!current.includes(dayIndex)) {
      const updated = [...current, dayIndex];
      this.completedDays.set(updated);
      this.profileService.saveProfile({ completedDays: updated });
    }
  }
}
