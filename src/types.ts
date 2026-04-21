/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Medication {
  _id?: string;
  id?: string; // For backward compatibility or mapped ID
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  status: 'active' | 'paused' | 'as-needed';
  adherence: number; // 0-100
  type: 'pill' | 'capsule' | 'liquid' | 'injection';
  color: string;
  schedule: Array<{
    time: string;
    status: 'taken' | 'missed' | 'upcoming' | 'due-now';
    loggedTime?: string;
  }>;
}

export interface User {
  name: string;
  streak: number;
  avatarUrl: string;
}

export type View = 'dashboard' | 'medications' | 'schedule' | 'history' | 'settings';
