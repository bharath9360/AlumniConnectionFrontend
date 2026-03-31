const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { profileUpload, bannerUpload, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// ─── PUT /api/users/upload-dp ─────────────────────────────────
// Upload / replace the logged-in user's profile picture
router.put(
    '/upload-dp',
    protect,
    profileUpload.single('profilePic'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image provided.' });
            }

            // Upload buffer to Cloudinary — profile_pictures folder
            // Auto crop to square, face detection, 400x400
            const url = await uploadToCloudinary(
                req.file.buffer,
                'alumni/profile_pictures',
                'image',
                {
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                }
            );

            const user = await User.findByIdAndUpdate(
                req.user._id,
                { profilePic: url },
                { new: true, select: '-password -secretKey' }
            );

            if (!user) return res.status(404).json({ message: 'User not found.' });

            res.json({
                success: true,
                message: 'Profile picture updated.',
                profilePic: url,
                user: user.toSafeObject ? user.toSafeObject() : user
            });
        } catch (err) {
            console.error('Upload DP error:', err);
            res.status(500).json({ message: err.message || 'Upload failed.' });
        }
    }
);

// ─── PUT /api/users/upload-banner ────────────────────────────
// Upload / replace the logged-in user's banner picture
router.put(
    '/upload-banner',
    protect,
    bannerUpload.single('bannerPic'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image provided.' });
            }

            // Upload to Cloudinary — banners folder, wide crop 1584x396 (LinkedIn ratio)
            const url = await uploadToCloudinary(
                req.file.buffer,
                'alumni/banners',
                'image',
                {
                    transformation: [
                        { width: 1584, height: 396, crop: 'fill', gravity: 'auto' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                }
            );

            const user = await User.findByIdAndUpdate(
                req.user._id,
                { bannerPic: url },
                { new: true, select: '-password -secretKey' }
            );

            if (!user) return res.status(404).json({ message: 'User not found.' });

            res.json({
                success: true,
                message: 'Banner updated.',
                bannerPic: url,
                user: user.toSafeObject ? user.toSafeObject() : user
            });
        } catch (err) {
            console.error('Upload Banner error:', err);
            res.status(500).json({ message: err.message || 'Upload failed.' });
        }
    }
);

// ─── PUT /api/users/update-profile ──────────────────────────
// Update the logged-in user's profile fields (text/arrays only)
router.put('/update-profile', protect, async (req, res) => {
    try {
        const updates = { ...req.body };
        // Strip sensitive / auth fields
        ['password', 'secretKey', 'otp', 'otpExpiry', 'role', 'status', 'email'].forEach(k => delete updates[k]);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true, select: '-password -secretKey -otp -otpExpiry' }
        );

        if (!user) return res.status(404).json({ message: 'User not found.' });

        res.json({
            success: true,
            message: 'Profile updated.',
            user
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: err.message || 'Failed to update profile.' });
    }
});

// ─── GET /api/users/:id ───────────────────────────────────────
// Fetch any user's public profile by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -secretKey -otp -otpExpiry');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user.' });
    }
});

module.exports = router;
