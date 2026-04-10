import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ClassAssignmentsPage } from './ClassAssignmentsPage';

export const AssignmentsPage: React.FC = () => {
  const { studentProfile } = useAuth();
  return <ClassAssignmentsPage studentProfile={studentProfile} />;
};

export default AssignmentsPage;
