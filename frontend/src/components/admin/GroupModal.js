import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaUsers, FaGraduationCap, FaBuilding, FaUserPlus, FaSearch, FaTimes } from 'react-icons/fa';

const GroupModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'batch', // batch, department, custom
    description: '',
    department: '',
    passoutYear: '',
    members: []
  });
  
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ departments: [], batches: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get('/groups/utils/departments-batches');
        if (res.data.success) {
          setOptions(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load options', err);
      }
    };
    fetchOptions();
  }, []);

  const handleSearchUsers = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const res = await api.get(`/users/search?q=${query}&limit=5`);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const toggleMember = (user) => {
    const isSelected = formData.members.includes(user._id);
    if (isSelected) {
      setFormData({ ...formData, members: formData.members.filter(id => id !== user._id) });
    } else {
      setFormData({ ...formData, members: [...formData.members, user._id] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) return toast.error('Group name is required');
    if (formData.type === 'batch' && (!formData.department || !formData.passoutYear)) {
      return toast.error('Department and Passout Year are required for Batch groups');
    }
    if (formData.type === 'department' && !formData.department) {
      return toast.error('Department is required for Department groups');
    }
    if (formData.type === 'custom' && formData.members.length === 0) {
      return toast.error('At least one member is required for Custom groups');
    }

    try {
      setLoading(true);
      const res = await api.post(`/groups`, formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Group created successfully!');
        onSuccess(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-auto border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mamcet-red/10 flex items-center justify-center text-mamcet-red">
              <FaUsers size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Configure New Group</h3>
              <p className="text-xs text-gray-500 font-medium">Define group rules and memberships</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Name */}
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Group Name <span className="text-mamcet-red">*</span></label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mamcet-red/20 focus:border-mamcet-red outline-none transition-all bg-gray-50/30"
                placeholder="e.g. Mechanical 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Group Type */}
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Group Classification <span className="text-mamcet-red">*</span></label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mamcet-red/20 focus:border-mamcet-red outline-none transition-all bg-gray-50/30 font-medium text-gray-700"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, department: '', passoutYear: '', members: [] })}
              >
                <option value="batch">Yearly Batch</option>
                <option value="department">Department Hub</option>
                <option value="custom">Manual Selection</option>
              </select>
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
            
            {/* Department Dropdown (Batch or Department type) */}
            {(formData.type === 'batch' || formData.type === 'department') && (
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  <FaBuilding className="text-mamcet-red text-xs" /> Target Department
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mamcet-red/20 focus:border-mamcet-red outline-none transition-all bg-white"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">-- Choose Department --</option>
                  {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Year Dropdown (Batch type only) */}
            {formData.type === 'batch' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  <FaGraduationCap className="text-mamcet-red text-xs" /> Passout Year (Batch)
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mamcet-red/20 focus:border-mamcet-red outline-none transition-all bg-white"
                  value={formData.passoutYear}
                  onChange={(e) => setFormData({ ...formData, passoutYear: e.target.value })}
                >
                  <option value="">-- Choose Batch Year --</option>
                  {options.batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            {/* Custom Member Selection */}
            {formData.type === 'custom' && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  <FaUserPlus className="text-mamcet-red text-xs" /> Selected Members ({formData.members.length})
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaSearch size={14} />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mamcet-red/20 outline-none transition-all bg-white text-sm"
                    placeholder="Search users by name..."
                    value={searchTerm}
                    onChange={handleSearchUsers}
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-gray-100 rounded-xl bg-white shadow-sm max-h-40 overflow-y-auto divide-y divide-gray-50">
                    {searchResults.map(user => (
                      <div 
                        key={user._id} 
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${formData.members.includes(user._id) ? 'bg-mamcet-red/5' : ''}`}
                        onClick={() => toggleMember(user)}
                      >
                        <div className="flex items-center gap-2">
                          <img 
                            src={user.profilePic || 'https://ui-avatars.com/api/?name=' + user.name} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-800">{user.name}</p>
                            <p className="extra-small text-gray-500">{user.department} • {user.role}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.members.includes(user._id) ? 'bg-mamcet-red border-mamcet-red text-white' : 'border-gray-300'}`}>
                          {formData.members.includes(user._id) && <span className="text-[10px]">✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchTerm && searchResults.length === 0 && !searching && (
                    <p className="text-center text-xs text-gray-400 py-2">No users found.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Group Mission/Description</label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-mamcet-red/20 focus:border-mamcet-red outline-none transition-all bg-gray-50/30 resize-none"
              placeholder="e.g. Connecting all mechanical alumni from current batches to share opportunities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="flex items-center p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
               <span className="text-xs font-bold">i</span>
            </div>
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              {formData.type === 'batch' && 'This will automatically add every active alumni and student matching the selected department AND batch year.'}
              {formData.type === 'department' && 'This will automatically add every active user from the selected department regardless of their batch.'}
              {formData.type === 'custom' && 'Only members manually selected from the list above will be added to this discovery group.'}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 font-bold text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm active:scale-95"
            disabled={loading}
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-mamcet-red text-white font-bold text-sm rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200 flex items-center active:scale-95 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
            ) : null}
            Generate Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
