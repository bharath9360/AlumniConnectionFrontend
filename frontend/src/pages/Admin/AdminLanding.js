import React, { useState, useEffect, useCallback, useRef } from 'react';
import { landingService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiGlobe, FiEye, FiEyeOff, FiEdit2, FiTrash2, FiPlus,
  FiCheck, FiAlertTriangle, FiInfo, FiMove,
  FiChevronUp, FiChevronDown, FiSave, FiRefreshCw, FiX,
  FiToggleLeft, FiToggleRight,
} from 'react-icons/fi';

/* ── Toast ─────────────────────────────────────────────────── */
let _tid = 0;
const useToast = () => {
  const [toasts, set] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++_tid;
    set(t => [...t, { id, msg, type }]);
    setTimeout(() => set(t => t.filter(x => x.id !== id)), 4500);
  }, []);
  return { toasts, add };
};

/* ── Section type meta ──────────────────────────────────────── */
const SECTION_TYPES = [
  { value: 'hero',         label: 'Hero',            icon: '🏠', color: '#C8102E' },
  { value: 'features',     label: 'Features',        icon: '⭐', color: '#10b981' },
  { value: 'stats',        label: 'Stats',           icon: '📊', color: '#f59e0b' },
  { value: 'testimonials', label: 'Testimonials',    icon: '💬', color: '#8b5cf6' },
  { value: 'events',       label: 'Events Carousel', icon: '📅', color: '#ec4899' },
  { value: 'gallery',      label: 'Gallery',         icon: '🖼️', color: '#06b6d4' },
  { value: 'footer',       label: 'Footer',          icon: '🔗', color: '#3b82f6' },
  { value: 'custom',       label: 'Custom',          icon: '📄', color: '#888'    },
];
const typeOf = key => SECTION_TYPES.find(t => t.value === key) || SECTION_TYPES[SECTION_TYPES.length - 1];

/* ── Default new-field templates per section type ───────────── */
const DEFAULT_FIELDS = {
  hero:         [{ key: 'title', label: 'Headline', type: 'text', value: '' }, { key: 'subtitle', label: 'Sub-headline', type: 'textarea', value: '' }, { key: 'ctaText', label: 'CTA Button', type: 'text', value: 'Join Now' }, { key: 'ctaLink', label: 'CTA Link', type: 'url', value: '/register' }, { key: 'bgImage', label: 'Background Image URL', type: 'url', value: '' }],
  features:     [{ key: 'heading', label: 'Section Heading', type: 'text', value: '' }],
  stats:        [{ key: 'heading', label: 'Section Heading', type: 'text', value: '' }],
  testimonials: [{ key: 'heading', label: 'Section Heading', type: 'text', value: '' }],
  events:       [{ key: 'heading', label: 'Section Heading', type: 'text', value: 'Upcoming Events' }, { key: 'subtext', label: 'Sub-text', type: 'text', value: '' }],
  gallery:      [{ key: 'heading', label: 'Section Heading', type: 'text', value: 'Gallery Highlights' }],
  footer:       [{ key: 'tagline', label: 'Tagline', type: 'text', value: '' }, { key: 'copyright', label: 'Copyright', type: 'text', value: '' }, { key: 'email', label: 'Contact Email', type: 'text', value: '' }],
  custom:       [{ key: 'title', label: 'Title', type: 'text', value: '' }, { key: 'body', label: 'Body', type: 'textarea', value: '' }],
};

