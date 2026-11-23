const { validateStudentNode } = require('./nodeValidator');

const expressStudentValidator = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const result = validateStudentNode(req.body);
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        errorType: 'EXPRESS_VALIDATION_ERROR',
        message: 'Request payload failed server-side Express validation checks',
        errorCount: result.errors.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    }
    req.sanitizedBody = result.sanitized;
  }
  next();
};

const expressRecordValidator = (req, res, next) => {
  const { studentPrn, moduleName, subject, score, durationSeconds } = req.body;
  const errors = [];

  if (!studentPrn || !/^[0-9]{12}$/.test(String(studentPrn).trim())) {
    errors.push({ field: 'studentPrn', message: 'Valid 12-digit student PRN is required' });
  }

  const allowedModules = ['StoryLearn', 'LabInBox', 'VoiceTutor', 'Orientation'];
  if (!moduleName || !allowedModules.includes(moduleName)) {
    errors.push({ field: 'moduleName', message: `moduleName must be one of: ${allowedModules.join(', ')}` });
  }

  const allowedSubjects = ['Mathematics', 'Science', 'EVS', 'SocialStudies', 'General'];
  if (!subject || !allowedSubjects.includes(subject)) {
    errors.push({ field: 'subject', message: `subject must be one of: ${allowedSubjects.join(', ')}` });
  }

  const numScore = Number(score);
  if (score === undefined || Number.isNaN(numScore) || numScore < 0 || numScore > 100) {
    errors.push({ field: 'score', message: 'score must be a numeric value between 0 and 100' });
  }

  const numDuration = Number(durationSeconds);
  if (durationSeconds === undefined || Number.isNaN(numDuration) || numDuration < 1) {
    errors.push({ field: 'durationSeconds', message: 'durationSeconds must be greater than or equal to 1' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errorType: 'EXPRESS_RECORD_VALIDATION_ERROR',
      message: 'Learning record validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  expressStudentValidator,
  expressRecordValidator
};
