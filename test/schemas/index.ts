import { importSchema } from 'graphql-import';
import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = importSchema(`${__dirname}/typeDefs.graphql`);

export default makeExecutableSchema({ typeDefs, resolvers });
