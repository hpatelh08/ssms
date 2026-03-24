  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Filter for classes 8, 9, 10
      const filteredClasses = response.data.data.filter(cls => 
        ['8', '9', '10'].includes(cls.className)
      );
      setClasses(filteredClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchExams();
      fetchStudentsInClass(selectedClass);
    }
  }, [selectedClass]);