const users = {};
const referrals = {};

export default {
  getUser: (id) => users[id],
  createUser: (id, username, firstName) => {
    if (!users[id]) users[id] = { id, username, firstName, balance: 0, items: [] };
    return users[id];
  },
  addItemToUser: (id, item) => {
    if (users[id]) users[id].items.push(item);
  },
  addBalance: (id, amount) => {
    if (users[id]) users[id].balance += amount;
  },

  getReferral: (userId) => referrals[userId],
  addReferral: (referrerId, referredId) => {
    if (!referrals[referrerId]) referrals[referrerId] = [];
    referrals[referrerId].push(referredId);
  },

  getLeaderboard: () => {
    return Object.values(users)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 20);
  }
};
