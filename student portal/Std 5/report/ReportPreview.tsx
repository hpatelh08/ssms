/**
 * ReportPreview.tsx
 * ─────────────────────────────────────────────────────
 * A4-styled, printable report card preview component.
 *
 * Design principles:
 *  • Minimal corporate styling — no playful elements
 *  • No animations, mascot, sound, or celebration
 *  • Clear section separation with ruled lines
 *  • Directly downloads as PDF without opening browser print dialog
 *  • All data sourced from deterministic useReportGenerator hook
 *  • Governance disclaimer on every page
 */

import React, { useCallback, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ReportCardData } from './useReportGenerator';
import './report-print.css';

/* ── Tier badge colours (inline — no external dependency) ── */

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Strong:           { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Active:           { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  Developing:       { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  Excellent:        { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Good:             { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Needs Attention': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Consistent:       { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Progressing:      { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Needs Support':  { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
};

function TierBadge({ tier }: { tier: string }) {
  const c = TIER_COLORS[tier] ?? { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 12px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {tier}
    </span>
  );
}

/* ── Section header ───────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#1e3a8a',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '2px solid #1e3a8a',
        paddingBottom: 4,
        marginBottom: 10,
        marginTop: 20,
      }}
    >
      {children}
    </h3>
  );
}

/* ── Inline table helper ──────────────────────────── */

function MetricRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <tr>
      <td style={{ padding: '4px 8px', fontSize: 12, color: '#374151' }}>{label}</td>
      <td
        style={{
          padding: '4px 8px',
          fontSize: 12,
          color: '#111827',
          fontWeight: bold ? 700 : 400,
          textAlign: 'right',
        }}
      >
        {value}
      </td>
    </tr>
  );
}

/* ── Props ─────────────────────────────────────────── */

export interface ReportPreviewProps {
  data: ReportCardData;
  onBack: () => void;
}

/* ── Component ─────────────────────────────────────── */

export const ReportPreview: React.FC<ReportPreviewProps> = ({ data, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    if (!printRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const pxPerMm = canvas.width / contentWidth;
      const pageCanvasHeight = Math.max(1, Math.floor(contentHeight * pxPerMm));

      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      if (!pageCtx) throw new Error('Could not initialize canvas context.');

      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );

        if (pageIndex > 0) doc.addPage();
        const imageData = pageCanvas.toDataURL('image/png');
        const imageHeightMm = sliceHeight / pxPerMm;
        doc.addImage(imageData, 'PNG', margin, margin, contentWidth, imageHeightMm, undefined, 'FAST');

        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

      const safeStudentName = data.studentName.replace(/[^a-zA-Z0-9_-]+/g, '_');
      const reportDate = new Date().toISOString().slice(0, 10);
      doc.save(`Report_Card_${safeStudentName}_${reportDate}.pdf`);
    } catch (error) {
      console.error('[ReportPreview] PDF download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [data.studentName, isDownloading]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 8px' }}>
      {/* ── Action bar ── */}
      <div className="report-actions" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#1e3a8a',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: isDownloading ? 'wait' : 'pointer',
            opacity: isDownloading ? 0.85 : 1,
          }}
        >
          {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* ── A4 Page ── */}
      <div ref={printRef} className="report-page">
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1e3a8a',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            Student Progress Report
          </h1>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
            Smart Study Companion — Standard {data.grade}
          </p>
          <hr
            style={{
              border: 'none',
              borderTop: '2px solid #1e3a8a',
              marginTop: 12,
            }}
          />
        </header>

        {/* Student Information */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#374151',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          <div>
            <strong>Name:</strong> {data.studentName}
          </div>
          <div>
            <strong>Grade:</strong> Standard {data.grade}
          </div>
          <div>
            <strong>Academic Year:</strong> {data.academicYear}
          </div>
          <div>
            <strong>Date:</strong> {data.generatedAt}
          </div>
        </div>

        {/* ── 1. Engagement Overview ── */}
        <SectionTitle>Engagement Overview</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <MetricRow label="Total XP Earned" value={data.xp} />
            <MetricRow label="Current Level" value={data.level} />
            <MetricRow label="Current Streak" value={`${data.streak} days`} />
            <MetricRow label="Badges Earned" value={data.badgeCount} />
            <MetricRow
              label="Engagement Level"
              value={<TierBadge tier={data.engagementTier} />}
              bold
            />
          </tbody>
        </table>

        {/* ── 2. Attendance ── */}
        <SectionTitle>Attendance Record</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <MetricRow label="Total School Days" value={data.attendance.totalSchoolDays} />
            <MetricRow label="Days Present" value={data.attendance.presentDays} />
            <MetricRow label="Days Absent" value={data.attendance.absentDays} />
            <MetricRow
              label="Attendance Percentage"
              value={`${Math.min(data.attendance.attendancePercentage, 100)}%`}
              bold
            />
            <MetricRow
              label="Attendance Status"
              value={<TierBadge tier={data.attendanceTier} />}
              bold
            />
          </tbody>
        </table>

        {/* ── 3. Homework ── */}
        <SectionTitle>Homework Completion</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <MetricRow label="Total Assignments" value={data.homeworkTotal} />
            <MetricRow label="Completed" value={data.homeworkCompleted} />
            <MetricRow
              label="Pending"
              value={data.homeworkTotal - data.homeworkCompleted}
            />
            <MetricRow
              label="Status"
              value={<TierBadge tier={data.homeworkTier} />}
              bold
            />
          </tbody>
        </table>

        {/* ── 4. Skills Assessment (Qualitative) ── */}
        <SectionTitle>Skills Assessment</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <MetricRow label="Reading" value={data.skills.reading} />
            <MetricRow label="Writing" value={data.skills.writing} />
            <MetricRow label="Participation" value={data.skills.participation} />
          </tbody>
        </table>
        <p
          style={{
            fontSize: 10,
            color: '#6b7280',
            fontStyle: 'italic',
            marginTop: 4,
          }}
        >
          Skills are assessed qualitatively based on teacher observation and activity behaviour.
          No numeric scoring is applied.
        </p>

        {/* ── 5. Badges ── */}
        {data.badgeCount > 0 && (
          <>
            <SectionTitle>Achievements</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.badgeNames.map((name) => (
                <span
                  key={name}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: '#fffbeb',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </>
        )}

        {/* ── 6. AI-Generated Feedback (template-based) ── */}
        <SectionTitle>Assessment Summary</SectionTitle>
        <div
          style={{
            fontSize: 12,
            color: '#374151',
            lineHeight: 1.7,
          }}
        >
          <p style={{ margin: '0 0 8px' }}>{data.aiFeedback.engagement}</p>
          <p style={{ margin: '0 0 8px' }}>{data.aiFeedback.attendance}</p>
          <p style={{ margin: '0 0 8px' }}>{data.aiFeedback.homework}</p>
          <p
            style={{
              margin: '12px 0 0',
              padding: '8px 12px',
              background: '#eff6ff',
              borderLeft: '3px solid #1e3a8a',
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            {data.aiFeedback.summary}
          </p>
        </div>

        {/* ── 7. Teacher Comment ── */}
        {data.teacherComment.trim() !== '' && (
          <>
            <SectionTitle>Teacher&apos;s Comment</SectionTitle>
            <div
              style={{
                fontSize: 12,
                color: '#374151',
                lineHeight: 1.7,
                padding: '8px 12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {data.teacherComment}
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <footer
          style={{
            marginTop: 28,
            borderTop: '1px solid #d1d5db',
            paddingTop: 10,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 9,
              color: '#9ca3af',
              fontStyle: 'italic',
              lineHeight: 1.6,
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            This report is generated from recorded activity data only. It does not rank,
            predict, or compare students. AI feedback is template-based and fully
            deterministic. All final academic decisions remain with human educators.
          </p>
          <p
            style={{
              fontSize: 9,
              color: '#9ca3af',
              marginTop: 8,
            }}
          >
            Smart Study Companion — SSMS Standard {data.grade} — {data.academicYear}
          </p>
        </footer>
      </div>
    </div>
  );
};

ReportPreview.displayName = 'ReportPreview';
