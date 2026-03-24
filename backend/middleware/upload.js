const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Helper: Ensure directory exists ─────────────────────────
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// ─── Posts upload storage ─────────────────────────────────────
const postsDir = path.join(__dirname, '../uploads/posts');
ensureDir(postsDir);

const postStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, postsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// ─── Profile Pics upload storage ─────────────────────────────
const profilesDir = path.join(__dirname, '../uploads/profiles');
ensureDir(profilesDir);

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, profilesDir),
    filename: (req, file, cb) => {
        // Use userId in filename for easy identification & overwrite-style naming
        const userId = req.user?._id?.toString() || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// ─── Shared image-only file filter ───────────────────────────
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

// ─── Multer instances ────────────────────────────────────────
const postUpload = multer({
    storage: postStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    fileFilter: imageFilter
});

module.exports = { postUpload, profileUpload };
