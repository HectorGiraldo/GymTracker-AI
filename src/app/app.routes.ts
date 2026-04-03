import { Routes } from '@angular/router';
import { GeneratorComponent } from './features/generator/generator.component';
import { WorkoutSessionComponent } from './features/workout-session/workout-session.component';
import { HistoryComponent } from './features/history/history.component';
import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  { path: '', component: GeneratorComponent },
  { path: 'workout', component: WorkoutSessionComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];