/* ── Default new-item field templates ───────────────────────── */
const DEFAULT_ITEM_FIELDS = {
  features:     [{ key: 'icon', label: 'Icon (emoji)', type: 'text', value: '⭐' }, { key: 'title', label: 'Title', type: 'text', value: '' }, { key: 'desc', label: 'Description', type: 'textarea', value: '' }],
  stats:        [{ key: 'value', label: 'Value', type: 'text', value: '' }, { key: 'label', label: 'Label', type: 'text', value: '' }],
  testimonials: [{ key: 'name', label: 'Name', type: 'text', value: '' }, { key: 'role', label: 'Role / Batch', type: 'text', value: '' }, { key: 'quote', label: 'Quote', type: 'textarea', value: '' }],
  events:       [{ key: 'tag', label: 'Tag (e.g. Webinar)', type: 'text', value: '' }, { key: 'title', label: 'Title', type: 'text', value: '' }, { key: 'bgColor', label: 'Card Color', type: 'color', value: '#a2d2ff' }, { key: 'date', label: 'Date', type: 'text', value: '' }, { key: 'venue', label: 'Venue', type: 'text', value: '' }, { key: 'time', label: 'Time', type: 'text', value: '' }, { key: 'desc', label: 'Description', type: 'textarea', value: '' }],
  gallery:      [{ key: 'title', label: 'Title', type: 'text', value: '' }, { key: 'color', label: 'Background Color', type: 'color', value: '#ffc8dd' }, { key: 'image', label: 'Image URL (optional)', type: 'url', value: '' }],
};

/* ── Utility: get field value ───────────────────────────────── */
const fv = (fields, key) => fields?.find(f => f.key === key)?.value || '';

/* ── Form field input ───────────────────────────────────────── */
const FieldInput = ({ field, onChange }) => {
  const base = { width: '100%', padding: '8px 11px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fafafa', boxSizing: 'border-box', transition: 'border-color 0.15s' };
  const focus = { borderColor: '#C8102E' };

  if (field.type === 'textarea') return (
    <textarea
      value={field.value}
      onChange={e => onChange({ ...field, value: e.target.value })}
      rows={3}
      style={{ ...base, resize: 'vertical', lineHeight: 1.5 }}
      onFocus={e => Object.assign(e.target.style, focus)}
      onBlur={e => (e.target.style.borderColor = '#e8e8e8')}
    />
  );
  if (field.type === 'color') return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="color" value={field.value || '#000000'} onChange={e => onChange({ ...field, value: e.target.value })} style={{ width: 38, height: 36, borderRadius: 8, border: '1px solid #e8e8e8', padding: 2, cursor: 'pointer' }} />
      <input value={field.value} onChange={e => onChange({ ...field, value: e.target.value })} style={{ ...base, flex: 1 }} onFocus={e => Object.assign(e.target.style, focus)} onBlur={e => (e.target.style.borderColor = '#e8e8e8')} />
    </div>
  );
  return (
    <input
      type={field.type === 'url' ? 'url' : 'text'}
      value={field.value}
      onChange={e => onChange({ ...field, value: e.target.value })}
      style={base}
      onFocus={e => Object.assign(e.target.style, focus)}
      onBlur={e => (e.target.style.borderColor = '#e8e8e8')}
    />
  );
};

