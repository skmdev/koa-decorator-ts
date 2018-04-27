import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

/* Graphql */
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';

import Router from '../router';
import Schema from './schemas';

const app = new Koa();

app.use(bodyParser());

const router = new Router({
  app,
  apiDirPath: `${__dirname}/controllers`,
  jwt: {
    secret: 'skmdev',
    getToken: (ctx: Koa.Context) => {
      return ctx.query.token;
    },
  },
});

router
  .get('/unlessPath', (ctx: Koa.Context) => {
    ctx.body = true;
  })
  .unless();

router.post('/graphql', graphqlKoa({ schema: Schema })).unless();

router.get('/graphql', graphiqlKoa({ endpointURL: '/graphql' })).unless();

router.registerRouters();

app.listen(8000);

export default app;
