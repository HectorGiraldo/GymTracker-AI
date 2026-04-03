import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutStateService } from '../../core/services/workout-state.service';

interface SetLog {
  completed: boolean;
  weight: number | null;
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

  ngOnInit() {
    if (!this.currentDay()) {
      this.router.navigate(['/']);
      return;
    }

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
      for (let i = 0; i < ex.series; i++) {
        sets.push({ completed: false, weight: null });
      }
      return {
        exerciseId: ex.id,
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
      alert('¡Felicidades! Has completado tu entrenamiento de hoy.');
      this.workoutState.clearRoutine();
      this.router.navigate(['/']);
    }
  }
}
