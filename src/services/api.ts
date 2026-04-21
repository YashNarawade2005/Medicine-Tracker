/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication } from '../types';

export class ApiError extends Error {
  details?: string;
  solution?: string;
  technical?: string;

  constructor(message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    if (data) {
      this.details = data.details;
      this.solution = data.solution;
      this.technical = data.technical;
    }
  }
}

export const api = {
  async getMedications(): Promise<{ data: Medication[], mode: 'live' | 'local' }> {
    const res = await fetch('/api/medications');
    const contentType = res.headers.get('content-type');
    const mode = (res.headers.get('X-Database-Mode') || 'local') as 'live' | 'local';
    
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new ApiError(errorData.error || 'Failed to fetch medications', errorData);
      }
      throw new ApiError(`Server Error (${res.status}): The server returned an unexpected response format.`);
    }

    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError('The server returned an invalid response format (Expected JSON).');
    }

    const data = await res.json();
    return { data, mode };
  },

  async addMedication(med: Partial<Medication>): Promise<Medication> {
    const res = await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(med),
    });
    
    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add medication');
      }
      throw new Error('Failed to add medication: Unexpected server response.');
    }
    return res.json();
  },

  async logDose(medId: string, scheduleIndex: number, status: string, loggedTime: string): Promise<Medication> {
    const res = await fetch(`/api/medications/${medId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleIndex, status, loggedTime }),
    });

    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to log dose');
      }
      throw new Error('Failed to log dose: Unexpected server response.');
    }
    return res.json();
  },

  async updateDoseTime(medId: string, scheduleIndex: number, newTime: string): Promise<Medication> {
    const res = await fetch(`/api/medications/${medId}/schedule/${scheduleIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: newTime }),
    });

    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update dose time');
      }
      throw new Error('Failed to update dose time: Unexpected server response.');
    }
    return res.json();
  },

  async updateMedication(medId: string, med: Partial<Medication>): Promise<Medication> {
    const res = await fetch(`/api/medications/${medId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(med),
    });

    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update medication');
      }
      throw new Error('Failed to update medication: Unexpected server response.');
    }
    return res.json();
  }
};
