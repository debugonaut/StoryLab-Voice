function validateStudentNode(data) {
  const errors = [];

  if (!data.prn || typeof data.prn !== 'string') {
    errors.push({ field: 'prn', message: 'PRN is mandatory and must be a string' });
  } else if (!/^[0-9]{12}$/.test(data.prn.trim())) {
    errors.push({ field: 'prn', message: 'PRN must consist of exactly 12 numeric digits (e.g. 202401100099)' });
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Student name is mandatory' });
  } else {
    const trimmed = data.name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      errors.push({ field: 'name', message: 'Name length must be between 2 and 80 characters' });
    }
    if (!/^[a-zA-Z\s.-]+$/.test(trimmed)) {
      errors.push({ field: 'name', message: 'Name contains invalid characters; only letters, spaces, and hyphens permitted' });
    }
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else if (!emailRegex.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'Invalid email address structure' });
  }

  const age = Number(data.age);
  if (data.age === undefined || data.age === null || Number.isNaN(age)) {
    errors.push({ field: 'age', message: 'Age must be a valid number' });
  } else if (!Number.isInteger(age) || age < 5 || age > 18) {
    errors.push({ field: 'age', message: 'Age must be an integer between 5 and 18 years' });
  }

  const validGrades = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  if (!data.grade || !validGrades.includes(data.grade)) {
    errors.push({
      field: 'grade',
      message: `Grade must be one of: ${validGrades.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? {
      prn: data.prn.trim(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      age,
      grade: data.grade,
      preferredLanguage: data.preferredLanguage || 'en-IN'
    } : null
  };
}

module.exports = {
  validateStudentNode
};
