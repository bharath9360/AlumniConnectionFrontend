import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

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
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      const res = await api.delete(`/groups/${group._id}/members/${userId}`);
      if (res.data.success) {
        toast.success('Member removed');
        setMembers(members.filter(m => m.userId?._id !== userId));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Manage Members: {group.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{group.type} Group • {members.length} Members</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('members')}
          >
            Current Members
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'bulk_add' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('bulk_add')}
          >
            Bulk Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
          {activeTab === 'members' && (
            loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="bg-white rounded-lg border border-dashed border-gray-300 p-10 text-center">
                <p className="text-gray-500 text-sm">No members in this group yet.</p>
                <button 
                  onClick={() => setActiveTab('bulk_add')}
                  className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                >
                  Add Members Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={member.userId?.profilePic || '/default-avatar.png'} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (member.userId?.name || '?') }}
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{member.userId?.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {member.userId?.role} {member.userId?.department ? `• ${member.userId.department}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.userId?._id)}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'bulk_add' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-4">Bulk Add Members</h4>
              <p className="text-sm text-gray-500 mb-6">Select a criteria below to automatically find and add active users to this group.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter By</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="filterType" 
                        checked={bulkFilter.type === 'department'} 
                        onChange={() => setBulkFilter({ type: 'department', value: '' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Department</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="filterType" 
                        checked={bulkFilter.type === 'batch'} 
                        onChange={() => setBulkFilter({ type: 'batch', value: '' })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Batch (Passout Year)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {bulkFilter.type === 'department' ? 'Department' : 'Batch'}
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={bulkFilter.value}
                    onChange={(e) => setBulkFilter({ ...bulkFilter, value: e.target.value })}
                  >
                    <option value="">-- Select --</option>
                    {bulkFilter.type === 'department'
                      ? departments.map(d => <option key={d} value={d}>{d}</option>)
                      : batches.map(b => <option key={b} value={b}>{b}</option>)
                    }
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleBulkAdd}
                    disabled={bulkLoading || !bulkFilter.value}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center shadow-sm"
                  >
                    {bulkLoading ? (
                       <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                    ) : null}
                    Add Matching Users
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupMemberModal;
