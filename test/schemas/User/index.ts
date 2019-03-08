import User from '../../controllers';

export const userQueries = {
  getUsers: User.getUsersGraph,
  getUser: User.getUser,
};
