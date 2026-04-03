import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Visitor.css';

const QUICK_CARDS = [
  { title: 'Admission Open', description: 'Check eligibility, age criteria, and application deadlines.', icon: '🎓', tone: 'tone-admission', href: '#inquiry' },
  { title: 'School Facilities', description: 'Smart classrooms, labs, library, transport, and play areas.', icon: '🏫', tone: 'tone-facilities', href: '#facilities' },
  { title: 'Academic Programs', description: 'Structured learning across primary and middle school levels.', icon: '📚', tone: 'tone-academic', href: '#about' },
  { title: 'Events & News', description: 'Stay updated with notices, celebrations, and school activities.', icon: '📣', tone: 'tone-news', href: '#news' },
  { title: 'Contact Information', description: 'Quick access to office hours, phone, email, and location.', icon: '☎️', tone: 'tone-contact', href: '#contact' },
  { title: 'Visitor Inquiry', description: 'Send a message and our team will respond promptly.', icon: '✉️', tone: 'tone-inquiry', href: '#inquiry' },
];

const FACILITIES = [
  {
    name: 'Smart Classrooms',
    icon: '💻',
    detail: 'Interactive lessons and digital boards.',
    photos: [
      '/images_for_visitor_page/smart_classroom/1.jpg',
      '/images_for_visitor_page/smart_classroom/2.webp',
      '/images_for_visitor_page/smart_classroom/3.jpg',
      '/images_for_visitor_page/smart_classroom/4.jpg',
      '/images_for_visitor_page/smart_classroom/5.jpg',
      '/images_for_visitor_page/smart_classroom/6.jpg',
      '/images_for_visitor_page/smart_classroom/7.jpeg',
      '/images_for_visitor_page/smart_classroom/8.jpg',
    ],
  },
  {
    name: 'Library',
    icon: '📖',
    detail: 'Quiet reading spaces and rich resources.',
    photos: [
      '/images_for_visitor_page/library/1.jpg',
      '/images_for_visitor_page/library/2.jpg',
      '/images_for_visitor_page/library/3.webp',
      '/images_for_visitor_page/library/4.webp',
      '/images_for_visitor_page/library/5.jpg',
      '/images_for_visitor_page/library/6.jpg',
      '/images_for_visitor_page/library/7.jpg',
      '/images_for_visitor_page/library/8.jpg',
    ],
  },
  {
    name: 'Computer Lab',
    icon: '🖥️',
    detail: 'Hands-on digital learning experiences.',
    photos: [
      '/images_for_visitor_page/computer_lab/1.jpg',
      '/images_for_visitor_page/computer_lab/2.jpg',
      '/images_for_visitor_page/computer_lab/3.jpg',
      '/images_for_visitor_page/computer_lab/4.jpg',
      '/images_for_visitor_page/computer_lab/5.jpg',
      '/images_for_visitor_page/computer_lab/6.jpg',
      '/images_for_visitor_page/computer_lab/7.jpg',
      '/images_for_visitor_page/computer_lab/8.jpg',
    ],
  },
  {
    name: 'Playground',
    icon: '🏃',
    detail: 'Safe areas for sports and recreation.',
    photos: [
      '/images_for_visitor_page/play_ground/1.jpg',
      '/images_for_visitor_page/play_ground/2.jpg',
      '/images_for_visitor_page/play_ground/3.jpg',
      '/images_for_visitor_page/play_ground/4.jpg',
      '/images_for_visitor_page/play_ground/5.jpg',
      '/images_for_visitor_page/play_ground/6.jpg',
      '/images_for_visitor_page/play_ground/7.jpg',
      '/images_for_visitor_page/play_ground/8.jpg',
    ],
  },
  {
    name: 'Science Lab',
    icon: '🔬',
    detail: 'Practical experiments and discovery.',
    photos: [
      '/images_for_visitor_page/science_lab/1.jpg',
      '/images_for_visitor_page/science_lab/2.jpg',
      '/images_for_visitor_page/science_lab/3.jpg',
      '/images_for_visitor_page/science_lab/4.jpg',
      '/images_for_visitor_page/science_lab/5.jpg',
      '/images_for_visitor_page/science_lab/6.jpg',
      '/images_for_visitor_page/science_lab/7.jpg',
      '/images_for_visitor_page/science_lab/8.jpg',
    ],
  },
  {
    name: 'Transport',
    icon: '🚌',
    detail: 'Reliable school transport support.',
    photos: [
      '/images_for_visitor_page/transport/1.jpg',
      '/images_for_visitor_page/transport/2.jpg',
      '/images_for_visitor_page/transport/3.jpg',
      '/images_for_visitor_page/transport/4.jpg',
      '/images_for_visitor_page/transport/5.jpg',
      '/images_for_visitor_page/transport/6.jpg',
      '/images_for_visitor_page/transport/7.jpg',
      '/images_for_visitor_page/transport/8.jpg',
    ],
  },
];

