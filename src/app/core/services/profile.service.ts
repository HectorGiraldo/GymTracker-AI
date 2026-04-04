import { Injectable, signal } from '@angular/core';
import { auth, db } from '../../../firebase';
import { onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, signOut, User, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  uid?: string;
  name: string;
  weight: number | null; // kg
  height: number | null; // cm
  level: string;
  defaultEquipment: string;
  injuries: string;
  isConfigured: boolean;
  activeRoutine?: any; // Store the currently generated routine
  completedDays?: number[]; // Track which days of the active routine are completed
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private defaultProfile: UserProfile = {
    name: '',
    weight: null,
    height: null,
    level: 'Principiante',
    defaultEquipment: 'Gimnasio completo',
    injuries: '',
    isConfigured: false,
    activeRoutine: null,
    completedDays: []
  };

  profile = signal<UserProfile>({ ...this.defaultProfile });
  currentUser = signal<User | null>(null);
  isAuthReady = signal<boolean>(false);

  constructor() {
    this.initAuth();
    this.checkRedirectResult();
  }

  private async checkRedirectResult() {
    try {
      await getRedirectResult(auth);
    } catch (error) {
      console.error('Error getting redirect result:', error);
    }
  }

  private initAuth() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.isAuthReady.set(true);
      
      if (user) {
        this.listenToProfile(user.uid);
      } else {
        this.profile.set({ ...this.defaultProfile });
      }
    });
  }

  async login() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  private listenToProfile(uid: string) {
    const docRef = doc(db, 'users', uid);
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.profile.set(docSnap.data() as UserProfile);
      } else {
        // Create default profile if it doesn't exist
        const newProfile = { ...this.defaultProfile, uid, name: this.currentUser()?.displayName || '' };
        setDoc(docRef, newProfile);
      }
    }, (error) => {
      console.error('Error listening to profile:', error);
    });
  }

  async saveProfile(data: Partial<UserProfile>) {
    const user = this.currentUser();
    if (!user) {
      console.error('Cannot save profile: User not logged in');
      return;
    }

    const current = this.profile();
    const updated: UserProfile = { 
      ...current, 
      ...data, 
      uid: user.uid,
      isConfigured: true 
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), updated);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }

  async clearProfile() {
    const user = this.currentUser();
    if (!user) return;

    const resetProfile = { ...this.defaultProfile, uid: user.uid, name: user.displayName || '' };
    try {
      await setDoc(doc(db, 'users', user.uid), resetProfile);
    } catch (error) {
      console.error('Error clearing profile:', error);
    }
  }
}