import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import GroupModal from '../../components/admin/GroupModal';
import GroupMemberModal from '../../components/admin/GroupMemberModal';

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
    if (!window.confirm('Are you sure you want to delete this group? All members will be removed.')) return;
    
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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Group Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage groups manually.</p>
        </div>
        <button
          onClick={() => setIsGroupModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Group
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No groups found. Create a new one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white flex flex-col items-start h-full relative">
                <span className={`px-2 py-1 text-xs font-semibold rounded absolute top-5 right-5 ${
                  group.type === 'Department' ? 'bg-purple-100 text-purple-700' :
                  group.type === 'Batch' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {group.type}
                </span>

                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-500">{group.memberCount} members</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2 mb-4 line-clamp-2 min-h-[40px]">
                  {group.description || 'No description provided.'}
                </p>

                <div className="mt-auto w-full pt-4 border-t border-gray-100 flex space-x-3">
                  <button
                    onClick={() => setSelectedGroupForMembers(group)}
                    className="flex-1 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-medium"
                  >
                    Manage Members
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    className="flex-1 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition font-medium"
                  >
                    Delete
                  </button>
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
            fetchGroups(); // Refresh member counts when closed
          }}
        />
      )}
    </div>
  );
};

export default GroupManagementPanel;
