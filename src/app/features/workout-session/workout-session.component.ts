import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutStateService } from '../../core/services/workout-state.service';
import { HistoryService, PastWorkout } from '../../core/services/history.service';

interface SetLog {
  completed: boolean;
  weight: number | null;
  reps: number | null;
}

interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  notes: string;
}

@Component({
  selector: 'app-workout-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout-session.component.html',
  styleUrl: './workout-session.component.scss'
})
export class WorkoutSessionComponent implements OnInit, OnDestroy {
  private workoutState = inject(WorkoutStateService);
  private historyService = inject(HistoryService);
  private router = inject(Router);

  routine = this.workoutState.activeRoutine;
  dayIndex = this.workoutState.activeDayIndex;
  
  currentDay = computed(() => {
    const r = this.routine();
    if (!r || !r.dias || r.dias.length <= this.dayIndex()) return null;
    return r.dias[this.dayIndex()];
  });

  logs = signal<ExerciseLog[]>([]);
  
  // Timer state
  restTimeRemaining = signal<number>(0);
  private timerInterval: any;
  private autosaveInterval: any;
  private startTime: Date = new Date();

  ngOnInit() {
    if (!this.currentDay()) {
      this.router.navigate(['/']);
      return;
    }

    this.startTime = new Date();
    this.initializeLogs();
    
    // Simulate autosave every 30 seconds
    this.autosaveInterval = setInterval(() => {
      console.log('Autosaving workout progress...', this.logs());
      // Here we would call the backend to sync
    }, 30000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autosaveInterval) clearInterval(this.autosaveInterval);
  }

  private initializeLogs() {
    const day = this.currentDay();
    if (!day) return;

    const initialLogs: ExerciseLog[] = day.ejercicios.map((ex: any) => {
      const sets: SetLog[] = [];
      
      // Try to parse default reps from ex.repeticiones (e.g. "10-12" -> 10)
      let defaultReps = null;
      if (typeof ex.repeticiones === 'string') {
        const match = ex.repeticiones.match(/\d+/);
        if (match) defaultReps = parseInt(match[0], 10);
      } else if (typeof ex.repeticiones === 'number') {
        defaultReps = ex.repeticiones;
      }

      for (let i = 0; i < ex.series; i++) {
        sets.push({ completed: false, weight: null, reps: defaultReps });
      }
      return {
        exerciseId: ex.id || ex.nombre,
        sets,
        notes: ''
      };
    });
    this.logs.set(initialLogs);
  }

  toggleSet(exIndex: number, setIndex: number, restSeconds: number) {
    this.logs.update(currentLogs => {
      const newLogs = [...currentLogs];
      const set = newLogs[exIndex].sets[setIndex];
      set.completed = !set.completed;
      
      // If we just completed a set, start the rest timer
      if (set.completed) {
        this.startRestTimer(restSeconds);
      }
      
      return newLogs;
    });
  }

  startRestTimer(seconds: number) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.restTimeRemaining.set(seconds);
    
    this.timerInterval = setInterval(() => {
      const current = this.restTimeRemaining();
      if (current > 0) {
        this.restTimeRemaining.set(current - 1);
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get isWorkoutComplete(): boolean {
    return this.logs().every(log => log.sets.every(set => set.completed));
  }

  finishWorkout() {
    if (this.isWorkoutComplete) {
      const day = this.currentDay();
      if (day) {
        // Calculate total volume: Weight * Reps
        let totalVolume = 0;
        this.logs().forEach(log => {
          log.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
              totalVolume += (set.weight * set.reps);
            }
          });
        });

        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - this.startTime.getTime()) / 60000);

        const pastWorkout: PastWorkout = {
          id: Date.now().toString(),
          date: new Date(),
          routineName: day.nombre_dia,
          durationMinutes: durationMinutes > 0 ? durationMinutes : 1,
          totalVolume,
          completedExercises: day.ejercicios.length,
          totalExercises: day.ejercicios.length
        };

        this.historyService.addWorkout(pastWorkout);
        this.workoutState.markDayCompleted(this.dayIndex());
      }

      alert('¡Felicidades! Has completado tu entrenamiento de hoy.');
      this.router.navigate(['/history']);
    }
  }
}
