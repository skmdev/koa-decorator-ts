import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

/* Graphql */
const { ApolloServer } = require('apollo-server-koa');

import Router from '../src/router';
import Schema from './schemas';

const app = new Koa();

app.use(bodyParser());

const router = new Router({
  dir: `${__dirname}/controllers`,
});

const routerWithPrefix = new Router({
  dir: `${__dirname}/api`,
  prefix: '/api',
});

const graphqlServer = new ApolloServer({ schema: Schema });

graphqlServer.applyMiddleware({ app });

app.use(router.routes());
app.use(router.allowedMethods());

app.use(routerWithPrefix.routes());
app.use(routerWithPrefix.allowedMethods());

export default app;
