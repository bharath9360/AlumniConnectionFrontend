const Connection = require('../models/Connection');
const GroupMember = require('../models/GroupMember');

/**
 * Checks if two users have permission to message each other directly.
 * Rules:
 * 1. If either user is an 'admin', return true.
 * 2. If an 'Accepted' connection exists between them, return true.
 * 3. If they share at least one common group, return true.
 * Otherwise, return false.
 */
const checkMessagingPermission = async (userIdA, userIdB, roleA, roleB) => {
  try {
    // 1. Admin override
    if (roleA === 'admin' || roleB === 'admin') return true;

    // 2. Connection check
    const idA = userIdA.toString();
    const idB = userIdB.toString();
    const u1 = idA < idB ? idA : idB;
    const u2 = idA < idB ? idB : idA;

    const connected = await Connection.exists({ user1: u1, user2: u2 });
    if (connected) return true;

    // 3. Same-Group check
    const groupsA = await GroupMember.find({ userId: userIdA }).select('groupId');
    const groupIdsA = groupsA.map(g => g.groupId.toString());

    if (groupIdsA.length > 0) {
      const commonGroup = await GroupMember.exists({
        userId: userIdB,
        groupId: { $in: groupIdsA }
      });
      if (commonGroup) return true;
    }

    return false;
  } catch (error) {
    console.error('Error in checkMessagingPermission:', error);
    return false;
  }
};

module.exports = { checkMessagingPermission };
