/**
 * One-time migration: adds "events" and "gallery" sections + hero bgImage field
 * to the existing LandingPage document if they don't already exist.
 *
 * Run:  node scripts/migrate-landing-sections.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alumni';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const LandingPage = require('../models/LandingPage');
  const doc = await LandingPage.getOrCreate();

  let changed = false;

  // ─── Add bgImage field to hero if missing ──────────────
  const hero = doc.sections.find(s => s.sectionKey === 'hero');
  if (hero && !hero.fields.find(f => f.key === 'bgImage')) {
    hero.fields.push({
      key: 'bgImage',
      label: 'Background Image URL',
      type: 'url',
      value: 'https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/alumni_linked_in_background_image_sgla6a.jpg',
    });
    console.log('✅ Added bgImage field to Hero section');
    changed = true;
  }

  // ─── Add Events section if missing ─────────────────────
  if (!doc.sections.find(s => s.sectionKey === 'events')) {
    const maxOrder = doc.sections.reduce((m, s) => Math.max(m, s.order), -1);
    doc.sections.push({
      sectionKey: 'events', sectionType: 'events', label: 'Events Carousel', icon: '📅',
      order: maxOrder + 1, isVisible: true,
      fields: [
        { key: 'heading', label: 'Section Heading', type: 'text', value: 'Upcoming Events' },
        { key: 'subtext', label: 'Sub-text', type: 'text', value: 'Click on an event card to see full details and RSVP.' },
      ],
      items: [
        { _itemId: 'e1', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Annual Meet' }, { key: 'title', label: 'Title', type: 'text', value: 'Alumni Network Night' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#a2d2ff' }, { key: 'date', label: 'Date', type: 'text', value: 'April 15, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'MAMCET Main Auditorium, Trichy' }, { key: 'time', label: 'Time', type: 'text', value: '6:00 PM – 9:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Reconnect with your batch mates and expand your professional circle at this exclusive Alumni Networking Night.' }] },
        { _itemId: 'e2', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Annual Event' }, { key: 'title', label: 'Title', type: 'text', value: 'Annual Alumni Meet 2026' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#bde0fe' }, { key: 'date', label: 'Date', type: 'text', value: 'May 20, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'MAMCET Sports Complex, Trichy' }, { key: 'time', label: 'Time', type: 'text', value: '10:00 AM – 5:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'The biggest gathering of the year! Join us for a day of celebrations, cultural programs, sports activities, and memories.' }] },
        { _itemId: 'e3', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Career Fair' }, { key: 'title', label: 'Title', type: 'text', value: 'Campus Career Fair' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#ffafcc' }, { key: 'date', label: 'Date', type: 'text', value: 'June 5, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'MAMCET Seminar Hall' }, { key: 'time', label: 'Time', type: 'text', value: '9:00 AM – 4:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Top companies recruiting directly from campus. Bring your resume, dress sharp, and walk in with confidence.' }] },
        { _itemId: 'e4', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Webinar' }, { key: 'title', label: 'Title', type: 'text', value: 'Tech Talks: Future of AI' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#caffbf' }, { key: 'date', label: 'Date', type: 'text', value: 'March 28, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'Online (Zoom)' }, { key: 'time', label: 'Time', type: 'text', value: '3:00 PM – 5:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'An interactive webinar featuring leading AI researchers discussing the future landscape of technology.' }] },
        { _itemId: 'e5', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Workshop' }, { key: 'title', label: 'Title', type: 'text', value: 'Full-Stack Bootcamp' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#ffd6a5' }, { key: 'date', label: 'Date', type: 'text', value: 'April 8, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'CS Lab, MAMCET' }, { key: 'time', label: 'Time', type: 'text', value: '9:00 AM – 1:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'A hands-on workshop covering React, Node.js, and MongoDB. Ideal for students looking to build their first full-stack project.' }] },
      ],
    });
    console.log('✅ Added Events Carousel section');
    changed = true;
  }

  // ─── Add Gallery section if missing ────────────────────
  if (!doc.sections.find(s => s.sectionKey === 'gallery')) {
    const maxOrder = doc.sections.reduce((m, s) => Math.max(m, s.order), -1);
    doc.sections.push({
      sectionKey: 'gallery', sectionType: 'gallery', label: 'Gallery', icon: '🖼️',
      order: maxOrder + 1, isVisible: true,
      fields: [
        { key: 'heading', label: 'Section Heading', type: 'text', value: 'Gallery Highlights' },
      ],
      items: [
        { _itemId: 'g1', fields: [{ key: 'title', label: 'Title', type: 'text', value: "Festa'25" }, { key: 'color', label: 'Background Color', type: 'color', value: '#ffc8dd' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
        { _itemId: 'g2', fields: [{ key: 'title', label: 'Title', type: 'text', value: "Fest'24" }, { key: 'color', label: 'Background Color', type: 'color', value: '#cdb4db' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
        { _itemId: 'g3', fields: [{ key: 'title', label: 'Title', type: 'text', value: 'IEEE Event' }, { key: 'color', label: 'Background Color', type: 'color', value: '#bde0fe' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
        { _itemId: 'g4', fields: [{ key: 'title', label: 'Title', type: 'text', value: 'Symposium' }, { key: 'color', label: 'Background Color', type: 'color', value: '#a2d2ff' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
      ],
    });
    console.log('✅ Added Gallery section');
    changed = true;
  }

  if (changed) {
    doc.updatedAt = new Date();
    await doc.save();
    console.log('✅ Document saved successfully!');
  } else {
    console.log('ℹ️  No changes needed — sections already exist.');
  }

  await mongoose.disconnect();
  console.log('Disconnected.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