/* ── Section editor panel ───────────────────────────────────── */
const SectionEditor = ({ section, onSave, onClose, saving }) => {
  const [fields, setFields] = useState(() => JSON.parse(JSON.stringify(section.fields || [])));
  const [items,  setItems]  = useState(() => JSON.parse(JSON.stringify(section.items  || [])));
  const [label,  setLabel]  = useState(section.label);
  const [icon,   setIcon]   = useState(section.icon || '📄');

  const updateField = (idx, updated) => setFields(f => f.map((ff, i) => i === idx ? updated : ff));
  const updateItemField = (itemIdx, fieldIdx, updated) => setItems(its => its.map((it, i) => i !== itemIdx ? it : { ...it, fields: it.fields.map((ff, j) => j === fieldIdx ? updated : ff) }));
  const removeItem = (itemIdx) => setItems(its => its.filter((_, i) => i !== itemIdx));

  const addField = () => setFields(f => [...f, { key: `field_${Date.now()}`, label: 'New Field', type: 'text', value: '' }]);

  const addItem = () => {
    const template = DEFAULT_ITEM_FIELDS[section.sectionType] || [{ key: 'value', label: 'Value', type: 'text', value: '' }];
    setItems(its => [...its, { _itemId: `new_${Date.now()}`, fields: JSON.parse(JSON.stringify(template)) }]);
  };

  const handleSave = () => onSave({ label, icon, fields, items });

  const type = typeOf(section.sectionType);
  const hasItems = ['features', 'stats', 'testimonials', 'events', 'gallery', 'custom'].includes(section.sectionType);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,30,0.55)', zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, background: `${type.color}08` }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${type.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>Edit: {section.label}</div>
            <div style={{ fontSize: 11.5, color: `${type.color}cc`, fontWeight: 600, textTransform: 'capitalize' }}>{section.sectionType} section</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666' }}>
            <FiX size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#666', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Section Label</label>
              <input value={label} onChange={e => setLabel(e.target.value)} style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fafafa', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#666', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Icon</label>
              <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} style={{ width: 60, padding: '8px 11px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontSize: 18, outline: 'none', textAlign: 'center', background: '#fafafa' }} />
            </div>
          </div>

          {/* Top-level fields */}
          {fields.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Section Fields</div>
              {fields.map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#555', flex: 1 }}>{f.label}</label>
                    <span style={{ fontSize: 10, color: '#bbb', background: '#f5f5f5', borderRadius: 4, padding: '1px 6px' }}>{f.type}</span>
                  </div>
                  <FieldInput field={f} onChange={updated => updateField(i, updated)} />
                </div>
              ))}
              <button onClick={addField} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#C8102E', background: 'rgba(200,16,46,0.06)', border: '1px dashed rgba(200,16,46,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
                <FiPlus size={12} /> Add Field
              </button>
            </div>
          )}

          {/* Items (cards/testimonials/stats) */}
          {hasItems && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Items ({items.length})
                </div>
                <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 700 }}>
                  <FiPlus size={12} /> Add Item
                </button>
              </div>
              {items.map((item, ii) => (
                <div key={item._itemId || ii} style={{ marginBottom: 12, padding: '14px 16px', background: '#fafafa', borderRadius: 12, border: '1.5px solid #f0f0f0', position: 'relative' }}>
                  <button onClick={() => removeItem(ii)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                    <FiX size={12} />
                  </button>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item {ii + 1}</div>
                  {(item.fields || []).map((f, fi) => (
                    <div key={fi} style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#666', marginBottom: 4 }}>{f.label}</label>
                      <FieldInput field={f} onChange={updated => updateItemField(ii, fi, updated)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafafa' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #e8e8e8', borderRadius: 10, background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#555' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#C8102E,#e8334a)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 700, boxShadow: '0 3px 12px rgba(200,16,46,0.35)' }}
          >
            {saving ? <ClipLoader size={13} color="#fff" /> : <FiSave size={13} />}
            {saving ? 'Saving…' : 'Save Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Create Section Modal ───────────────────────────────────── */
const CreateModal = ({ onCreate, onClose, creating }) => {
  const [sectionType, setType] = useState('custom');
  const [label, setLabel]      = useState('');
  const [icon,  setIcon]       = useState('📄');

  const selected = typeOf(sectionType);
  const handleCreate = () => {
    if (!label.trim()) return;
    onCreate({ sectionType, label: label.trim(), icon, fields: DEFAULT_FIELDS[sectionType] || [], items: [] });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,30,0.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #f0f0f0', fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>
          ➕ New Section
        </div>
        <div style={{ padding: '20px 22px' }}>
          {/* Type grid */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#666', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Section Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {SECTION_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setIcon(t.icon); }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 10, border: sectionType === t.value ? `2px solid ${t.color}` : '2px solid #f0f0f0', background: sectionType === t.value ? `${t.color}09` : '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sectionType === t.value ? t.color : '#666' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Label */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Label *</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={`e.g., ${selected.label}`}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fafafa' }}
              onKeyDown={e => e.key === 'Enter' && label.trim() && handleCreate()}
            />
          </div>
          {/* Icon */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Icon (emoji)</label>
            <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} style={{ width: 64, padding: '8px 11px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontSize: 20, outline: 'none', textAlign: 'center', background: '#fafafa' }} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1.5px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafafa' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', border: '1.5px solid #e8e8e8', borderRadius: 10, background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#555' }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!label.trim() || creating}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 10, background: !label.trim() || creating ? '#e0e0e0' : 'linear-gradient(135deg,#C8102E,#e8334a)', color: !label.trim() || creating ? '#aaa' : '#fff', fontSize: 13, cursor: label.trim() && !creating ? 'pointer' : 'not-allowed', fontWeight: 700 }}
          >
            {creating ? <ClipLoader size={13} color="#aaa" /> : <FiPlus size={13} />}
            {creating ? 'Creating…' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Live Preview ───────────────────────────────────────────── */
const LivePreview = ({ sections }) => {
  const visible = [...sections].filter(s => s.isVisible).sort((a, b) => a.order - b.order);
  const hero = visible.find(s => s.sectionType === 'hero');
  const stats = visible.find(s => s.sectionType === 'stats');
  const features = visible.find(s => s.sectionType === 'features');
  const testimonials = visible.find(s => s.sectionType === 'testimonials');
  const footer = visible.find(s => s.sectionType === 'footer');

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e0e0e0', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', background: '#fff' }}>
      {/* browser chrome */}
      <div style={{ background: '#f0f0f0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e0e0e0' }}>
        {['#ff5f57','#ffbd2e','#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 11.5, color: '#aaa', marginLeft: 8 }}>localhost:3000</div>
      </div>

      <div style={{ maxHeight: 580, overflowY: 'auto', fontSize: 13 }}>
        {/* Hero */}
        {hero && (
          <div style={{ background: `linear-gradient(135deg, ${fv(hero.fields,'bgColor') || '#0f0c1d'}, #1a1035 60%, #c84022)`, padding: '36px 32px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{fv(hero.fields,'title') || 'Hero Title'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 18, lineHeight: 1.6 }}>{fv(hero.fields,'subtitle') || 'Subtitle here'}</div>
            <div style={{ display: 'inline-block', background: '#fff', color: '#c84022', borderRadius: 8, padding: '9px 22px', fontWeight: 800, fontSize: 13 }}>
              {fv(hero.fields,'ctaText') || 'CTA'}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ background: '#f8f8ff', padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', marginBottom: 16 }}>{fv(stats.fields,'heading')}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              {(stats.items || []).map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#C8102E' }}>{fv(item.fields,'value')}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{fv(item.fields,'label')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {features && (
          <div style={{ padding: '24px 20px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', marginBottom: 16, textAlign: 'center' }}>{fv(features.fields,'heading')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
              {(features.items || []).map((item, i) => (
                <div key={i} style={{ background: '#f0f0ff', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{fv(item.fields,'icon')}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a2e', marginBottom: 4 }}>{fv(item.fields,'title')}</div>
                  <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{fv(item.fields,'desc')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials && (
          <div style={{ background: '#f8fff8', padding: '24px 20px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', marginBottom: 16, textAlign: 'center' }}>{fv(testimonials.fields,'heading')}</div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
              {(testimonials.items || []).map((item, i) => (
                <div key={i} style={{ minWidth: 200, background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #e8e8e8', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>"{fv(item.fields,'quote')}"</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a2e' }}>{fv(item.fields,'name')}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>{fv(item.fields,'role')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div style={{ background: '#0f0c1d', color: '#fff', padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{fv(footer.fields,'tagline')}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fv(footer.fields,'copyright')}</div>
          </div>
        )}

        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🌐</div>
            <div>No visible sections yet.</div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Section card (in CMS list) ─────────────────────────────── */
const SectionCard = ({ section, index, total, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, busy }) => {
  const type = typeOf(section.sectionType);
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${section.isVisible ? '#f0f0f0' : '#f5e5e5'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: section.isVisible ? 1 : 0.65, transition: 'all 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      {/* Drag handle area / order */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <button onClick={onMoveUp} disabled={index === 0 || busy} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#ddd' : '#888', padding: 2 }} title="Move up">
          <FiChevronUp size={15} />
        </button>
        <span style={{ fontSize: 11, color: '#ccc', fontWeight: 700, lineHeight: 1 }}>{index + 1}</span>
        <button onClick={onMoveDown} disabled={index === total - 1 || busy} style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'not-allowed' : 'pointer', color: index === total - 1 ? '#ddd' : '#888', padding: 2 }} title="Move down">
          <FiChevronDown size={15} />
        </button>
      </div>

      {/* Icon */}
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${type.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {section.icon || type.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1a1a2e', marginBottom: 2 }}>{section.label}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, background: `${type.color}12`, color: type.color, borderRadius: 6, padding: '1px 7px', fontWeight: 700, textTransform: 'capitalize' }}>{section.sectionType}</span>
          {section.items?.length > 0 && <span style={{ fontSize: 11, color: '#aaa' }}>{section.items.length} items</span>}
          {section.fields?.length > 0 && <span style={{ fontSize: 11, color: '#aaa' }}>{section.fields.length} fields</span>}
        </div>
      </div>

      {/* Visibility */}
      <button
        onClick={onToggle}
        disabled={busy}
        title={section.isVisible ? 'Hide section' : 'Show section'}
        style={{ background: section.isVisible ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${section.isVisible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: section.isVisible ? '#059669' : '#dc2626', fontWeight: 600 }}
      >
        {section.isVisible ? <FiEye size={13} /> : <FiEyeOff size={13} />}
        {section.isVisible ? 'Visible' : 'Hidden'}
      </button>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onEdit} disabled={busy} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(200,16,46,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8102E' }} title="Edit">
          <FiEdit2 size={14} />
        </button>
        <button onClick={onDelete} disabled={busy} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }} title="Delete">
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const AdminLanding = () => {
  const [sections,      setSections]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [editTarget,    setEditTarget]    = useState(null);   // section being edited
  const [showCreate,    setShowCreate]    = useState(false);
  const [savingKey,     setSavingKey]     = useState(null);   // sectionKey being saved
  const [creating,      setCreating]      = useState(false);
  const [busyKey,       setBusyKey]       = useState(null);   // key for toggle/delete/reorder
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [view,          setView]          = useState('editor'); // 'editor' | 'preview'
  const { toasts, add: toast } = useToast();

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  /* Fetch */
  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landingService.getAdminSections();
      setSections(res.data.data || []);
      setLastUpdated(res.data.updatedAt);
    } catch { toast('Failed to load CMS data.', 'error'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  /* Save section */
  const handleSaveSection = async (payload) => {
    setSavingKey(editTarget.sectionKey);
    try {
      await landingService.updateSection(editTarget.sectionKey, payload);
      toast('✅ Section saved!', 'success');
      const res = await landingService.getAdminSections();
      setSections(res.data.data || []);
      setLastUpdated(res.data.updatedAt);
      setEditTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed.', 'error');
    } finally { setSavingKey(null); }
  };

  /* Create section */
  const handleCreate = async (data) => {
    setCreating(true);
    try {
      await landingService.createSection(data);
      toast('✅ Section created!', 'success');
      await fetchSections();
      setShowCreate(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Create failed.', 'error');
    } finally { setCreating(false); }
  };

  /* Delete */
  const handleDelete = async (section) => {
    if (!window.confirm(`Delete "${section.label}"? This cannot be undone.`)) return;
    setBusyKey(section.sectionKey);
    try {
      await landingService.deleteSection(section.sectionKey);
      toast(`🗑️ "${section.label}" deleted.`, 'success');
      setSections(prev => prev.filter(s => s.sectionKey !== section.sectionKey));
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally { setBusyKey(null); }
  };

  /* Toggle visibility */
  const handleToggle = async (section) => {
    setBusyKey(section.sectionKey);
    try {
      const res = await landingService.toggleSection(section.sectionKey);
      const newVis = res.data.data?.isVisible;
      setSections(prev => prev.map(s => s.sectionKey === section.sectionKey ? { ...s, isVisible: newVis } : s));
      toast(`Section ${newVis ? 'shown ✅' : 'hidden 🔕'}`, 'success');
    } catch {
      toast('Toggle failed.', 'error');
    } finally { setBusyKey(null); }
  };

  /* Reorder (move up/down) */
  const handleMove = async (sectionKey, direction) => {
    const currentOrder = sorted.map(s => s.sectionKey);
    const idx = currentOrder.indexOf(sectionKey);
    if (direction === 'up'   && idx === 0)                    return;
    if (direction === 'down' && idx === currentOrder.length - 1) return;

    const newOrder = [...currentOrder];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    // Optimistic update
    setSections(prev => {
      const updated = [...prev];
      newOrder.forEach((key, i) => {
        const s = updated.find(u => u.sectionKey === key);
        if (s) s.order = i;
      });
      return updated;
    });

    try {
      await landingService.reorderSections(newOrder);
    } catch { toast('Reorder failed — refreshing.', 'error'); fetchSections(); }
  };

  /* ═══════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ────────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Landing Page CMS</div>
          <div className="ap-section-sub">
            Edit, reorder and toggle sections of the public landing page.
            {lastUpdated && <span style={{ marginLeft: 8, fontSize: 11, color: '#bbb' }}>Last saved: {new Date(lastUpdated).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 10, padding: 3, gap: 2 }}>
            {[['editor','⚙️ Editor'],['preview','👁 Preview']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: view === v ? '#fff' : 'transparent', fontWeight: 700, fontSize: 12.5, color: view === v ? '#C8102E' : '#888', cursor: 'pointer', boxShadow: view === v ? '0 1px 5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={fetchSections} disabled={loading} className="am-btn am-btn-ghost" style={{ fontSize: 12 }}>
            <FiRefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#C8102E,#e8334a)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 12px rgba(200,16,46,0.35)' }}>
            <FiPlus size={14} /> Add Section
          </button>
        </div>
      </div>

      {/* ── Main layout ───────────────────── */}
      {view === 'preview' ? (
        <LivePreview sections={sections} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
          {/* ─── Section list ───────────────── */}
          <div>
            {loading ? (
              <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><ClipLoader color="#C8102E" size={30} /></div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🌐</div>
                <div style={{ fontWeight: 700 }}>No sections yet.</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Click "Add Section" to get started.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((section, idx) => (
                  <SectionCard
                    key={section.sectionKey}
                    section={section}
                    index={idx}
                    total={sorted.length}
                    busy={busyKey === section.sectionKey || savingKey === section.sectionKey}
                    onEdit={() => setEditTarget(section)}
                    onDelete={() => handleDelete(section)}
                    onToggle={() => handleToggle(section)}
                    onMoveUp={() => handleMove(section.sectionKey, 'up')}
                    onMoveDown={() => handleMove(section.sectionKey, 'down')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ─── Live mini-preview sidebar ──── */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
              Live Preview
            </div>
            <LivePreview sections={sections} />

            {/* Stats */}
            <div style={{ marginTop: 14, background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '14px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Summary</div>
              {[
                { label: 'Total sections',   value: sections.length,                      color: '#C8102E' },
                { label: 'Visible',          value: sections.filter(s => s.isVisible).length,  color: '#10b981' },
                { label: 'Hidden',           value: sections.filter(s => !s.isVisible).length, color: '#ef4444' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <span style={{ fontSize: 12.5, color: '#666' }}>{r.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Editor modal ──────────────────── */}
      {editTarget && (
        <SectionEditor
          section={editTarget}
          saving={savingKey === editTarget.sectionKey}
          onSave={handleSaveSection}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* ── Create modal ──────────────────── */}
      {showCreate && (
        <CreateModal
          creating={creating}
          onCreate={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Toasts */}
      <div className="am-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`am-toast am-toast-${t.type}`}>
            {t.type === 'success' && <FiCheck size={15} />}
            {t.type === 'error'   && <FiAlertTriangle size={15} />}
            {t.type === 'info'    && <FiInfo size={15} />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLanding;
