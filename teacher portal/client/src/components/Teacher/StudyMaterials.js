import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, FileText, Upload, Download, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import { apiUrl } from '../../config/api';
import { matchesAssignedTeacherClass } from '../../teacherIdentity';
import { loadTeacherClasses } from '../../services/teacherBackendData';

const StudyMaterials = ({ currentUser }) => {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    materialType: 'pdf',
    file: null,
    externalLink: ''
  });

  const getLocalMaterialsKey = () => {
    const teacherKey = String(currentUser?.teacherId || currentUser?.email || currentUser?.name || 'default').trim();
    return `study-materials-local-${teacherKey || 'default'}`;
  };

  const saveLocalMaterials = (items) => {
    localStorage.setItem(getLocalMaterialsKey(), JSON.stringify(items));
  };

  const loadLocalMaterials = () => {
    try {
      const saved = localStorage.getItem(getLocalMaterialsKey());
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const isAuthFailure = (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error || error?.message || '').toLowerCase();
    return status === 401 || status === 403 || message.includes('invalid token') || message.includes('access denied');
  };

  useEffect(() => {
    fetchStudyMaterials();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.assignedClass) {
      // Find the class ID that matches the user's assigned class
      const classToSelect = classes.find((cls) => matchesAssignedTeacherClass(cls, currentUser));
      if (classToSelect) {
        setFormData(prev => ({
          ...prev,
          class: classToSelect._id
        }));
      }
    }
  }, [classes, currentUser]);

  useEffect(() => {
    const loadSubjectsForClass = async () => {
      if (!formData.class) {
        setSubjects([]);
        return;
      }

      const selectedClass = classes.find(c => c._id === formData.class);
      if (!selectedClass) {
        setSubjects([]);
        return;
      }

      try {
        const std = String(selectedClass.className || '').match(/\d+/)?.[0] || '';
        const section = String(selectedClass.section || '').trim().toUpperCase();
        if (std && section) {
          const response = await axios.get(apiUrl('/api/class/timetable'), {
            params: { std, section },
            timeout: 4000
          });
          const schedule = response?.data?.data?.schedule || {};
          const subjectSet = new Set();
          Object.values(schedule).forEach((slots) => {
            (slots || []).forEach((slot) => {
              if (slot?.isBreak || !slot?.subject) return;
              subjectSet.add(String(slot.subject).trim());
            });
          });
          const subjectList = Array.from(subjectSet)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ _id: name, subjectName: name }));
          if (subjectList.length) {
            setSubjects(subjectList);
            return;
          }
        }
      } catch {
        // Fall back to stored class subjects.
      }

      setSubjects(selectedClass.subjects || []);
    };

    loadSubjectsForClass();
  }, [formData.class, classes]);

  const [subjects, setSubjects] = useState([]);

  const getAcceptedFileTypes = () => {
    if (formData.materialType === 'pdf') return '.pdf,application/pdf';
    if (formData.materialType === 'video') return 'video/*';
    if (formData.materialType === 'image') return 'image/*';
    if (formData.materialType === 'document') {
      return '.doc,.docx,.ppt,.pptx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain';
    }
    return '*/*';
  };

  const fetchClasses = async () => {
    try {
      const loadedClasses = await loadTeacherClasses(currentUser);
      const assignedClasses = loadedClasses.filter((cls) => matchesAssignedTeacherClass(cls, currentUser));
      if (assignedClasses.length > 0) {
        setClasses(assignedClasses);
      } else {
        setClasses(loadedClasses);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchStudyMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(apiUrl('/api/teacher/study-materials'), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });
      const serverMaterials = Array.isArray(response.data.data) ? response.data.data : [];
      const localMaterials = loadLocalMaterials();
      setMaterials([...localMaterials, ...serverMaterials]);
    } catch (error) {
      console.error('Error fetching study materials:', error);
      if (isAuthFailure(error)) {
        localStorage.removeItem('token');
      }
      setMaterials(loadLocalMaterials());
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.materialType !== 'link' && !formData.file) {
      alert('Please select a file to upload');
      return;
    }
    if (formData.materialType === 'link' && !formData.externalLink) {
      alert('Please enter a URL for the link');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('class', formData.class);
      formDataToSend.append('materialType', formData.materialType);

      if (formData.materialType === 'link') {
        formDataToSend.append('url', formData.externalLink);
      } else {
        formDataToSend.append('file', formData.file);
      }

      await axios.post(apiUrl('/api/teacher/study-materials'), formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(formData.materialType === 'link' ? 'Link added successfully' : 'Study material uploaded successfully');

      setFormData({
        title: '',
        description: '',
        subject: '',
        class: '',
        materialType: 'pdf',
        file: null,
        externalLink: ''
      });
      setShowForm(false);
      fetchStudyMaterials();
      setUploading(false);
    } catch (error) {
      console.error('Error uploading study material:', error);
      const selectedClass = classes.find((cls) => cls._id === formData.class);
      const selectedSubject = subjects.find((subject) => subject._id === formData.subject);
      const canUseLocalFallback = !error?.response || error?.response?.status >= 500 || isAuthFailure(error);

      if (canUseLocalFallback) {
        if (isAuthFailure(error)) {
          localStorage.removeItem('token');
        }
        const localMaterial = {
          _id: `LOCAL_MATERIAL_${Date.now()}`,
          title: formData.title,
          description: formData.description,
          materialType: formData.materialType,
          class: {
            _id: selectedClass?._id || formData.class || '',
            className: selectedClass?.className || 'N/A',
            section: selectedClass?.section || 'N/A'
          },
          subject: {
            _id: selectedSubject?._id || formData.subject || '',
            subjectName: selectedSubject?.subjectName || 'N/A'
          },
          file: formData.file
            ? {
              originalName: formData.file.name,
              size: formData.file.size
            }
            : undefined,
          url: formData.materialType === 'link' ? formData.externalLink : '',
          downloadCount: 0,
          createdAt: new Date().toISOString(),
          isLocalFallback: true
        };

        const updatedLocalMaterials = [localMaterial, ...loadLocalMaterials()];
        saveLocalMaterials(updatedLocalMaterials);
        setMaterials((prev) => [localMaterial, ...prev]);
        setFormData({
          title: '',
          description: '',
          subject: '',
          class: '',
          materialType: 'pdf',
          file: null,
          externalLink: ''
        });
        setShowForm(false);
        setUploading(false);
        return;
      }

      const message = error?.response?.data?.error || 'Failed to upload study material';
      alert(message);
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this study material?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(apiUrl(`/api/teacher/study-materials/${id}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchStudyMaterials();
      } catch (error) {
        console.error('Error deleting study material:', error);
        if (isAuthFailure(error)) {
          localStorage.removeItem('token');
        }
        const localMaterials = loadLocalMaterials().filter((item) => item._id !== id);
        saveLocalMaterials(localMaterials);
        setMaterials((prev) => prev.filter((item) => item._id !== id));
      }
    }
  };

  const downloadFile = (filePath, fileName) => {
    // In a real application, this would trigger file download
    alert(`File would be downloaded: ${fileName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-soft border border-gray-100/80">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Study Materials</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Upload and organize study resources</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
        >
          <Upload className="h-4 w-4" />
          Upload Material
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Upload New Study Material</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Material title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Material Type *</label>
                <select
                  name="materialType"
                  value={formData.materialType}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.className} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.class}
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!formData.class ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Material description"
              />
            </div>

            {formData.materialType === 'link' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold text-blue-600">PASTE LINK HERE *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="url"
                    name="externalLink"
                    value={formData.externalLink}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 p-4 bg-blue-50/30 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    placeholder="https://example.com/resource"
                  />
                </div>
                <p className="text-xs text-gray-500 italic">E.g., YouTube video, Google Drive document, or any web resource.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.materialType ? formData.materialType.toUpperCase() : 'File'} *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  {formData.materialType === 'pdf' && <p className="text-gray-400 text-sm">Supports PDF format</p>}
                  {formData.materialType === 'video' && <p className="text-gray-400 text-sm">Supports MP4, MKV, AVI</p>}
                  {formData.materialType === 'image' && <p className="text-gray-400 text-sm">Supports JPG, PNG, GIF</p>}
                  {formData.materialType === 'document' && <p className="text-gray-400 text-sm">Supports DOC, DOCX, PPT, PPTX</p>}
                  {!formData.materialType && <p className="text-gray-400 text-sm">Supports all standard formats</p>}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={getAcceptedFileTypes()}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    {formData.materialType === 'pdf' ? 'Upload PDF' : `Select ${formData.materialType ? formData.materialType.toUpperCase() : 'File'}`}
                  </label>
                  {formData.file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className={`px-6 py-3 rounded-lg text-white font-medium ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {uploading ? 'Uploading...' : formData.materialType === 'link' ? 'Add Link' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Study Materials</h3>
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map(material => (
                <div key={material._id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{material.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {material.class?.className} - {material.class?.section}
                        </p>
                        <p className="text-sm text-gray-600">
                          {material.subject?.subjectName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {material.materialType}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => downloadFile(material.file?.path, material.file?.originalName)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {material.description && (
                    <p className="text-sm text-gray-600 mt-3">{material.description}</p>
                  )}
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {material.downloadCount} downloads
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No study materials found</p>
              <p className="text-gray-400 text-sm mt-2">Upload your first study material using the button above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyMaterials;
