/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, User } from './types';

export const MOCK_USER: User = {
  name: "Sarah J.",
  streak: 12,
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjEAe6yoSZCoj19gmLJdhZGbHuovJwMIBPpV2IFzUEItSH-_crapeGgguUY-jHtaNDCX6DZlR6EBk670xe3JcJffbc4f9lEO85ktf01wwmFCimp3Hfv5bha5XfGhpI9Unlz5ZxOS5vXnczt6NTk-QjnEODLgztMmfoLaQx3PpoZKbW_Speb9gf-xx_-gS2SswLmwBI5UonT3f9g_wIYss0VGWF_QC46TnMvjJgk8PE-iMZ34iYrMuM88majYLE9OmsrE5SCTP0jW8"
};

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Metformin',
    dosage: '500mg',
    frequency: '2x Daily, W/ Meals',
    nextDose: 'Today, 6:30 PM',
    status: 'active',
    adherence: 85,
    type: 'capsule',
    color: '#006d36',
    schedule: [
      { time: '8:00 AM', status: 'taken', loggedTime: '8:05 AM' },
      { time: '6:30 PM', status: 'upcoming' }
    ]
  },
  {
    id: '2',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: '1x Daily, Morning',
    nextDose: 'Tomorrow, 8:00 AM',
    status: 'active',
    adherence: 100,
    type: 'pill',
    color: '#005da7',
    schedule: [
      { time: '9:00 AM', status: 'taken', loggedTime: '9:12 AM' }
    ]
  },
  {
    id: '3',
    name: 'Vitamin D3',
    dosage: '2000 IU',
    frequency: '1x Daily, Lunch',
    nextDose: 'Today, 1:00 PM',
    status: 'active',
    adherence: 25,
    type: 'capsule',
    color: '#ba1a1a',
    schedule: [
      { time: '1:00 PM', status: 'missed' }
    ]
  },
  {
    id: '4',
    name: 'Levothyroxine',
    dosage: '50mcg',
    frequency: '1x Daily, Early Morning',
    nextDose: 'Passed',
    status: 'active',
    adherence: 95,
    type: 'pill',
    color: '#006d36',
    schedule: [
      { time: '8:00 AM', status: 'taken', loggedTime: '8:00 AM' }
    ]
  },
  {
    id: '5',
    name: 'Adderall XR',
    dosage: '20mg',
    frequency: '1x Daily, Noon',
    nextDose: 'Today, 2:00 PM',
    status: 'active',
    adherence: 90,
    type: 'capsule',
    color: '#005da7',
    schedule: [
      { time: '2:00 PM', status: 'due-now' }
    ]
  }
];
