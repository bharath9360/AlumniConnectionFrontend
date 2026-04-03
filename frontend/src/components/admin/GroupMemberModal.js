import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaUsers, FaUserPlus, FaTimes, FaTrashAlt, FaFilter, FaCheckCircle, FaBuilding, FaGraduationCap } from 'react-icons/fa';

const GroupMemberModal = ({ group, onClose }) => {
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'bulk_add'
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk add states
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [bulkFilter, setBulkFilter] = useState({ type: 'department', value: '' });
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups/${group._id}/members`);
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load group members');
    } finally {
      setLoading(false);
    }
  }, [group._id]);

  const fetchFilters = async () => {
    try {
      const res = await api.get(`/groups/utils/departments-batches`);
      if (res.data.success) {
        setDepartments(res.data.data.departments);
        setBatches(res.data.data.batches);
      }
    } catch (err) {
      console.error('Failed to load filter options');
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchFilters();
  }, [fetchMembers]);

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the cohort?')) return;
    try {
      const res = await api.delete(`/groups/${group._id}/members/${userId}`);
      if (res.data.success) {
        toast.success('Member removed');
        setMembers(members.filter(m => {
           const id = m.userId?._id || m.userId;
           return id !== userId;
        }));
      }
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkFilter.value) {
      toast.error(`Please select a ${bulkFilter.type}`);
      return;
    }
    
    try {
      setBulkLoading(true);
      const payload = {};
      if (bulkFilter.type === 'department') payload.department = bulkFilter.value;
      if (bulkFilter.type === 'batch') payload.batch = bulkFilter.value;

      const res = await api.post(`/groups/${group._id}/bulk-add`, payload);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMembers();
        setActiveTab('members');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add members');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto border border-gray-100 flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                group.type === 'department' ? 'bg-indigo-600' :
                group.type === 'batch' ? 'bg-emerald-600' : 'bg-gray-800'
              }`}>
                {group.name.charAt(0).toUpperCase()}
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">{group.name}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{group.type} Hub • {members.length} Active Participants</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-50/50 p-1.5 mx-8 mt-4 rounded-xl border border-gray-100 flex-shrink-0">
          <button
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'members' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('members')}
          >
            Current Roster
          </button>
          <button
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'bulk_add' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('bulk_add')}
          >
            Expansion Tools
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {activeTab === 'members' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mamcet-red"></div>
                <p className="mt-4 text-xs text-gray-400 font-bold uppercase tracking-tighter">Querying Member Registry...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 border border-gray-100">
                   <FaUsers size={24} />
                </div>
                <h4 className="text-gray-800 font-bold">Registry Empty</h4>
                <p className="text-xs text-gray-500 mt-2">No participants have been mapped to this cohort yet.</p>
                <button 
                  onClick={() => setActiveTab('bulk_add')}
                  className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition"
                >
                  Populate Group
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all shadow-sm hover:shadow-md group/item">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={member.userId?.profilePic || 'https://ui-avatars.com/api/?name=' + (member.userId?.name || '?')} 
                          alt="avatar" 
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm tracking-tight">{member.userId?.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          {member.userId?.role} • {member.userId?.department || 'General'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.userId?._id)}
                      className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"
                      title="Remove from Group"
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'bulk_add' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl shadow-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <FaFilter size={14} className="text-white" />
                  </div>
                  <h4 className="font-black text-lg tracking-tight">Expansion Protocol</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">Select a categorization logic to automatically synchronize active users into this hub.</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Categorization Schema</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setBulkFilter({ type: 'department', value: '' })}
                      className={`p-4 rounded-xl border-2 flex flex-col gap-2 transition-all ${bulkFilter.type === 'department' ? 'border-mamcet-red bg-red-50/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                       <FaBuilding size={16} className={bulkFilter.type === 'department' ? 'text-mamcet-red' : 'text-gray-400'} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${bulkFilter.type === 'department' ? 'text-mamcet-red' : 'text-gray-500'}`}>Department Hub</span>
                    </button>
                    <button 
                      onClick={() => setBulkFilter({ type: 'batch', value: '' })}
                      className={`p-4 rounded-xl border-2 flex flex-col gap-2 transition-all ${bulkFilter.type === 'batch' ? 'border-mamcet-red bg-red-50/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                       <FaGraduationCap size={16} className={bulkFilter.type === 'batch' ? 'text-mamcet-red' : 'text-gray-400'} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${bulkFilter.type === 'batch' ? 'text-mamcet-red' : 'text-gray-500'}`}>Yearly Batch</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Select Targeting Parameter
                  </label>
                  <select
                    className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mamcet-red/20 focus:border-mamcet-red outline-none bg-gray-50/30 font-bold text-gray-700 transition-all appearance-none"
                    value={bulkFilter.value}
                    onChange={(e) => setBulkFilter({ ...bulkFilter, value: e.target.value })}
                  >
                    <option value="">-- Choose target parameter --</option>
                    {bulkFilter.type === 'department'
                      ? departments.map(d => <option key={d} value={d}>{d}</option>)
                      : batches.map(b => <option key={b} value={b}>{b}</option>)
                    }
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleBulkAdd}
                    disabled={bulkLoading || !bulkFilter.value}
                    className="w-full py-4 bg-mamcet-red text-white rounded-2xl font-black text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-red-100 active:scale-95"
                  >
                    {bulkLoading ? (
                       <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <FaUserPlus size={16} />
                        Synchronize Matching Users
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center sticky bottom-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <FaCheckCircle className="text-mamcet-red" />
            Registry secure
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white border border-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition active:scale-95 shadow-sm"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMemberModal;
