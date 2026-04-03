import React from 'react';
import { motion } from 'framer-motion';
import type { StudentProfile } from '../data/studentProfiles';
import { useAuth } from '../auth/AuthContext';

type ProfileMode = 'student' | 'parent';

interface ProfileSnapshotCardProps {
  mode: ProfileMode;
}

interface ProfileField {
  label: string;
  value: string;
  locked?: boolean;
}

const LOCKED_VALUE = 'Unlock in Parent view';

function buildProfileFields(mode: ProfileMode, profile: StudentProfile): ProfileField[] {
  const revealGuardianFields = mode === 'parent';

  return [
    { label: 'Student Name', value: profile.studentName },
    { label: 'Class', value: profile.className },
    { label: 'Admission Number', value: profile.admissionNumber },
    { label: 'GR No', value: profile.grNo },
    { label: 'Student ID', value: profile.studentId },
    { label: 'Password', value: profile.password },
    {
      label: 'Parent Name',
      value: revealGuardianFields ? profile.parentName : LOCKED_VALUE,
      locked: !revealGuardianFields,
    },
    {
      label: 'Phone',
      value: revealGuardianFields ? profile.phone : LOCKED_VALUE,
      locked: !revealGuardianFields,
    },
    { label: 'DOB', value: profile.dob },
    { label: 'Gender', value: profile.gender },
    { label: 'Blood Group', value: profile.bloodGroup },
    {
      label: 'Address',
      value: revealGuardianFields ? profile.address : LOCKED_VALUE,
      locked: !revealGuardianFields,
    },
    { label: 'Status', value: profile.status },
    {
      label: 'Parent Access Key',
      value: revealGuardianFields ? profile.parentAccessKey : LOCKED_VALUE,
      locked: !revealGuardianFields,
    },
  ];
}

export const ProfileSnapshotCard: React.FC<ProfileSnapshotCardProps> = ({ mode }) => {
  const { studentProfile } = useAuth();

  if (!studentProfile) {
    return null;
  }

  const fields = buildProfileFields(mode, studentProfile);
  const isParentMode = mode === 'parent';

  return (
    <motion.section
      className="relative overflow-hidden rounded-[32px] p-5 md:p-6"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.94) 0%, rgba(246,247,255,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 24px 60px rgba(99,102,241,0.1)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-28"
        style={{
          background: isParentMode
            ? 'radial-gradient(circle at top right, rgba(244,114,182,0.18), transparent 52%), radial-gradient(circle at top left, rgba(99,102,241,0.16), transparent 48%)'
            : 'radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 52%), radial-gradient(circle at top right, rgba(56,189,248,0.14), transparent 48%)',
        }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em]"
              style={{
                background: isParentMode ? 'rgba(244,114,182,0.1)' : 'rgba(99,102,241,0.1)',
                color: isParentMode ? '#db2777' : '#5b5cf0',
              }}
            >
              {isParentMode ? 'Parent dashboard profile' : 'Student dashboard profile'}
            </div>

            <h3 className="mt-4 text-[24px] font-black leading-tight text-indigo-600">
              {studentProfile.studentName}
            </h3>
            <p className="mt-1 text-[13px] font-semibold text-indigo-400">
              {isParentMode
                ? 'Verified parent mode reveals family contact details and the access key.'
                : 'Student mode keeps guardian details locked until the Parent Access Key is verified.'}
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-3 rounded-[24px] p-4"
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(129,140,248,0.12)',
              minWidth: 0,
            }}
          >
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-400">Class</div>
              <div className="mt-1 text-[18px] font-black text-indigo-600">{studentProfile.className}</div>
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-400">Status</div>
              <div className="mt-1 text-[18px] font-black text-emerald-500">{studentProfile.status}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map(field => (
            <div
              key={field.label}
              className="rounded-[24px] px-4 py-3.5"
              style={{
                background: field.locked
                  ? 'linear-gradient(145deg, rgba(248,250,252,0.96) 0%, rgba(241,245,249,0.98) 100%)'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,1) 100%)',
                border: field.locked
                  ? '1px solid rgba(148,163,184,0.16)'
                  : '1px solid rgba(129,140,248,0.14)',
              }}
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-400">
                {field.label}
              </div>
              <div
                className="mt-1.5 text-[14px] font-bold leading-6"
                style={{
                  color: field.locked ? '#64748b' : '#374151',
                }}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default ProfileSnapshotCard;
