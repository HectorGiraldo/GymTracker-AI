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
  // Mock data for history
  private mockHistory: PastWorkout[] = [
    {
      id: '1',
      date: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
      routineName: 'Día 1: Pecho y Tríceps',
      durationMinutes: 55,
      totalVolume: 4500,
      completedExercises: 6,
      totalExercises: 6
    },
    {
      id: '2',
      date: new Date(new Date().setDate(new Date().getDate() - 3)), // 3 days ago
      routineName: 'Día 2: Espalda y Bíceps',
      durationMinutes: 62,
      totalVolume: 5200,
      completedExercises: 5,
      totalExercises: 6 // Partial completion
    },
    {
      id: '3',
      date: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
      routineName: 'Día 3: Piernas y Hombros',
      durationMinutes: 70,
      totalVolume: 8000,
      completedExercises: 7,
      totalExercises: 7
    }
  ];

  pastWorkouts = signal<PastWorkout[]>(this.mockHistory);

  getStats() {
    const workouts = this.pastWorkouts();
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
    
    // Calculate streak (consecutive days or weeks, simplified for mock)
    const currentStreak = 3; 

    return {
      totalWorkouts,
      totalVolume,
      currentStreak
    };
  }

  // Mock chart data: Volume over time
  getChartData() {
    return [...this.pastWorkouts()].reverse().map(w => ({
      date: w.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      volume: w.totalVolume
    }));
  }
}
