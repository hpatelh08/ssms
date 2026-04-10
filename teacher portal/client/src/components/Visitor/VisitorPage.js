import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bus,
  CalendarDays,
  ChevronRight,
  Clock3,
  Globe,
  GraduationCap,
  Laptop,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  Microscope,
  Phone,
  School,
  Send,
  Sparkles,
  Trees,
  Users,
  Waves,
  BookOpen
} from 'lucide-react';

const quickCards = [
  {
    title: 'Admission Open',
    description: 'Check eligibility, age criteria, and application deadlines.',
    icon: GraduationCap,
    tone: 'from-amber-100 to-orange-50 text-amber-700',
    border: 'border-amber-100'
  },
  {
    title: 'School Facilities',
    description: 'Smart classrooms, labs, library, transport, and play areas.',
    icon: School,
    tone: 'from-sky-100 to-cyan-50 text-sky-700',
    border: 'border-sky-100'
  },
  {
    title: 'Academic Programs',
    description: 'Structured learning across primary and middle school levels.',
    icon: BookOpen,
    tone: 'from-emerald-100 to-green-50 text-emerald-700',
    border: 'border-emerald-100'
  },
  {
    title: 'School Updates',
    description: 'Stay updated with notices, celebrations, and school activities.',
    icon: Megaphone,
    tone: 'from-violet-100 to-fuchsia-50 text-violet-700',
    border: 'border-violet-100'
  },
  {
    title: 'Contact Information',
    description: 'Quick access to office hours, phone, email, and location.',
    icon: Phone,
    tone: 'from-rose-100 to-pink-50 text-rose-700',
    border: 'border-rose-100'
  },
  {
    title: 'Visitor Inquiry',
    description: 'Send a message and our team will respond as soon as possible.',
    icon: Mail,
    tone: 'from-indigo-100 to-blue-50 text-indigo-700',
    border: 'border-indigo-100'
  }
];

const facilities = [
  { name: 'Smart Classrooms', icon: Laptop, detail: 'Digital boards and interactive lessons.' },
  { name: 'Library', icon: BookOpen, detail: 'Quiet reading spaces with rich resources.' },
  { name: 'Computer Lab', icon: LayoutGrid, detail: 'Hands-on technology learning.' },
  { name: 'Playground', icon: Users, detail: 'Safe areas for sports and activities.' },
  { name: 'Science Lab', icon: Microscope, detail: 'Practical experiments and discovery.' },
  { name: 'Transport', icon: Bus, detail: 'Reliable school transport support.' }
];

const initialForm = {
  fullName: '',
  mobileNumber: '',
  email: '',
  purposeOfVisit: '',
  studentName: '',
  classInquiry: '',
  message: ''
};

