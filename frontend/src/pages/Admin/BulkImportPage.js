import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { studentAdminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiUploadCloud, FiDownload, FiX, FiCheck, FiChevronRight,
  FiChevronLeft, FiAlertTriangle,
  FiAlertCircle, FiRefreshCw, FiFileText, FiEye,
  FiArrowRight, FiCheckCircle,
} from 'react-icons/fi';

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 'configure', label: 'Configure',    icon: '⚙️' },
  { id: 'upload',    label: 'Upload File',  icon: '📤' },
  { id: 'preview',   label: 'Preview',      icon: '👁️' },
  { id: 'import',    label: 'Import',       icon: '✅' },
];

const STUDENT_COLS = ['Name','Email','Department','Year (Join)','Graduation Year','Roll Number','Phone','Gender'];
const ALUMNI_COLS  = ['Name','Email','Department','Year (Pass-Out)','Company','Designation','Phone','Gender'];
const STAFF_COLS   = ['Name','Email','Department','Staff Role','Phone','Gender'];

/* ── Download template helper ────────────────────────────────── */
const downloadTemplate = (type) => {
  const cols = type === 'student' ? STUDENT_COLS : type === 'alumni' ? ALUMNI_COLS : STAFF_COLS;
  const sample = {
    student: [
      ['Aarav Kumar','aarav.cse22@mamcet.com','CSE','2022','2026','22CSE001','+919876543210','Male'],
      ['Priya Nair','priya.ece22@mamcet.com','ECE','2022','2026','22ECE002','+919876543211','Female'],
    ],
    alumni: [
      ['Karthik Raj','karthik.cse18@gmail.com','CSE','2022','Zoho Corp','Software Engineer','+919123456789','Male'],
      ['Divya Mehta','divya.ece18@gmail.com','ECE','2022','TCS','QA Engineer','+919234567890','Female'],
    ],
    staff: [
      ['Dr. Ramesh Kumar','ramesh.principal@mamcet.com','Administration','Principal','+919988776655','Male'],
      ['Prof. Sheela Devi','sheela.cse@mamcet.com','CSE','HOD','+919977665544','Female'],
    ],
  }[type];

  const ws = XLSX.utils.aoa_to_sheet([cols, ...sample]);
  ws['!cols'] = cols.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1) + 's');
  XLSX.writeFile(wb, `${type}_import_template.xlsx`);
};

/* ── Colour theme per type ───────────────────────────────────── */
const theme = (type) => ({
  accent: type === 'student' ? '#6366f1' : type === 'alumni' ? '#14b8a6' : '#f59e0b',
  bg:     type === 'student' ? 'rgba(99,102,241,0.08)'  : type === 'alumni' ? 'rgba(20,184,166,0.08)'  : 'rgba(245,158,11,0.08)',
  border: type === 'student' ? 'rgba(99,102,241,0.2)'   : type === 'alumni' ? 'rgba(20,184,166,0.2)'   : 'rgba(245,158,11,0.2)',
});

