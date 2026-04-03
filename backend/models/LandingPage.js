const mongoose = require('mongoose');

/* ─── Field schema for each content block inside a section ── */
const fieldSchema = new mongoose.Schema({
  key:   { type: String, required: true },   // e.g. 'title', 'subtitle', 'ctaText'
  label: { type: String, required: true },   // displayed in the editor
  type:  {
    type: String,
    enum: ['text', 'textarea', 'url', 'color', 'number'],
    default: 'text',
  },
  value: { type: String, default: '' },
}, { _id: false });

/* ─── Sub-item schema (e.g. a single testimonial / feature card) */
const itemSchema = new mongoose.Schema({
  _itemId: { type: String, required: true }, // stable client-side uuid
  fields: [fieldSchema],
}, { _id: false });

/* ─── A single CMS section ─────────────────────────────────── */
const sectionSchema = new mongoose.Schema({
  sectionKey:  { type: String, required: true, unique: true }, // e.g. 'hero', 'features'
  sectionType: {
    type: String,
    enum: ['hero', 'features', 'testimonials', 'stats', 'footer', 'events', 'gallery', 'custom'],
    default: 'custom',
  },
  label:        { type: String, required: true },
  icon:         { type: String, default: '📄' },
  order:        { type: Number, default: 0 },
  isVisible:    { type: Boolean, default: true },
  fields:       [fieldSchema],   // top-level fields
  items:        [itemSchema],    // repeatable sub-items (cards, testimonials…)
});

