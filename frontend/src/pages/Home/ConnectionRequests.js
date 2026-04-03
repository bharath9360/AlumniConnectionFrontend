import React, { useState, useEffect } from 'react';
import { connectionService } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ConnectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await connectionService.getRequests();
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load pending requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    try {
      if (action === 'accept') {
        const res = await connectionService.acceptRequest(requestId);
        if (res.data.success) toast.success('Connection request accepted!');
      } else {
        const res = await connectionService.rejectRequest(requestId);
        if (res.data.success) toast.success('Connection request rejected.');
      }
      // Remove the processed request from the UI
      setRequests(requests.filter(req => req._id !== requestId));
    } catch (err) {
      toast.error(`Failed to ${action} request`);
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mx-auto max-w-3xl">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Connection Requests</h2>
            <p className="text-sm text-gray-500">Manage your pending invitations</p>
          </div>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {requests.length} Pending
          </span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🙌</div>
              <h3 className="text-lg font-medium text-gray-800">No pending requests</h3>
              <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div 
                    className="flex items-center space-x-4 cursor-pointer flex-1"
                    onClick={() => navigate(`/profile/${req.sender?._id}`)}
                  >
                    <img
                      src={req.sender?.profilePic || '/default-avatar.png'}
                      alt="profile"
                      className="w-14 h-14 rounded-full object-cover border border-gray-200"
                      onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (req.sender?.name || '?') }}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{req.sender?.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{req.sender?.role} • {req.sender?.department}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sent a connection request</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pl-4">
                    <button
                      onClick={() => handleAction(req._id, 'reject')}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleAction(req._id, 'accept')}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-full hover:bg-blue-700 transition"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequests;
