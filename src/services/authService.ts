/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';
import { storageService } from './storage';

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  isSimulatedFutureAuth: boolean;
}

// Simulated Auth Service
export const authService = {
  // Check active session status
  getSession(): AuthSession {
    const profile = storageService.getProfile();
    // For Phase 01, we bypass real auth and return active local profile
    // But structure is fully ready for OAuth or email/password firebase tokens.
    return {
      isAuthenticated: true, // Defaults to authenticated local driver for offline-first usage
      user: profile,
      isLoading: false,
      isSimulatedFutureAuth: false
    };
  },

  // Planned endpoints for future integrated Auth (e.g. Google Auth, Firebase Auth, SMS Auth)
  async signInWithEmail(email: string, pass: string): Promise<UserProfile> {
    console.log('Simulating Auth sign in with email:', email);
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = storageService.getProfile();
        resolve(profile);
      }, 500);
    });
  },

  async signOut(): Promise<void> {
    console.log('Simulating Auth sign out');
    // Clear session details or mark authenticated as false in full implementation
  },

  async signUp(name: string, email: string): Promise<UserProfile> {
    console.log('Simulating Auth sign up:', name, email);
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = storageService.getProfile();
        profile.name = name;
        profile.email = email;
        storageService.saveProfile(profile);
        resolve(profile);
      }, 500);
    });
  }
};
