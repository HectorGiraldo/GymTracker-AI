import { Component, inject, OnInit, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  public profileService = inject(ProfileService);

  profileForm = this.fb.group({
    name: ['', Validators.required],
    weight: [null as number | null, [Validators.min(30), Validators.max(300)]],
    height: [null as number | null, [Validators.min(100), Validators.max(250)]],
    level: ['Principiante', Validators.required],
    defaultEquipment: ['Gimnasio completo', Validators.required],
    injuries: ['']
  });

  levels = ['Principiante', 'Intermedio', 'Avanzado'];
  equipmentOptions = [
    'Gimnasio completo',
    'Solo mancuernas',
    'Solo barra y discos',
    'Bandas elásticas',
    'Sin equipamiento (calistenia)',
    'Máquinas de cable'
  ];

  savedSuccess = false;

  constructor() {
    effect(() => {
      const currentProfile = this.profileService.profile();
      if (currentProfile) {
        this.profileForm.patchValue({
          name: currentProfile.name,
          weight: currentProfile.weight,
          height: currentProfile.height,
          level: currentProfile.level,
          defaultEquipment: currentProfile.defaultEquipment,
          injuries: currentProfile.injuries
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    // Initialization handled by effect
  }

  async login() {
    await this.profileService.login();
  }

  async logout() {
    await this.profileService.logout();
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.profileService.saveProfile(this.profileForm.value as any);
      this.savedSuccess = true;
      setTimeout(() => this.savedSuccess = false, 3000);
    }
  }
}