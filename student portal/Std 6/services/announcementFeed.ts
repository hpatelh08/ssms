export interface PortalAnnouncement {
  id: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
  author?: string;
  date?: string;
  createdAt?: string;
  recipientType?: string;
  recipientRole?: string;
  recipientClasses?: string[];
  recipientUsers?: string[];
  targetClassId?: string;
  pinned?: boolean;
}

function buildClassIds(grade: number) {
  const normalizedGrade = Number.isFinite(Number(grade)) ? String(parseInt(String(grade), 10)) : '';
  if (!normalizedGrade) return [];
  return ['A', 'B', 'C'].map(section => `admin-class-${normalizedGrade}-${String(section).trim().toUpperCase() || 'A'}`);
}

export async function loadStudentAnnouncements(grade: number, role: 'student' | 'parent' = 'student'): Promise<PortalAnnouncement[]> {
  const classIds = buildClassIds(grade);
  const response = await fetch(`${getTeacherBackendBaseUrl()}/api/communication/announcements?limit=100`);
  if (!response.ok) {
    throw new Error(`Failed to load announcements (${response.status})`);
  }

  const data = await response.json();
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.filter((announcement: PortalAnnouncement) => {
    const recipientClasses = Array.isArray(announcement.recipientClasses) ? announcement.recipientClasses.map(String) : [];
    const targetClassId = String(announcement.targetClassId || '');
    return recipientClasses.some(classId => classIds.includes(classId)) || classIds.includes(targetClassId);
  });
}
function getTeacherBackendBaseUrl() {
  return `${window.location.protocol}//${window.location.hostname}:5001`;
}
