const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const {
  protect,
  authorize
} = require('../middleware/auth');

// All staff routes require login + staff or admin role
const asyncHandler = require("../middleware/asyncHandler");
router.use(protect);
router.use(authorize('staff', 'admin'));

// ─── GET /api/staff/students ──────────────────────────────────
// Filtered student + alumni list for coordinator monitoring.
// Query params: dept (string), year (string), status ('Active'|'Inactive')
router.get('/students', asyncHandler(async (req, res, next) => {
  const {
    dept,
    year,
    status
  } = req.query;
  const filter = {
    role: {
      $in: ['student', 'alumni']
    }
  };
  if (dept && dept !== 'all') filter.department = new RegExp(dept, 'i');
  if (year && year !== 'all') filter.batch = year;
  if (status && status !== 'all') filter.status = status;
  const students = await User.find(filter).select('name email department batch role status profilePic designation lastLogin createdAt').sort({
    createdAt: -1
  }).limit(200);

  // Attach post counts efficiently
  const studentIds = students.map(s => s._id);
  const postCounts = await Post.aggregate([{
    $match: {
      userId: {
        $in: studentIds
      }
    }
  }, {
    $group: {
      _id: '$userId',
      count: {
        $sum: 1
      }
    }
  }]);
  const countMap = {};
  postCounts.forEach(p => {
    countMap[p._id.toString()] = p.count;
  });
  const result = students.map(s => ({
    _id: s._id,
    name: s.name,
    email: s.email,
    department: s.department || '—',
    batch: s.batch || '—',
    role: s.role,
    status: s.status,
    profilePic: s.profilePic,
    designation: s.designation,
    lastLogin: s.lastLogin,
    createdAt: s.createdAt,
    postCount: countMap[s._id.toString()] || 0
  }));
  res.json({
    success: true,
    data: result,
    total: result.length
  });
}));

// ─── GET /api/staff/analytics ────────────────────────────────
// Aggregate data for dashboard charts:
//  - Students per department (bar chart)
//  - Active vs Inactive users (pie chart)
//  - Total posts / month
router.get('/analytics', asyncHandler(async (req, res, next) => {
  // 1. Students per department
  const deptStats = await User.aggregate([{
    $match: {
      role: {
        $in: ['student', 'alumni']
      }
    }
  }, {
    $group: {
      _id: '$department',
      count: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      count: -1
    }
  }, {
    $limit: 12
  }]);

  // 2. Active vs Inactive
  const activeCount = await User.countDocuments({
    role: {
      $in: ['student', 'alumni']
    },
    status: 'Active'
  });
  const inactiveCount = await User.countDocuments({
    role: {
      $in: ['student', 'alumni']
    },
    status: 'Pending'
  });

  // 3. Posts per month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const postsPerMonth = await Post.aggregate([{
    $match: {
      createdAt: {
        $gte: sixMonthsAgo
      }
    }
  }, {
    $group: {
      _id: {
        year: {
          $year: '$createdAt'
        },
        month: {
          $month: '$createdAt'
        }
      },
      count: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1
    }
  }]);

  // 4. User growth (last 6 months)
  const userGrowth = await User.aggregate([{
    $match: {
      role: {
        $in: ['student', 'alumni']
      },
      createdAt: {
        $gte: sixMonthsAgo
      }
    }
  }, {
    $group: {
      _id: {
        year: {
          $year: '$createdAt'
        },
        month: {
          $month: '$createdAt'
        }
      },
      count: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1
    }
  }]);

  // 5. Summary totals
  const totalStudents = await User.countDocuments({
    role: 'student'
  });
  const totalAlumni = await User.countDocuments({
    role: 'alumni'
  });
  const totalPosts = await Post.countDocuments();
  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatMonthly = arr => arr.map(d => ({
    month: `${MONTH_NAMES[d._id.month]} ${d._id.year}`,
    count: d.count
  }));
  res.json({
    success: true,
    data: {
      deptStats: deptStats.map(d => ({
        dept: d._id || 'Unknown',
        count: d.count
      })),
      activeUsers: activeCount,
      inactiveUsers: inactiveCount,
      postsPerMonth: formatMonthly(postsPerMonth),
      userGrowth: formatMonthly(userGrowth),
      totals: {
        students: totalStudents,
        alumni: totalAlumni,
        posts: totalPosts
      }
    }
  });
}));

// ─── GET /api/staff/job-report ────────────────────────────────
// Placement and job engagement summary
router.get('/job-report', asyncHandler(async (req, res, next) => {
  const totalJobs = await Job.countDocuments();
  const approvedJobs = await Job.countDocuments({
    status: 'approved'
  });
  const pendingJobs = await Job.countDocuments({
    status: 'pending'
  });

  // Jobs with most applicants
  const topJobs = await Job.find({
    status: 'approved'
  }).select('title company applicants createdAt').sort({
    'applicants.length': -1
  }).limit(10);

  // Total unique applicants across all jobs
  const jobsWithApplicants = await Job.find({}).select('applicants');
  const allApplicantIds = new Set();
  jobsWithApplicants.forEach(j => (j.applicants || []).forEach(id => allApplicantIds.add(id.toString())));
  const totalApplicants = allApplicantIds.size;

  // Jobs posted per month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const jobsPerMonth = await Job.aggregate([{
    $match: {
      createdAt: {
        $gte: sixMonthsAgo
      }
    }
  }, {
    $group: {
      _id: {
        year: {
          $year: '$createdAt'
        },
        month: {
          $month: '$createdAt'
        }
      },
      count: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      '_id.year': 1,
      '_id.month': 1
    }
  }]);
  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  res.json({
    success: true,
    data: {
      totalJobs,
      approvedJobs,
      pendingJobs,
      totalApplicants,
      topJobs: topJobs.map(j => ({
        _id: j._id,
        title: j.title,
        company: j.company,
        applicants: j.applicants?.length || 0,
        postedAt: j.createdAt
      })),
      jobsPerMonth: jobsPerMonth.map(d => ({
        month: `${MONTH_NAMES[d._id.month]} ${d._id.year}`,
        count: d.count
      }))
    }
  });
}));
module.exports = router;