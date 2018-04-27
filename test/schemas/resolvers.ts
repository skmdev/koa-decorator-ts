import Koa from 'koa';
import { userQueries } from './User';

export default {
  Query: {
    ...userQueries,
  },
  // Mutation: {},
};