const VisitorPage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const navLinks = useMemo(() => ([
    { label: 'About', href: '#about' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Inquiry', href: '#inquiry' },
    { label: 'Contact', href: '#contact' }
  ]), []);

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = 'Please enter your full name.';
    if (!/^[0-9]{10}$/.test(formData.mobileNumber.trim())) {
      nextErrors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formData.purposeOfVisit) nextErrors.purposeOfVisit = 'Select a purpose of visit.';
    if (!formData.message.trim()) nextErrors.message = 'Please add a short message.';
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitted(true);
    setFormData(initialForm);
  };

  const goToTeacherLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fdf2f8_0%,_#f8fafc_30%,_#eff6ff_58%,_#eefaf1_100%)] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200">
              <School className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">Smart School</p>
              <h1 className="text-lg font-extrabold text-slate-900">Visitor Page</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-3 py-2 transition hover:bg-sky-50 hover:text-sky-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 md:flex md:items-center md:gap-2">
              <Phone className="h-4 w-4 text-sky-600" />
              +91 98765 43210
            </div>
            <button
              type="button"
              onClick={goToTeacherLogin}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Admin / Teacher Login
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
          <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.10)]">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 sm:p-10 lg:p-12">
                <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />

                <div className="relative space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    Welcome to Our School
                  </div>

                  <div className="max-w-2xl space-y-4">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      A warm place to learn, grow, and explore.
                    </h2>
                    <p className="text-base leading-8 text-slate-600 sm:text-lg">
                      This visitor page helps parents, students, and guests discover school information,
                      admissions details, facilities, school updates, and contact options in one clean place.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#inquiry"
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700"
                    >
                      Apply for Admission
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-50"
                    >
                      Contact Us
                    </a>
                    <button
                      type="button"
                      onClick={goToTeacherLogin}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Admin / Teacher Login
                    </button>
                  </div>

                  <div className="grid gap-4 pt-4 sm:grid-cols-3">
                    {[
                      { value: '01', label: 'Admission Support' },
                      { value: '08', label: 'School Programs' },
                      { value: '24/7', label: 'Visitor Guidance' }
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-3xl border border-white/80 bg-white/70 p-4 shadow-sm">
                        <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 sm:p-10 lg:p-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Quick Access</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">Explore school info fast</h3>
                    <p className="text-slate-600">
                      Find admissions, timings, facilities, and visitor support without signing in.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {quickCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.title}
                          className={`group rounded-3xl border ${card.border} bg-gradient-to-br ${card.tone} p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900">{card.title}</h4>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-lg shadow-slate-100">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">About School</p>
              <h3 className="mt-3 text-3xl font-extrabold text-slate-900">Learning with care, discipline, and creativity.</h3>
              <p className="mt-4 leading-7 text-slate-600">
                Our school is built to support strong academics, personal growth, and confidence.
                We welcome new parents, students, and visitors who want clear information about
                our programs and campus life.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-sky-50 p-5">
                  <div className="text-sm font-bold text-sky-700">Mission</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    To create an inspiring environment that nurtures knowledge, values, and confidence.
                  </p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <div className="text-sm font-bold text-emerald-700">Vision</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    To shape responsible learners who excel academically and grow into kind citizens.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickCards.slice(0, 4).map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-slate-100 p-3">
                        <Icon className="h-5 w-5 text-slate-700" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="facilities" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Facilities</p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">Campus features visitors love</h3>
            </div>
            <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 md:flex">
              <Globe className="h-4 w-4 text-sky-600" />
              Modern, safe, and learner-friendly
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility, index) => {
              const Icon = facility.icon;
              return (
                <div
                  key={facility.name}
                  className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 text-sky-700 transition group-hover:scale-105">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
                  </div>
                  <h4 className="mt-5 text-xl font-bold text-slate-900">{facility.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{facility.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div id="inquiry" className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-lg shadow-slate-100">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Visitor Inquiry</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">Send us a message</h3>
                </div>
              </div>

              {submitted && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  Thank you. Your inquiry was submitted successfully.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                  {errors.fullName && <p className="mt-2 text-xs font-medium text-rose-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Mobile Number</label>
                  <input
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                  {errors.mobileNumber && <p className="mt-2 text-xs font-medium text-rose-600">{errors.mobileNumber}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                  {errors.email && <p className="mt-2 text-xs font-medium text-rose-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Purpose of Visit</label>
                  <select
                    name="purposeOfVisit"
                    value={formData.purposeOfVisit}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  >
                    <option value="">Select purpose</option>
                    <option value="admission">Admission inquiry</option>
                    <option value="information">General information</option>
                    <option value="meeting">Meet staff</option>
                    <option value="student-support">Student support</option>
                  </select>
                  {errors.purposeOfVisit && <p className="mt-2 text-xs font-medium text-rose-600">{errors.purposeOfVisit}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Student Name (Optional)</label>
                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="Student name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Class Inquiry (Optional)</label>
                  <input
                    name="classInquiry"
                    value={formData.classInquiry}
                    onChange={handleChange}
                    placeholder="Example: Std 2"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    rows="5"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                  {errors.message && <p className="mt-2 text-xs font-medium text-rose-600">{errors.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700"
                  >
                    Submit Inquiry
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div id="contact" className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-lg shadow-slate-100">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">School Information</p>
                <h3 className="mt-2 text-3xl font-extrabold text-slate-900">Everything visitors need</h3>

                <div className="mt-6 space-y-4 text-sm">
                  <InfoRow icon={Clock3} title="School Timing" value="8:30 AM - 2:30 PM" />
                  <InfoRow icon={CalendarDays} title="Office Timing" value="9:00 AM - 4:00 PM" />
                  <InfoRow icon={MapPin} title="Address" value="Smart School Campus, Main Road, City" />
                  <InfoRow icon={Mail} title="Email" value="info@smartschool.edu" />
                  <InfoRow icon={Phone} title="Phone" value="+91 98765 43210" />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-sky-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">Map Placeholder</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    Embed your school location map here for easy directions.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white">
                <School className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">Smart School</h4>
                <p className="text-sm text-slate-500">Visitor-friendly school information page</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              A professional school landing page for admissions, quick information, and visitor inquiries.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-bold uppercase tracking-[0.25em] text-slate-500">Quick Links</h5>
            <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
              <a href="#about" className="block transition hover:text-sky-700">About School</a>
              <a href="#facilities" className="block transition hover:text-sky-700">Facilities</a>
              <a href="#inquiry" className="block transition hover:text-sky-700">Inquiry Form</a>
              <button type="button" onClick={goToTeacherLogin} className="block transition hover:text-sky-700">
                Admin / Teacher Login
              </button>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-bold uppercase tracking-[0.25em] text-slate-500">Contact</h5>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>+91 98765 43210</p>
              <p>info@smartschool.edu</p>
              <p>Main Road, City, State</p>
            </div>
            <div className="mt-5 flex gap-3 text-slate-500">
              {[School, Globe, Users].map((Icon, index) => (
                <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition hover:bg-sky-50 hover:text-sky-700">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 px-4 py-4 text-center text-xs font-medium text-slate-500 sm:px-6 lg:px-8">
          © 2026 Smart School. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const InfoRow = ({ icon: Icon, title, value }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
    <div className="mt-0.5 rounded-xl bg-white p-2 text-sky-600 shadow-sm">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-slate-600">{value}</p>
    </div>
  </div>
);

export default VisitorPage;
