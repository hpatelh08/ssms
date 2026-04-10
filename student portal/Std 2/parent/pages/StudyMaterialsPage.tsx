import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ClassStudyMaterialsPage } from './ClassStudyMaterialsPage';

export const StudyMaterialsPage: React.FC = () => {
  const { studentProfile } = useAuth();
  return <ClassStudyMaterialsPage studentProfile={studentProfile} />;
};

export default StudyMaterialsPage;
