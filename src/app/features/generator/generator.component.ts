import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { WorkoutStateService } from '../../core/services/workout-state.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generator.component.html',
  styleUrl: './generator.component.scss'
})
export class GeneratorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private aiService = inject(AiService);
  private workoutState = inject(WorkoutStateService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  generatorForm = this.fb.group({
    days: [3, [Validators.required, Validators.min(1), Validators.max(7)]],
    level: ['Intermedio', Validators.required],
    objective: ['Ganancia muscular (hipertrofia)', Validators.required],
    equipment: ['Gimnasio completo', Validators.required],
    duration: [60, Validators.required],
    muscles: ['Cuerpo completo'],
    injuries: ['']
  });

  levels = ['Principiante', 'Intermedio', 'Avanzado'];
  objectives = [
    'Pérdida de grasa',
    'Ganancia muscular (hipertrofia)',
    'Fuerza y potencia',
    'Resistencia cardiovascular',
    'Tonificación y definición',
    'Salud general y movilidad'
  ];
  equipmentOptions = [
    'Gimnasio completo',
    'Solo mancuernas',
    'Solo barra y discos',
    'Bandas elásticas',
    'Sin equipamiento (calistenia)',
    'Máquinas de cable'
  ];
  durations = [30, 45, 60, 90];
  muscleGroups = [
    'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 
    'Piernas', 'Glúteos', 'Abdomen', 'Cuerpo completo'
  ];

  isGenerating = false;
  generatedRoutine: any = null;

  ngOnInit() {
    // Pre-fill form with profile data if configured
    const profile = this.profileService.profile();
    if (profile.isConfigured) {
      this.generatorForm.patchValue({
        level: profile.level,
        equipment: profile.defaultEquipment,
        injuries: profile.injuries
      });
    }
  }

  async onSubmit() {
    if (this.generatorForm.valid) {
      this.isGenerating = true;
      this.generatedRoutine = null;
      
      // Inject profile context into the request
      const profile = this.profileService.profile();
      const requestData = {
        ...this.generatorForm.value,
        userContext: profile.isConfigured ? {
          weight: profile.weight,
          height: profile.height,
          name: profile.name
        } : null
      };

      try {
        const routine = await this.aiService.generateRoutine(requestData);
        this.generatedRoutine = routine;
        console.log('Routine generated:', routine);
      } catch (error) {
        console.error('Failed to generate routine', error);
        alert('Error al generar la rutina. Revisa la consola.');
      } finally {
        this.isGenerating = false;
      }
    }
  }

  startWorkout() {
    if (this.generatedRoutine) {
      this.workoutState.setRoutine(this.generatedRoutine, 0); // Start with day 0
      this.router.navigate(['/workout']);
    }
  }
}
