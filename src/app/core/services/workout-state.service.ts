import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkoutStateService {
  activeRoutine = signal<any>(null);
  activeDayIndex = signal<number>(0);

  setRoutine(routine: any, dayIndex: number = 0) {
    this.activeRoutine.set(routine);
    this.activeDayIndex.set(dayIndex);
  }

  clearRoutine() {
    this.activeRoutine.set(null);
    this.activeDayIndex.set(0);
  }
}
