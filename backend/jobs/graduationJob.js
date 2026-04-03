/**
 * graduationJob.js
 * ─────────────────────────────────────────────────────────────────
 * Reusable graduation promotion logic.
 *
 * Rule: if a student's `graduationYear` (number) <= current year
 *       → promote them to `alumni`, set status Active,
 *         send in-app notification + optional approval email.
 *
 * Called by:
 *   • node-cron daily scheduler in server.js
 *   • POST /api/admin/graduation/run  (manual trigger)
 *   • PUT  /api/admin/students/:id/promote  (single student)
 */

const User         = require('../models/User');
const Notification = require('../models/Notification');

let _emailService;
try { _emailService = require('../services/emailService'); } catch (_) {}

/**
 * Promote a single student document to alumni.
 * Mutates and saves the document — caller must pass a hydrated User doc.
 * @param {Document} student - Mongoose User document (role === 'student')
 * @returns {boolean} true on success
 */
async function promoteStudentToAlumni(student) {
  student.role   = 'alumni';
  student.status = 'Active';

  // Use graduation year as batch if batch is not set
  if (!student.batch || student.batch.trim() === '') {
    student.batch = student.graduationYear || String(new Date().getFullYear());
  }

  await student.save();

  // In-app notification
  await Notification.create({
    userId      : student._id,
    type        : 'role_changed',
    title       : '🎓 Congratulations! You\'ve graduated to Alumni!',
    description : `Welcome to the MAMCET Alumni network (Batch ${student.batch})! Your account is now fully active.`,
    icon        : '🎓',
  });

  // Approval email (non-fatal; swallow errors)
  try {
    if (_emailService?.sendApprovalEmail) {
      await _emailService.sendApprovalEmail(student.email, student.name);
    }
  } catch (_) { /* email failure is non-fatal */ }

  return true;
}

/**
 * Run the auto-graduation batch job.
 * Promotes all students whose graduationYear <= currentYear.
 * @returns {{ promoted: number, skipped: number, errors: string[] }}
 */
async function runGraduationJob() {
  const currentYear = new Date().getFullYear();
  const result = { promoted: 0, skipped: 0, errors: [] };

  console.log(`[GraduationJob] Running for year ${currentYear}…`);

  // Find all students who have a graduationYear set
  const candidates = await User.find({
    role: 'student',
    graduationYear: { $exists: true, $nin: ['', null] },
  }).select('_id name email graduationYear batch');

  console.log(`[GraduationJob] Candidates found: ${candidates.length}`);

  for (const student of candidates) {
    const gradYear = parseInt(student.graduationYear, 10);

    // Skip if the year is invalid OR the year is still in the future
    // (<= currentYear means: graduated this year or earlier → promote)
    if (isNaN(gradYear) || gradYear > currentYear) {
      result.skipped++;
      continue;
    }

    try {
      await promoteStudentToAlumni(student);
      result.promoted++;
      console.log(`[GraduationJob] ✅ Promoted: ${student.name} (${student.email}), grad year ${gradYear}`);
    } catch (err) {
      const msg = `${student.email}: ${err.message}`;
      result.errors.push(msg);
      console.error(`[GraduationJob] ❌ Error promoting ${student.email}:`, err.message);
    }
  }

  console.log(
    `[GraduationJob] Done — promoted: ${result.promoted}, skipped: ${result.skipped}, errors: ${result.errors.length}`
  );

  return result;
}

module.exports = { runGraduationJob, promoteStudentToAlumni };
