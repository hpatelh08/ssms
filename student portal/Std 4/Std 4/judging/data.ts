/**
 * judging/data.ts
 * ─────────────────────────────────────────────────────
 * Sample data for the Innovation Marathon Judging Platform.
 * Replace with API integration for production.
 */

import type { ProjectTeam, EvaluationCriteria } from './types';

export const EVALUATION_CRITERIA: EvaluationCriteria[] = [
  {
    id: 'innovation',
    label: 'Innovation & Creativity',
    description: 'Originality of the idea and creative approach to solving the problem',
    maxScore: 10,
  },
  {
    id: 'impact',
    label: 'Social Impact',
    description: 'Potential benefit to the community, scalability, and real-world applicability',
    maxScore: 10,
  },
  {
    id: 'technical',
    label: 'Technical Execution',
    description: 'Quality of implementation, prototype functionality, and technical depth',
    maxScore: 10,
  },
  {
    id: 'presentation',
    label: 'Presentation & Clarity',
    description: 'Communication quality, visual materials, and team confidence',
    maxScore: 10,
  },
  {
    id: 'feasibility',
    label: 'Feasibility & Sustainability',
    description: 'Practical viability, cost-effectiveness, and long-term sustainability',
    maxScore: 10,
  },
];

export const SAMPLE_PROJECTS: ProjectTeam[] = [
  {
    id: 'proj-001',
    teamName: 'Team Vidya',
    school: 'Government Primary School, Sector 12',
    district: 'Ahmedabad',
    members: ['Arya Patel', 'Riya Shah', 'Karan Mehta', 'Priya Nair'],
    projectTitle: 'SmartBoard — AI-Powered Accessible Learning',
    projectDescription:
      'An AI-powered interactive whiteboard system designed for rural government schools. SmartBoard uses voice commands in regional languages, gesture recognition, and adaptive learning algorithms to bridge the digital divide. The system runs on low-cost hardware and solar-powered batteries, making it deployable in areas with unreliable electricity.',
    category: 'Education Technology',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=500&fit=crop',
    videoUrl: 'https://example.com/demo-video',
    prototypeUrl: 'https://example.com/prototype',
    tags: ['AI', 'Education', 'Accessibility', 'Rural Development'],
  },
  {
    id: 'proj-002',
    teamName: 'Team Jal Rakshak',
    school: 'Municipal School No. 45',
    district: 'Surat',
    members: ['Harsh Desai', 'Diya Joshi', 'Amar Singh'],
    projectTitle: 'AquaPure — Smart Water Quality Monitor',
    projectDescription:
      'A low-cost IoT-based water quality monitoring system that provides real-time data on contamination levels in public water sources. Uses spectrophotometry and ML models to detect harmful bacteria, heavy metals, and pH levels. Sends automated alerts to local authorities via SMS and a web dashboard.',
    category: 'Environmental Technology',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&h=500&fit=crop',
    videoUrl: 'https://example.com/demo-video-2',
    prototypeUrl: 'https://example.com/prototype-2',
    tags: ['IoT', 'Water', 'Health', 'Smart City'],
  },
  {
    id: 'proj-003',
    teamName: 'Team Kisan Mitra',
    school: 'Rajkot Nagarpalika School',
    district: 'Rajkot',
    members: ['Vivek Solanki', 'Anjali Rathod', 'Mohit Kumar', 'Neha Prajapati'],
    projectTitle: 'CropSense — Precision Agriculture Advisor',
    projectDescription:
      'A mobile application that combines satellite imagery with ground sensor data to provide personalized crop health advisories to smallholder farmers. The app uses AI to predict pest outbreaks, recommend optimal irrigation schedules, and suggest organic fertilizer alternatives based on soil composition.',
    category: 'Agriculture Technology',
    thumbnailUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop',
    videoUrl: 'https://example.com/demo-video-3',
    prototypeUrl: 'https://example.com/prototype-3',
    tags: ['Agriculture', 'AI', 'Mobile App', 'Sustainability'],
  },
  {
    id: 'proj-004',
    teamName: 'Team Suraksha',
    school: 'Government Girls School, Ward 7',
    district: 'Vadodara',
    members: ['Meera Bhatt', 'Kavya Trivedi', 'Sneha Parmar'],
    projectTitle: 'SafeRoute — Women Safety Navigation',
    projectDescription:
      'A safety-first navigation application that uses crowd-sourced danger zone data, real-time CCTV feed analysis, and community reporting to suggest the safest pedestrian routes for women. Includes an emergency SOS feature with auto-location sharing and integration with 112 emergency services.',
    category: 'Public Safety',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=500&fit=crop',
    videoUrl: 'https://example.com/demo-video-4',
    prototypeUrl: 'https://example.com/prototype-4',
    tags: ['Safety', 'Navigation', 'Women Empowerment', 'Community'],
  },
  {
    id: 'proj-005',
    teamName: 'Team GreenBytes',
    school: 'Central Government School',
    district: 'Gandhinagar',
    members: ['Rohan Sharma', 'Ishaan Verma', 'Tanvi Patel', 'Aditi Rao'],
    projectTitle: 'EcoTrack — Carbon Footprint Gamifier',
    projectDescription:
      'A gamified mobile platform that helps students and families track, reduce, and offset their carbon footprint through daily challenges. Uses AI to analyze utility bills, transit habits, and consumption patterns, then converts reductions into virtual "green coins" redeemable for school supplies and eco-rewards.',
    category: 'Environmental Sustainability',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=500&fit=crop',
    videoUrl: 'https://example.com/demo-video-5',
    prototypeUrl: 'https://example.com/prototype-5',
    tags: ['Environment', 'Gamification', 'Carbon', 'Mobile App'],
  },
  {
    id: 'proj-006',
    teamName: 'Team MedLink',
    school: 'Narmada Valley School',
    district: 'Bharuch',
    members: ['Ayush Pandey', 'Nisha Yadav', 'Raj Malhotra'],
    projectTitle: 'HealthBridge — Telemedicine for Rural PHCs',
    projectDescription:
      'A lightweight telemedicine platform connecting patients at rural Primary Health Centers with specialist doctors in urban hospitals via low-bandwidth video calls. Features an AI triage system that prioritizes cases, digitizes patient records using OCR, and supports local language voice input for elderly patients.',
    category: 'Healthcare Technology',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop',
    videoUrl: 'https://example.com/demo-video-6',
    prototypeUrl: 'https://example.com/prototype-6',
    tags: ['Healthcare', 'Telemedicine', 'AI', 'Rural'],
  },
];
