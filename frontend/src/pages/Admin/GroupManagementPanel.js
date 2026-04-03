import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import GroupModal from '../../components/admin/GroupModal';
import GroupMemberModal from '../../components/admin/GroupMemberModal';
import { FaUsers, FaPlus, FaCalendarAlt, FaLayerGroup, FaTrashAlt, FaUsersCog } from 'react-icons/fa';

const GroupManagementPanel = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups`);
      if (res.data.success) {
        setGroups(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? All members will be removed and the associated chat will be archived.')) return;
    
    try {
      const res = await api.delete(`/groups/${groupId}`);
      if (res.data.success) {
        toast.success('Group deleted successfully');
        fetchGroups();
      }
    } catch (err) {
      toast.error('Failed to delete group');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-white to-gray-50">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-mamcet-red text-white flex items-center justify-center shadow-lg shadow-red-200">
              <FaLayerGroup size={18} />
            </span>
            Group Orchestration
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Create automated discovery hubs for batches and departments.</p>
        </div>
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="mt-4 md:mt-0 px-6 py-3 bg-mamcet-red text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2 active:scale-95"
        >
          <FaPlus size={14} />
          Create New Group
        </button>
      </div>

      <div className="">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mamcet-red"></div>
            <p className="mt-4 text-gray-400 font-medium animate-pulse text-sm">Syncing group registries...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
               <FaUsers size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Groups Found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Start by creating a batch or department hub for your userbase.</p>
            <button 
               onClick={() => setIsGroupModalOpen(true)}
               className="mt-6 text-mamcet-red font-bold text-sm hover:underline"
            >
              Initialize First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group._id} className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 flex flex-col relative overflow-hidden">
                
                {/* Subtle background decoration */}
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-gray-50 rounded-full group-hover:scale-150 transition-all duration-500 opacity-50"></div>

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                      group.type === 'department' ? 'bg-indigo-50 text-indigo-700' :
                      group.type === 'batch' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.type} hub
                    </span>
                    <div className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                      <FaCalendarAlt size={10} />
                      {formatDate(group.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 flex items-center justify-center font-black text-xl shadow-inner border border-gray-200/50">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 leading-tight group-hover:text-mamcet-red transition-colors">{group.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-mamcet-red animate-pulse"></div>
                         <p className="text-xs font-bold text-gray-500 tracking-tight">{group.memberCount} Mapped Members</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-6 line-clamp-2 min-h-[32px] leading-relaxed font-medium">
                    {group.description || 'No specialized description provided for this discovery group.'}
                  </p>

                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedGroupForMembers(group)}
                      className="py-2.5 px-4 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-bold flex items-center justify-center gap-2 active:scale-95"
                    >
                      <FaUsersCog size={12} />
                      Manage
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="py-2.5 px-4 text-xs bg-white text-gray-400 border border-gray-100 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-bold flex items-center justify-center gap-2 active:scale-95"
                    >
                      <FaTrashAlt size={11} />
                      Erase
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isGroupModalOpen && (
        <GroupModal
          onClose={() => setIsGroupModalOpen(false)}
          onSuccess={() => {
            setIsGroupModalOpen(false);
            fetchGroups();
          }}
        />
      )}

      {selectedGroupForMembers && (
        <GroupMemberModal
          group={selectedGroupForMembers}
          onClose={() => {
            setSelectedGroupForMembers(null);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
};

export default GroupManagementPanel;