const ANNOUNCEMENTS = [
  'Admission forms for the new session are now available.',
  'Exam and PTM schedules will be updated every week.',
  'Holiday notices and circulars are shared in advance.',
  'Annual day rehearsals and club activities are in progress.',
];

const INITIAL_FORM = {
  fullName: '',
  mobileNumber: '',
  email: '',
  purposeOfVisit: '',
  studentName: '',
  classInquiry: '',
  message: '',
};

const asset = (relativePath) => `${import.meta.env.BASE_URL}${String(relativePath).replace(/^\/+/, '')}`;
const VISITOR_INQUIRIES_KEY = 'ssms_visitor_inquiries';

function mapInquiryType(purpose) {
  const value = String(purpose || '').trim().toLowerCase();
  if (value === 'admission') return 'Admission';
  if (value === 'meeting') return 'Campus Visit';
  if (value === 'student-support') return 'Other';
  return 'General';
}

function buildInquiryMessage(formData) {
  const parts = [String(formData.message || '').trim()];
  if (formData.studentName?.trim()) parts.push(`Student Name: ${formData.studentName.trim()}`);
  if (formData.classInquiry?.trim()) parts.push(`Class Inquiry: ${formData.classInquiry.trim()}`);
  return parts.filter(Boolean).join('\n\n');
}

function saveLocalVisitorInquiry(record) {
  try {
    const saved = localStorage.getItem(VISITOR_INQUIRIES_KEY);
    const inquiries = saved ? JSON.parse(saved) : [];
    const list = Array.isArray(inquiries) ? inquiries : [];
    list.unshift(record);
    localStorage.setItem(VISITOR_INQUIRIES_KEY, JSON.stringify(list));
  } catch (_) {
    // Ignore local persistence failures; the form still behaves safely.
  }
}

