import { Injectable, signal } from '@angular/core';

export interface PastWorkout {
  id: string;
  date: Date;
  routineName: string;
  durationMinutes: number;
  totalVolume: number; // kg
  completedExercises: number;
  totalExercises: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  // Start with an empty history
  pastWorkouts = signal<PastWorkout[]>([]);

  addWorkout(workout: PastWorkout) {
    this.pastWorkouts.update(workouts => [workout, ...workouts]);
  }

  getStats() {
    const workouts = this.pastWorkouts();
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
    
    // Calculate streak (consecutive days or weeks, simplified)
    const currentStreak = totalWorkouts > 0 ? 1 : 0; // Simplified for now

    return {
      totalWorkouts,
      totalVolume,
      currentStreak
    };
  }

  // Chart data: Volume over time
  getChartData() {
    return [...this.pastWorkouts()].reverse().map(w => ({
      date: w.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      volume: w.totalVolume
    }));
  }
}