/* ─── One document per platform, stores all sections ───────── */
const landingPageSchema = new mongoose.Schema({
  _siteId:  { type: String, default: 'main', unique: true }, // singleton
  sections: [sectionSchema],
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Seed default sections if none exist
landingPageSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne({ _siteId: 'main' });
  if (doc) return doc;

  doc = await this.create({
    _siteId: 'main',
    sections: [
      {
        sectionKey: 'hero', sectionType: 'hero', label: 'Hero', icon: '🏠', order: 0, isVisible: true,
        fields: [
          { key: 'title',    label: 'Headline',       type: 'text',     value: 'Welcome to MAMCET Alumni Connect' },
          { key: 'subtitle', label: 'Sub-headline',   type: 'textarea', value: 'Bridging the gap between students, alumni, and opportunities.' },
          { key: 'ctaText',  label: 'CTA Button Text',type: 'text',     value: 'Join the Network' },
          { key: 'ctaLink',  label: 'CTA Link',       type: 'url',      value: '/register/alumni' },
          { key: 'bgImage',  label: 'Background Image URL', type: 'url', value: 'https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/alumni_linked_in_background_image_sgla6a.jpg' },
        ],
        items: [],
      },
      {
        sectionKey: 'features', sectionType: 'features', label: 'Features', icon: '⭐', order: 1, isVisible: true,
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', value: 'Everything you need to stay connected' },
        ],
        items: [
          { _itemId: 'f1', fields: [{ key: 'icon', label: 'Icon', type: 'text', value: '🤝' }, { key: 'title', label: 'Title', type: 'text', value: 'Connect with Alumni' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Build meaningful relationships with MAMCET graduates across the world.' }] },
          { _itemId: 'f2', fields: [{ key: 'icon', label: 'Icon', type: 'text', value: '💼' }, { key: 'title', label: 'Title', type: 'text', value: 'Job Opportunities' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Access exclusive job postings and referrals from your alumni network.' }] },
          { _itemId: 'f3', fields: [{ key: 'icon', label: 'Icon', type: 'text', value: '📅' }, { key: 'title', label: 'Title', type: 'text', value: 'Events & Reunions' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Stay up-to-date with alumni meets, webinars, and campus events.' }] },
        ],
      },
      {
        sectionKey: 'stats', sectionType: 'stats', label: 'Stats', icon: '📊', order: 2, isVisible: true,
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', value: 'Impact in Numbers' },
        ],
        items: [
          { _itemId: 's1', fields: [{ key: 'value', label: 'Value',  type: 'text', value: '5,000+' }, { key: 'label', label: 'Label', type: 'text', value: 'Alumni' }] },
          { _itemId: 's2', fields: [{ key: 'value', label: 'Value',  type: 'text', value: '200+'   }, { key: 'label', label: 'Label', type: 'text', value: 'Companies' }] },
          { _itemId: 's3', fields: [{ key: 'value', label: 'Value',  type: 'text', value: '50+'    }, { key: 'label', label: 'Label', type: 'text', value: 'Events/year' }] },
          { _itemId: 's4', fields: [{ key: 'value', label: 'Value',  type: 'text', value: '1,200+' }, { key: 'label', label: 'Label', type: 'text', value: 'Jobs Posted' }] },
        ],
      },
      {
        sectionKey: 'testimonials', sectionType: 'testimonials', label: 'Testimonials', icon: '💬', order: 3, isVisible: true,
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', value: 'What our alumni say' },
        ],
        items: [
          { _itemId: 't1', fields: [{ key: 'name', label: 'Name', type: 'text', value: 'Priya Sharma' }, { key: 'role', label: 'Role / Batch', type: 'text', value: 'Software Engineer, Google — Batch 2019' }, { key: 'quote', label: 'Quote', type: 'textarea', value: 'MAMCET Alumni Connect helped me land my dream job. The network is incredible!' }] },
          { _itemId: 't2', fields: [{ key: 'name', label: 'Name', type: 'text', value: 'Arun Kumar'   }, { key: 'role', label: 'Role / Batch', type: 'text', value: 'Entrepreneur — Batch 2017'               }, { key: 'quote', label: 'Quote', type: 'textarea', value: 'Great platform to stay in touch with my batchmates and give back to juniors.' }] },
        ],
      },
      {
        sectionKey: 'events', sectionType: 'events', label: 'Events Carousel', icon: '📅', order: 4, isVisible: true,
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', value: 'Upcoming Events' },
          { key: 'subtext', label: 'Sub-text', type: 'text', value: 'Click on an event card to see full details and RSVP.' },
        ],
        items: [
          { _itemId: 'e1', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Annual Meet' }, { key: 'title', label: 'Title', type: 'text', value: 'Alumni Network Night' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#a2d2ff' }, { key: 'date', label: 'Date', type: 'text', value: 'April 15, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'MAMCET Main Auditorium, Trichy' }, { key: 'time', label: 'Time', type: 'text', value: '6:00 PM – 9:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Reconnect with your batch mates and expand your professional circle at this exclusive Alumni Networking Night. Featuring keynote addresses from distinguished alumni and interactive breakout sessions.' }] },
          { _itemId: 'e2', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Annual Event' }, { key: 'title', label: 'Title', type: 'text', value: 'Annual Alumni Meet 2026' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#bde0fe' }, { key: 'date', label: 'Date', type: 'text', value: 'May 20, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'MAMCET Sports Complex, Trichy' }, { key: 'time', label: 'Time', type: 'text', value: '10:00 AM – 5:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'The biggest gathering of the year! Join us for a day of celebrations, cultural programs, sports activities, and memories that will last a lifetime.' }] },
          { _itemId: 'e3', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Career Fair' }, { key: 'title', label: 'Title', type: 'text', value: 'Campus Career Fair' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#ffafcc' }, { key: 'date', label: 'Date', type: 'text', value: 'June 5, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'MAMCET Seminar Hall' }, { key: 'time', label: 'Time', type: 'text', value: '9:00 AM – 4:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'Top companies recruiting directly from campus. Bring your resume, dress sharp, and walk in with confidence. Open to final-year students and young alumni.' }] },
          { _itemId: 'e4', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Webinar' }, { key: 'title', label: 'Title', type: 'text', value: 'Tech Talks: Future of AI' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#caffbf' }, { key: 'date', label: 'Date', type: 'text', value: 'March 28, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'Online (Zoom)' }, { key: 'time', label: 'Time', type: 'text', value: '3:00 PM – 5:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'An interactive webinar featuring leading AI researchers discussing the future landscape of technology, career opportunities, and research trends in AI & ML.' }] },
          { _itemId: 'e5', fields: [{ key: 'tag', label: 'Tag', type: 'text', value: 'Workshop' }, { key: 'title', label: 'Title', type: 'text', value: 'Full-Stack Bootcamp' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#ffd6a5' }, { key: 'date', label: 'Date', type: 'text', value: 'April 8, 2026' }, { key: 'venue', label: 'Venue', type: 'text', value: 'CS Lab, MAMCET' }, { key: 'time', label: 'Time', type: 'text', value: '9:00 AM – 1:00 PM' }, { key: 'desc', label: 'Description', type: 'textarea', value: 'A hands-on workshop covering React, Node.js, and MongoDB. Ideal for students looking to build their first full-stack project with production-level guidance.' }] },
        ],
      },
      {
        sectionKey: 'gallery', sectionType: 'gallery', label: 'Gallery', icon: '🖼️', order: 5, isVisible: true,
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', value: 'Gallery Highlights' },
        ],
        items: [
          { _itemId: 'g1', fields: [{ key: 'title', label: 'Title', type: 'text', value: "Festa'25" }, { key: 'color', label: 'Background Color', type: 'color', value: '#ffc8dd' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
          { _itemId: 'g2', fields: [{ key: 'title', label: 'Title', type: 'text', value: "Fest'24" }, { key: 'color', label: 'Background Color', type: 'color', value: '#cdb4db' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
          { _itemId: 'g3', fields: [{ key: 'title', label: 'Title', type: 'text', value: 'IEEE Event' }, { key: 'color', label: 'Background Color', type: 'color', value: '#bde0fe' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
          { _itemId: 'g4', fields: [{ key: 'title', label: 'Title', type: 'text', value: 'Symposium' }, { key: 'color', label: 'Background Color', type: 'color', value: '#a2d2ff' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }] },
        ],
      },
      {
        sectionKey: 'footer', sectionType: 'footer', label: 'Footer', icon: '🔗', order: 6, isVisible: true,
        fields: [
          { key: 'tagline',   label: 'Tagline',      type: 'text',     value: 'MAMCET Alumni Connect — Building bridges for life.' },
          { key: 'copyright', label: 'Copyright',    type: 'text',     value: '© 2026 MAMCET. All rights reserved.' },
          { key: 'email',     label: 'Contact Email',type: 'text',     value: 'alumni@mamcet.ac.in' },
          { key: 'phone',     label: 'Contact Phone',type: 'text',     value: '+91 98765 43210' },
        ],
        items: [],
      },
    ],
  });

  return doc;
};

module.exports = mongoose.model('LandingPage', landingPageSchema);
