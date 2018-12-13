import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

/* Graphql */
const { ApolloServer } = require('apollo-server-koa');

import Router from '../router';
import Schema from './schemas';

const app = new Koa();

app.use(bodyParser());

const router = new Router({
  dir: `${__dirname}/controllers`,
  jwt: {
    secret: 'skmdev',
    getToken: (ctx: Koa.Context) => {
      return ctx.query.token;
    },
    unless: [/\/graphql$/], // unless grapgql
  },
});

const routerWithPrefix = new Router({
  dir: `${__dirname}/api`,
  prefix: '/api',
});

router
  .get('/unlessPath', (ctx: Koa.Context) => {
    ctx.body = true;
  })
  .unless();

const graphqlServer = new ApolloServer({ schema: Schema });

graphqlServer.applyMiddleware({ app });

app.use(router.routes());
app.use(router.allowedMethods());

app.use(routerWithPrefix.routes());
app.use(routerWithPrefix.allowedMethods());

app.listen(8000);

export default app;