export default function Visitor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFacility, setActiveFacility] = useState(null);
  const galleryRef = useRef(null);

  const navLinks = useMemo(() => ([
    { label: 'About', href: '#about' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Inquiry', href: '#inquiry' },
    { label: 'Contact', href: '#contact' },
  ]), []);

  const validate = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = 'Please enter your full name.';
    if (!/^[0-9]{10}$/.test(formData.mobileNumber.trim())) nextErrors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!formData.purposeOfVisit) nextErrors.purposeOfVisit = 'Select a purpose of visit.';
    if (!formData.message.trim()) nextErrors.message = 'Please add a short message.';

    return nextErrors;
  };

  const closeGallery = () => setActiveFacility(null);

  useEffect(() => {
    if (!activeFacility || !galleryRef.current) return;
    galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeFacility]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitted(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/visitor/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.mobileNumber.trim(),
          inquiry_type: mapInquiryType(formData.purposeOfVisit),
          message: buildInquiryMessage(formData),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const isMissingRoute = response.status === 404 || payload.error === 'API route not found';
        if (isMissingRoute) {
          saveLocalVisitorInquiry({
            id: `local-${Date.now()}`,
            full_name: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.mobileNumber.trim(),
            inquiry_type: mapInquiryType(formData.purposeOfVisit),
            message: buildInquiryMessage(formData),
            status: 'new',
            response: '',
            responded_at: '',
            visitor_username: '',
            created_at: new Date().toISOString(),
          });
          setSubmitted(true);
          setFormData(INITIAL_FORM);
          return;
        }
        throw new Error(payload.error || 'Unable to submit inquiry.');
      }

      setSubmitted(true);
      setFormData(INITIAL_FORM);
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('failed to fetch')) {
        saveLocalVisitorInquiry({
          id: `local-${Date.now()}`,
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.mobileNumber.trim(),
          inquiry_type: mapInquiryType(formData.purposeOfVisit),
          message: buildInquiryMessage(formData),
          status: 'new',
          response: '',
          responded_at: '',
          visitor_username: '',
          created_at: new Date().toISOString(),
        });
        setSubmitted(true);
        setFormData(INITIAL_FORM);
        return;
      }

      setSubmitted(false);
      setSubmitError(error?.message || 'Unable to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="visitor-page">
      <header className="visitor-header">
        <div className="visitor-header__inner">
          <div className="visitor-brand">
            <div className="visitor-brand__logo">🏫</div>
            <div>
              <p className="visitor-brand__eyebrow">Smart School</p>
              <h1 className="visitor-brand__title">Visitor Page</h1>
            </div>
          </div>

          <nav className="visitor-nav" aria-label="Visitor page navigation">
            {navLinks.map((item) => (
              <a key={item.label} href={item.href} className="visitor-nav__link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="visitor-header__actions">
            <div className="visitor-phone">
              <span className="visitor-small-glyph">📞</span>
              +91 98765 43210
            </div>
            <button type="button" className="visitor-login-btn" onClick={() => navigate('/login')}>
              Admin / Teacher Login
              <span className="visitor-arrow">→</span>
            </button>
          </div>
        </div>
      </header>

      <main className="visitor-main">
        <section className="visitor-hero">
          <div className="visitor-hero__inner">
            <div className="visitor-hero__left">
              <div className="visitor-pill">
                <span className="visitor-small-glyph">✨</span>
                Welcome to Our School
              </div>

              <h2>Learn, grow, and explore in a warm school community.</h2>
              <p>
                This visitor page helps parents, students, and guests quickly find admissions
                details, facilities, announcements, and school contact information.
              </p>

              <div className="visitor-hero__buttons">
                <a href="#inquiry" className="visitor-primary-btn">
                  Apply for Admission
                  <span className="visitor-arrow">→</span>
                </a>
                <a href="#contact" className="visitor-secondary-btn">
                  Contact Us
                </a>
                <button type="button" className="visitor-secondary-btn visitor-secondary-btn--dark" onClick={() => navigate('/login')}>
                  Admin / Teacher Login
                </button>
              </div>

              <div className="visitor-stats">
                <div className="visitor-stat">
                  <strong>01</strong>
                  <span>Admission Support</span>
                </div>
                <div className="visitor-stat">
                  <strong>08</strong>
                  <span>School Programs</span>
                </div>
                <div className="visitor-stat">
                  <strong>24/7</strong>
                  <span>Visitor Guidance</span>
                </div>
              </div>
            </div>

            <div className="visitor-hero__right">
              <div className="visitor-highlight-card">
                <div className="visitor-highlight-card__badge">
                  <span className="visitor-small-glyph">🌐</span>
                  Visitor-friendly
                </div>
                <h3>Everything in one place</h3>
                <ul>
                  <li><span className="visitor-check">✓</span> Admission information</li>
                  <li><span className="visitor-check">✓</span> School timings and contact</li>
                  <li><span className="visitor-check">✓</span> Facilities and announcements</li>
                  <li><span className="visitor-check">✓</span> Visitor inquiry form</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="visitor-section">
          <div className="visitor-section__inner">
            <div className="visitor-about-shell">
              <div className="visitor-about-label">
                <span>About</span>
                <span>School</span>
              </div>

              <div className="visitor-about-copy">
                <p className="visitor-section__eyebrow">About School</p>
                <h3>Learning with care, discipline, and creativity.</h3>
                <p>
                  Our school is built to support strong academics, personal growth, and confidence.
                  We welcome new parents, students, and visitors who want clear information about
                  programs, campus life, and admissions.
                </p>
              </div>

              <div className="visitor-about-mission">
                <div className="visitor-about-metric">
                  <span>Mission</span>
                  <p>To inspire knowledge, values, and confidence.</p>
                </div>
                <div className="visitor-about-metric">
                  <span>Vision</span>
                  <p>To shape responsible learners and kind citizens.</p>
                </div>
              </div>

              <div className="visitor-about-list">
                {QUICK_CARDS.slice(0, 4).map((card) => (
                  <a key={card.title} className={`visitor-about-tile visitor-about-tile--link ${card.tone}`} href={card.href}>
                    <span className="visitor-small-glyph">{card.icon}</span>
                    <div>
                      <h4>{card.title}</h4>
                      <p>{card.description}</p>
                    </div>
                    <span className="visitor-about-tile__chevron" aria-hidden="true">›</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="visitor-section">
          <div className="visitor-section__inner">
            <div className="visitor-section__head">
              <div>
                <p className="visitor-section__eyebrow">Quick Information</p>
                <h3>Important school details visitors ask for first</h3>
              </div>
            </div>

            <div className="visitor-quick-grid">
              {QUICK_CARDS.map((card) => (
                <article key={card.title} className="visitor-quick-card">
                  <div className={`visitor-quick-card__icon ${card.tone}`}>
                    <span className="visitor-glyph">{card.icon}</span>
                  </div>
                  <h4>{card.title}</h4>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="visitor-section">
          <div className="visitor-section__inner visitor-contact-grid">
            <div id="inquiry" className="visitor-form-card">
              <div className="visitor-section__head visitor-section__head--compact">
                <div>
                  <p className="visitor-section__eyebrow">Visitor Inquiry</p>
                  <h3>Send your question to the school office</h3>
                </div>
                <span className="visitor-small-glyph">✉️</span>
              </div>

              {submitted && (
                <div className="visitor-success">
                  Your inquiry was submitted successfully. Our team will contact you soon.
                </div>
              )}

              {submitError && (
                <div className="visitor-field__error" style={{ marginBottom: '12px', display: 'block' }}>
                  {submitError}
                </div>
              )}

              <form className="visitor-form" onSubmit={handleSubmit}>
                <div className="visitor-form__grid">
                  <Field label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" error={errors.fullName} />
                  <Field label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="10-digit mobile number" error={errors.mobileNumber} />
                  <Field label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" error={errors.email} />

                  <div className="visitor-field">
                    <label>Purpose of Visit</label>
                    <select name="purposeOfVisit" value={formData.purposeOfVisit} onChange={handleChange}>
                      <option value="">Select purpose</option>
                      <option value="admission">Admission inquiry</option>
                      <option value="information">General information</option>
                      <option value="meeting">Meet staff</option>
                      <option value="student-support">Student support</option>
                    </select>
                    {errors.purposeOfVisit && <span className="visitor-field__error">{errors.purposeOfVisit}</span>}
                  </div>

                  <Field label="Student Name (Optional)" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Student name" />
                  <Field label="Class Inquiry (Optional)" name="classInquiry" value={formData.classInquiry} onChange={handleChange} placeholder="Example: Std 2" />

                  <div className="visitor-field visitor-field--full">
                    <label>Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your message here..."
                      rows="5"
                    />
                    {errors.message && <span className="visitor-field__error">{errors.message}</span>}
                  </div>
                </div>

                <button type="submit" className="visitor-submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                  <span className="visitor-arrow">→</span>
                </button>
              </form>
            </div>

            <div className="visitor-side-column">
              <div id="contact" className="visitor-info-card">
                <p className="visitor-section__eyebrow">School Information</p>
                <h3>Everything visitors need</h3>
                <div className="visitor-info-list">
                  <InfoRow icon="🕒" label="School Timing" value="8:30 AM - 2:30 PM" />
                  <InfoRow icon="📅" label="Office Timing" value="9:00 AM - 4:00 PM" />
                  <InfoRow icon="📍" label="Address" value="Smart School Campus, Main Road, City" />
                  <InfoRow icon="✉️" label="Email" value="info@smartschool.edu" />
                  <InfoRow icon="📞" label="Phone" value="+91 98765 43210" />
                </div>

                <div className="visitor-map-placeholder">
                  <span className="visitor-glyph">📍</span>
                  <strong>Map Placeholder</strong>
                  <span>Embed your school location map here.</span>
                </div>
              </div>

              <div id="news" className="visitor-news-card">
                <p className="visitor-section__eyebrow visitor-section__eyebrow--light">Latest News</p>
                <h3>Announcements</h3>
                <div className="visitor-news-list">
                  {ANNOUNCEMENTS.map((item) => (
                    <div key={item} className="visitor-news-item">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="facilities" className="visitor-section visitor-section--tight">
          <div className="visitor-section__inner">
            <div className="visitor-section__head">
              <div>
                <p className="visitor-section__eyebrow">Facilities</p>
                <h3>Campus features visitors love</h3>
              </div>
              <div className="visitor-section__note">
                <span className="visitor-small-glyph">🌿</span>
                Modern, safe, and learner-friendly
              </div>
            </div>

            <div className="visitor-facility-grid">
              {FACILITIES.map((facility, index) => (
                <button
                  key={facility.name}
                  type="button"
                  className="visitor-facility-card visitor-facility-card--button"
                  onClick={() => setActiveFacility(facility)}
                >
                  <div className="visitor-facility-card__top">
                    <div className="visitor-facility-card__icon">
                      <span className="visitor-glyph">{facility.icon}</span>
                    </div>
                    <span>0{index + 1}</span>
                  </div>
                  <h4>{facility.name}</h4>
                  <p>{facility.detail}</p>
                  <span className="visitor-facility-card__cta">View photos</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeFacility && (
          <section ref={galleryRef} className="visitor-section visitor-section--gallery">
            <div className="visitor-section__inner">
              <div className="visitor-gallery-shell">
                <div className="visitor-gallery-shell__head">
                  <div>
                    <p className="visitor-section__eyebrow">School Gallery</p>
                    <h3>{activeFacility.name}</h3>
                  </div>
                  <button type="button" className="visitor-gallery-close" onClick={closeGallery} aria-label="Close gallery">
                    ×
                  </button>
                </div>

                <p className="visitor-gallery-modal__text">
                  {activeFacility.detail} These are the photos from your local visitor folder.
                </p>

                <div className="visitor-gallery-grid">
                  {activeFacility.photos.slice(0, 8).map((photo, index) => (
                    <figure key={`${activeFacility.name}-${index}`} className="visitor-gallery-card">
                      <img src={asset(photo)} alt={`${activeFacility.name} photo ${index + 1}`} loading="lazy" />
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="visitor-footer">
        <div className="visitor-footer__inner">
          <div>
            <div className="visitor-brand visitor-brand--footer">
              <div className="visitor-brand__logo">🏫</div>
              <div>
                <p className="visitor-brand__eyebrow">Smart School</p>
                <h2 className="visitor-brand__title">Visitor Page</h2>
              </div>
            </div>
            <p className="visitor-footer__text">
              A professional school landing page for admissions, quick information, and visitor inquiries.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <a href="#about">About School</a>
            <a href="#facilities">Facilities</a>
            <a href="#inquiry">Inquiry Form</a>
            <button type="button" onClick={() => navigate('/login')}>Admin / Teacher Login</button>
          </div>

          <div>
            <h4>Contact</h4>
            <p>+91 98765 43210</p>
            <p>info@smartschool.edu</p>
            <p>Main Road, City, State</p>
          </div>
        </div>
        <div className="visitor-footer__bottom">© 2026 Smart School. All rights reserved.</div>
      </footer>
    </div>
  );
}

function Field({ label, error, ...props }) {
  return (
    <div className="visitor-field">
      <label>{label}</label>
      <input {...props} />
      {error && <span className="visitor-field__error">{error}</span>}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="visitor-info-row">
      <div className="visitor-info-row__icon">
        <span className="visitor-small-glyph">{icon}</span>
      </div>
      <div>
        <strong>{label}</strong>
        <p>{value}</p>
      </div>
    </div>
  );
}