/* ══════════════════════════════════════════════════════════════
   STEP INDICATOR
══════════════════════════════════════════════════════════════ */
const StepBar = ({ steps, current }) => (
  <div style={{ display:'flex', alignItems:'center', marginBottom:36 }}>
    {steps.map((s, i) => {
      const done    = i < current;
      const active  = i === current;
      const color   = done ? '#10b981' : active ? '#6366f1' : '#ccc';
      return (
        <React.Fragment key={s.id}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:'none' }}>
            <div style={{
              width:38, height:38, borderRadius:'50%',
              background: done ? '#10b981' : active ? '#6366f1' : '#f3f4f6',
              border: `2px solid ${color}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16,
              transition:'all 0.25s',
              boxShadow: active ? `0 0 0 4px ${color}22` : 'none',
            }}>
              {done
                ? <FiCheck size={17} color="#fff" />
                : <span style={{ fontSize:15, lineHeight:1 }}>{s.icon}</span>}
            </div>
            <div style={{
              marginTop:6, fontSize:11.5, fontWeight: active ? 700 : 500,
              color: active ? '#6366f1' : done ? '#10b981' : '#aaa',
              whiteSpace:'nowrap',
            }}>
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex:1, height:2, margin:'0 8px', marginBottom:20,
              background: done ? '#10b981' : '#e5e7eb',
              transition:'background 0.3s',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   STEP 0 — CONFIGURE (type selector)
══════════════════════════════════════════════════════════════ */
const StepConfigure = ({ type, setType, onNext }) => {
  return (
    <div>
      <h3 style={{ fontSize:17, fontWeight:800, color:'#1a1a2e', marginBottom:6 }}>
        What are you importing?
      </h3>
      <p style={{ fontSize:13.5, color:'#888', marginBottom:28 }}>
        Choose the record type to apply the correct field mapping and defaults.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32, maxWidth:520 }}>
        {[
          {
            value:'student', icon:'🎒', label:'Students',
            desc:'Active enrolled students. Sets role = student.',
            accent:'#6366f1', bg:'rgba(99,102,241,0.07)',
          },
          {
            value:'alumni', icon:'🎓', label:'Alumni',
            desc:'Graduated alumni. Sets role = alumni.',
            accent:'#14b8a6', bg:'rgba(20,184,166,0.07)',
          },
          {
            value:'staff', icon:'🏫', label:'Staff / Faculty',
            desc:'Principals, HODs & Professors. Sets role = staff.',
            accent:'#f59e0b', bg:'rgba(245,158,11,0.07)',
          },
        ].map(opt => (
          <div
            key={opt.value}
            onClick={() => setType(opt.value)}
            style={{
              padding:20, borderRadius:14, cursor:'pointer',
              border: `2px solid ${type===opt.value ? opt.accent : '#e8e8e8'}`,
              background: type===opt.value ? opt.bg : '#fff',
              transition:'all 0.15s',
              position:'relative',
            }}
          >
            {type===opt.value && (
              <div style={{
                position:'absolute', top:10, right:12,
                width:20, height:20, borderRadius:'50%',
                background:opt.accent, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <FiCheck size={12} color="#fff" />
              </div>
            )}
            <div style={{ fontSize:28, marginBottom:10 }}>{opt.icon}</div>
            <div style={{ fontWeight:700, fontSize:15, color:'#1a1a2e', marginBottom:5 }}>{opt.label}</div>
            <div style={{ fontSize:12.5, color:'#888', lineHeight:1.5 }}>{opt.desc}</div>
          </div>
        ))}
      </div>

      {/* Column guide */}
      <div style={{
        background:'#f8f9ff', border:'1px solid #e8eaf6',
        borderRadius:12, padding:'16px 20px', marginBottom:28, maxWidth:520,
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#555', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          Expected Columns — {type === 'student' ? 'Students' : type === 'alumni' ? 'Alumni' : 'Staff'}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(type==='student' ? STUDENT_COLS : type==='alumni' ? ALUMNI_COLS : STAFF_COLS).map((col, i) => (
            <span key={col} style={{
              background: i < 2 ? '#6366f115' : '#f3f4f6',
              border:     i < 2 ? '1px solid #6366f140' : '1px solid #e8e8e8',
              color:      i < 2 ? '#6366f1'             : '#555',
              borderRadius:20, padding:'3px 10px', fontSize:11.5, fontWeight:600,
            }}>
              {col} {i < 2 ? '*' : ''}
            </span>
          ))}
        </div>
        <div style={{ fontSize:11, color:'#aaa', marginTop:8 }}>
          * = required · Extra columns are ignored · Column names are case-insensitive
        </div>
        <div style={{ fontSize:11.5, color:'#059669', marginTop:8, fontWeight:600 }}>
          📧 Login credentials will be emailed to every successfully imported user.
        </div>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'#fff', border:'1.5px solid #e8e8e8',
            borderRadius:10, padding:'9px 16px', cursor:'pointer',
            fontSize:13, color:'#555', fontWeight:600,
          }}
          onClick={() => downloadTemplate(type)}
        >
          <FiDownload size={14} /> Download Template
        </button>
        <button
          className="am-btn am-btn-primary"
          onClick={onNext}
          style={{ background: theme(type).accent }}
        >
          Continue <FiChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   STEP 1 — UPLOAD FILE
══════════════════════════════════════════════════════════════ */
const StepUpload = ({ type, file, setFile, onNext, onBack, parsing, parseError }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const t = theme(type);

  const handleFile = (f) => {
    if (!f) return;
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      alert('Only .xlsx, .xls, or .csv files are supported.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5 MB limit.');
      return;
    }
    setFile(f);
  };

  return (
    <div>
      <h3 style={{ fontSize:17, fontWeight:800, color:'#1a1a2e', marginBottom:6 }}>
        Upload Your File
      </h3>
      <p style={{ fontSize:13.5, color:'#888', marginBottom:28 }}>
        Drag & drop or browse for a <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> file (max 5 MB).
      </p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2.5px dashed ${file ? t.accent : dragOver ? t.accent : '#ddd'}`,
          borderRadius:16,
          padding: '52px 24px',
          textAlign:'center',
          cursor:'pointer',
          background: file ? t.bg : dragOver ? `${t.accent}08` : '#fafafa',
          transition:'all 0.2s',
          marginBottom:22,
          maxWidth:560,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display:'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {file ? (
          <>
            <div style={{
              fontSize:44, marginBottom:12,
              animation:'none',
            }}>📊</div>
            <div style={{ fontSize:15.5, fontWeight:700, color:'#1a1a2e', marginBottom:4 }}>
              {file.name}
            </div>
            <div style={{ fontSize:12.5, color:'#888' }}>
              {(file.size / 1024).toFixed(1)} KB · click to change file
            </div>
          </>
        ) : (
          <>
            <FiUploadCloud size={44} color={dragOver ? t.accent : '#ccc'} style={{ marginBottom:12 }} />
            <div style={{ fontSize:15, fontWeight:700, color:'#555', marginBottom:6 }}>
              {dragOver ? 'Release to upload' : 'Drop file here or click to browse'}
            </div>
            <div style={{ fontSize:12.5, color:'#aaa' }}>
              Supports .xlsx · .xls · .csv
            </div>
          </>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div style={{
          display:'flex', alignItems:'flex-start', gap:10,
          background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)',
          borderRadius:10, padding:'12px 16px', marginBottom:16,
          color:'#dc2626', fontSize:13,
        }}>
          <FiAlertTriangle size={16} style={{ flexShrink:0, marginTop:1 }} />
          <div>{parseError}</div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <button className="am-btn am-btn-ghost" onClick={onBack}>
          <FiChevronLeft size={14} /> Back
        </button>
        <button
          className="am-btn am-btn-primary"
          onClick={onNext}
          disabled={!file || parsing}
          style={{ background: t.accent }}
        >
          {parsing
            ? <><ClipLoader size={14} color="#fff" /> Parsing…</>
            : <>Preview Data <FiChevronRight size={14} /></>}
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   STEP 2 — PREVIEW & VALIDATE
══════════════════════════════════════════════════════════════ */
const StepPreview = ({ type, rows, onNext, onBack, importing }) => {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const t = theme(type);

  if (!rows || rows.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'40px 0' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
        <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', marginBottom:6 }}>No rows found</div>
        <div style={{ fontSize:13, color:'#aaa' }}>The file appears to be empty. Try a different file.</div>
        <button className="am-btn am-btn-ghost" onClick={onBack} style={{ marginTop:20 }}>
          ← Back
        </button>
      </div>
    );
  }

  const valid   = rows.filter(r => r._valid);
  const invalid = rows.filter(r => !r._valid);
  const display = showOnlyErrors ? invalid : rows;

  const isStudent = type === 'student';

  return (
    <div>
      <h3 style={{ fontSize:17, fontWeight:800, color:'#1a1a2e', marginBottom:6 }}>
        Preview & Validate
      </h3>
      <p style={{ fontSize:13.5, color:'#888', marginBottom:20 }}>
        Review the parsed data before importing. Rows with errors will be skipped.
      </p>

      {/* Summary chips */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:7,
          background:'#f3f4f6', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#555',
        }}>
          <FiFileText size={14} color="#6366f1" />
          {rows.length} rows total
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap:7,
          background:'rgba(16,185,129,0.1)', borderRadius:10, padding:'8px 16px',
          fontSize:13, fontWeight:600, color:'#059669',
        }}>
          <FiCheckCircle size={14} />
          {valid.length} valid
        </div>
        {invalid.length > 0 && (
          <div style={{
            display:'flex', alignItems:'center', gap:7,
            background:'rgba(239,68,68,0.1)', borderRadius:10, padding:'8px 16px',
            fontSize:13, fontWeight:600, color:'#dc2626',
          }}>
            <FiAlertCircle size={14} />
            {invalid.length} with errors
          </div>
        )}
      </div>

      {/* Error toggle */}
      {invalid.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555', width:'fit-content' }}>
            <input
              type="checkbox"
              className="am-checkbox"
              checked={showOnlyErrors}
              onChange={e => setShowOnlyErrors(e.target.checked)}
            />
            Show only rows with errors ({invalid.length})
          </label>
        </div>
      )}

      {/* Preview table */}
      <div style={{
        border:'1.5px solid #efefef', borderRadius:14, overflow:'hidden',
        boxShadow:'0 2px 8px rgba(0,0,0,0.04)', marginBottom:24,
        maxHeight:350, overflowY:'auto',
      }}>
        <table className="am-table" style={{ minWidth: isStudent ? 860 : 820 }}>
          <thead>
            <tr>
              <th style={{ width:40 }}>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Dept</th>
              <th>{isStudent ? 'Join Year' : 'Pass-Out'}</th>
              {isStudent && <th>Grad. Year</th>}
              {isStudent && <th>Roll No.</th>}
              {!isStudent && <th>Company</th>}
              {!isStudent && <th>Designation</th>}
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {display.map((row, i) => (
              <tr
                key={i}
                style={{ background: row._valid ? 'inherit' : 'rgba(239,68,68,0.04)' }}
              >
                <td style={{ color:'#bbb', fontSize:12 }}>{row._row}</td>
                {/* Name */}
                <td>
                  {row.name
                    ? <span style={{ fontWeight:600, color:'#1a1a2e' }}>{row.name}</span>
                    : <span style={{ color:'#ef4444', fontStyle:'italic' }}>missing</span>}
                </td>
                {/* Email */}
                <td>
                  {row._errors?.some(e => e.toLowerCase().includes('email'))
                    ? <span style={{ color:'#ef4444', fontSize:12 }}>{row.email || 'missing'}</span>
                    : <span style={{ color:'#555', fontSize:12.5 }}>{row.email || '—'}</span>}
                </td>
                <td>
                  {row.department
                    ? <span style={{ background:'rgba(99,102,241,0.08)', color:'#6366f1', borderRadius:6, padding:'1px 6px', fontSize:11.5, fontWeight:600 }}>
                        {row.department}
                      </span>
                    : <span style={{ color:'#bbb' }}>—</span>}
                </td>
                <td style={{ fontWeight:600, color:'#333' }}>{row.year || '—'}</td>
                {isStudent && <td style={{ color:'#059669', fontWeight:600 }}>{row.graduationYear || '—'}</td>}
                {isStudent && <td style={{ fontFamily:'monospace', fontSize:12, background:'#f5f5f5', borderRadius:4, padding:'1px 5px' }}>{row.rollNumber || '—'}</td>}
                {!isStudent && <td style={{ color:'#444' }}>{row.company || '—'}</td>}
                {!isStudent && <td style={{ color:'#666', fontSize:12 }}>{row.designation || '—'}</td>}
                <td style={{ color:'#888', fontSize:12 }}>{row.phone || '—'}</td>
                {/* Validation badge */}
                <td>
                  {row._valid ? (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(16,185,129,0.1)', color:'#059669', borderRadius:20, padding:'2px 9px', fontSize:11.5, fontWeight:700 }}>
                      <FiCheck size={11} /> Valid
                    </span>
                  ) : (
                    <span
                      title={row._errors?.join('; ')}
                      style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(239,68,68,0.1)', color:'#dc2626', borderRadius:20, padding:'2px 9px', fontSize:11.5, fontWeight:700, cursor:'help' }}
                    >
                      <FiX size={11} /> {row._errors?.[0] || 'Error'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warning if some rows invalid */}
      {invalid.length > 0 && (
        <div style={{
          display:'flex', gap:10, background:'rgba(245,158,11,0.07)',
          border:'1px solid rgba(245,158,11,0.25)',
          borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#92400e',
        }}>
          <FiAlertTriangle size={16} style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <strong>{invalid.length} row{invalid.length>1?'s':''} have validation errors</strong> and will be
            skipped during import. {valid.length > 0
              ? `${valid.length} valid row${valid.length>1?'s':''} will be imported.`
              : 'No rows will be imported.'}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10 }}>
        <button className="am-btn am-btn-ghost" onClick={onBack} disabled={importing}>
          <FiChevronLeft size={14} /> Back
        </button>
        <button
          className="am-btn am-btn-primary"
          onClick={onNext}
          disabled={valid.length === 0 || importing}
          style={{ background: t.accent }}
        >
          {importing
            ? <><ClipLoader size={14} color="#fff" /> Importing…</>
            : <>Import {valid.length} row{valid.length !== 1 ? 's' : ''} <FiArrowRight size={14} /></>}
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   STEP 3 — RESULTS
══════════════════════════════════════════════════════════════ */
const StepResults = ({ type, result, onReset }) => {
  const t = theme(type);
  if (!result) return null;

  const { created=0, skipped=0, errors=[] } = result.results || {};
  const success = created > 0 && errors.length === 0;
  const partial = created > 0 && errors.length > 0;

  return (
    <div>
      {/* Hero Result */}
      <div style={{
        textAlign:'center',
        padding:'32px 24px 24px',
        background: success ? 'rgba(16,185,129,0.05)' : partial ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)',
        borderRadius:16,
        border: `1.5px solid ${success ? 'rgba(16,185,129,0.2)' : partial ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
        marginBottom:24,
      }}>
        <div style={{ fontSize:52, marginBottom:12 }}>
          {success ? '🎉' : partial ? '⚠️' : '❌'}
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:'#1a1a2e', marginBottom:6 }}>
          {success ? 'Import successful!'
            : partial ? 'Partially imported'
            : 'Import failed'}
        </div>
        <div style={{ fontSize:14, color:'#888' }}>
          {result.message}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Created',      value:created,          color:'#059669', bg:'rgba(16,185,129,0.08)',  icon:'✅' },
          { label:'Skipped',      value:skipped,          color:'#d97706', bg:'rgba(245,158,11,0.08)',  icon:'⏭️' },
          { label:'Errors',       value:errors.length,    color:'#dc2626', bg:'rgba(239,68,68,0.08)',   icon:'❌' },
          { label:'Emails Sent',  value:result.emailStats?.sent ?? '—',
                                                          color:'#6366f1', bg:'rgba(99,102,241,0.08)',  icon:'📧' },
        ].map(s => (
          <div key={s.label} style={{
            background:s.bg, borderRadius:12, padding:'18px 16px', textAlign:'center',
          }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#888', fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Error detail */}
      {errors.length > 0 && (
        <div style={{
          background:'#fff', border:'1.5px solid #efefef',
          borderRadius:14, overflow:'hidden', marginBottom:24,
          boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding:'12px 18px', background:'#fafafa', borderBottom:'1px solid #f0f0f0',
            fontWeight:700, fontSize:13, color:'#1a1a2e' }}>
            Error Details ({errors.length})
          </div>
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {errors.map((e, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between',
                padding:'10px 18px', borderBottom:'1px solid #f8f8f8', fontSize:13,
              }}>
                <span style={{ color:'#333', fontWeight:500 }}>{e.row}</span>
                <span style={{ color:'#dc2626', fontSize:12 }}>{e.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button
          className="am-btn am-btn-primary"
          onClick={onReset}
          style={{ background: t.accent }}
        >
          <FiRefreshCw size={14} /> Import More
        </button>
        <a
          href={type==='student' ? '/admin/students' : type==='alumni' ? '/admin/alumni' : '/admin/approvals'}
          className="am-btn am-btn-ghost"
          style={{ textDecoration:'none' }}
        >
          <FiEye size={14} /> View {type==='student' ? 'Students' : type==='alumni' ? 'Alumni' : 'Staff Approvals'}
        </a>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
const BulkImportPage = () => {
  const [stepIdx,  setStepIdx]  = useState(0);
  const [type,     setType]     = useState('student');
  const [file,     setFile]     = useState(null);
  const [rows,     setRows]     = useState([]);
  const [parsing,  setParsing]  = useState(false);
  const [parseError, setParseError] = useState('');
  const [importing,setImporting]= useState(false);
  const [result,   setResult]   = useState(null);

  const t = theme(type);

  /* ── Parse file via backend dry-run ─────────────────────── */
  const parseFile = async () => {
    if (!file) return;
    setParsing(true);
    setParseError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await studentAdminService.importUnified(fd, type, true);
      setRows(res.data.rows || []);
      setStepIdx(2); // jump to preview
    } catch (err) {
      setParseError(err.response?.data?.message || 'Failed to parse the file. Check the format.');
    } finally {
      setParsing(false);
    }
  };

  /* ── Full import ─────────────────────────────────────────── */
  const doImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await studentAdminService.importUnified(fd, type, false);
      setResult(res.data);
      setStepIdx(3); // results step
    } catch (err) {
      setParseError(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  /* ── Reset wizard ────────────────────────────────────────── */
  const reset = () => {
    setStepIdx(0); setFile(null); setRows([]); setResult(null);
    setParseError(''); setParsing(false); setImporting(false);
  };

  /* ── Step navigation ─────────────────────────────────────── */
  const goNext = () => {
    if (stepIdx === 0) setStepIdx(1);
    else if (stepIdx === 1) parseFile();
    else if (stepIdx === 2) doImport();
  };

  const goBack = () => {
    if (stepIdx === 1) setStepIdx(0);
    else if (stepIdx === 2) setStepIdx(1);
  };

  return (
    <div>
      {/* ── Page header ───────────────────────────────────── */}
      <div className="ap-section-header" style={{ marginBottom:32 }}>
        <div>
          <div className="ap-section-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <FiUploadCloud size={22} color={t.accent} />
            Bulk Import
          </div>
          <div className="ap-section-sub">
            Import students or alumni from an Excel / CSV spreadsheet in seconds.
          </div>
        </div>
      </div>

      {/* ── Wizard card ───────────────────────────────────── */}
      <div style={{
        background:'#fff', borderRadius:20,
        border:'1px solid #f0f0f0',
        boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
        padding:'32px 36px',
        maxWidth:780,
      }}>
        {/* Step indicator */}
        <StepBar steps={STEPS} current={stepIdx} />

        {/* Steps */}
        {stepIdx === 0 && (
          <StepConfigure
            type={type}
            setType={t => { setType(t); setFile(null); setRows([]); setParseError(''); }}
            onNext={() => setStepIdx(1)}
          />
        )}
        {stepIdx === 1 && (
          <StepUpload
            type={type}
            file={file}
            setFile={f => { setFile(f); setParseError(''); }}
            onNext={goNext}
            onBack={goBack}
            parsing={parsing}
            parseError={parseError}
          />
        )}
        {stepIdx === 2 && (
          <StepPreview
            type={type}
            rows={rows}
            onNext={goNext}
            onBack={goBack}
            importing={importing}
          />
        )}
        {stepIdx === 3 && (
          <StepResults
            type={type}
            result={result}
            onReset={reset}
          />
        )}
      </div>

      {/* ── How it works ──────────────────────────────────── */}
      {stepIdx === 0 && (
        <div style={{
          marginTop:24, background:'#fff', borderRadius:16,
          border:'1px solid #f0f0f0', padding:'22px 28px',
          maxWidth:780, boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#1a1a2e', marginBottom:14 }}>
            How Bulk Import Works
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {[
                         { step:'1', icon:'⚙️', title:'Configure',   desc:'Choose record type — student, alumni, or staff.' },
              { step:'2', icon:'📤', title:'Upload',       desc:'Drop your .xlsx or .csv file.' },
              { step:'3', icon:'👁️', title:'Preview',      desc:'Validate field errors before committing.' },
              { step:'4', icon:'✅', title:'Import',       desc:'Accounts created. Login credentials emailed to each user.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign:'center', padding:'4px 0' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontWeight:700, fontSize:13, color:'#1a1a2e', marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:12, color:'#aaa', lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportPage;
