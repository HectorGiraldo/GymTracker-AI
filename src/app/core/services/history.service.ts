import { Injectable, signal, effect, inject, computed } from '@angular/core';
import { db } from '../../../firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ProfileService } from './profile.service';

export interface PastWorkout {
  id: string;
  uid?: string;
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
  private profileService = inject(ProfileService);
  
  pastWorkouts = signal<PastWorkout[]>([]);
  private unsubscribe: (() => void) | null = null;

  stats = computed(() => {
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
  });

  chartData = computed(() => {
    return [...this.pastWorkouts()].reverse().map(w => ({
      date: w.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      volume: w.totalVolume
    }));
  });

  constructor() {
    effect(() => {
      const user = this.profileService.currentUser();
      if (user) {
        this.listenToWorkouts(user.uid);
      } else {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
        this.pastWorkouts.set([]);
      }
    });
  }

  private listenToWorkouts(uid: string) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const workoutsRef = collection(db, 'users', uid, 'workouts');
    const q = query(workoutsRef, orderBy('date', 'desc'));

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const workouts: PastWorkout[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        workouts.push({
          ...data,
          id: doc.id,
          date: new Date(data['date'])
        } as PastWorkout);
      });
      this.pastWorkouts.set(workouts);
    }, (error) => {
      console.error('Error listening to workouts:', error);
    });
  }

  async addWorkout(workout: PastWorkout) {
    const user = this.profileService.currentUser();
    if (!user) {
      console.error('Cannot save workout: User not logged in');
      return;
    }

    const workoutId = workout.id || Date.now().toString();
    const workoutData = {
      ...workout,
      uid: user.uid,
      date: workout.date.toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'workouts', workoutId), workoutData);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }
}
