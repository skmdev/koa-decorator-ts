# koa-decorator-ts
Koa Decorator (with TypeScript)

# Installation
```
npm i koa-decorator-ts --save
/* or */
yarn add koa-decorator-ts
```

# Introduction
This package is a decorator for koa, including the koa-router, graohql.
You can use decorators to define the path of routing or create a graphql resolver using existing koa controller

# Usage

> app.js
```javascript
import Koa from 'koa';
// 1. Import Router
import Router from 'koa-decorator-ts/router';

const app = new Koa();
// 2. Create router
const router = new Router({
  dir: `${__dirname}/controllers` // The controllers directory
});

// [Optional] Graphql inital
const graphqlServer = new ApolloServer({ schema });
graphqlServer.applyMiddleware({ app });

// 3. Register the routers
app.use(router.routes());
app.use(router.allowedMethods());

...

app.listen(8080);
```

> /controllers/user.ts

```javascript
import Koa from 'koa';
import {
  Controller,
  Route,
  Middleware,
  Required,
  Graphql,
  Priority,
  Meta,
} from 'koa-decorator-ts';

async function middlewareLog(ctx: Koa.Context, next: Function) {
  await next();
}

// Prefix of api path
@Controller('/user')
class UserController {
  @Priority(-1000)
  @Route.all('*')
  async handleAll(ctx: Koa.Context, next: any) {
    ctx.body = 'haha';
  }

  // Post /user/login
  @Route.post('/login')
  @Required({
    // Require { userEmail, password } in the body
    body: {
      type: 'object',
      properties: {
        userEmail: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
      required: ['userEmail', 'password'],
    },
  })
  async login(ctx: Koa.Context) {
    ctx.body = true;
  }

  // Get /user/:userId
  @Route.get('/:userId')
  @Middleware(middlewareLog) // Add Middleware
  async getUserInfo(ctx: Koa.Context) {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Get /user?top=10&star=1000000
  @Route.get('/')
  @Required({
    query: {
      type: 'object',
      properties: {
        top: { type: 'string' },
        star: { type: 'string' },
      },
      required: ['top', 'star'],
    },
  }) // Require for "top", "star" in the query
  @Middleware(middlewareLog)
  async getUsers(ctx: Koa.Context) {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Patch /user/:userId
  @Route.patch('/:userId')
  @Required({
    // Require { userNickName, userAddress } in the body
    body: {
      type: 'object',
      properties: {
        userNickName: {
          type: 'string',
        },
        userAddress: {
          type: 'string',
        },
      },
      required: ['userNickName', 'userAddress'],
    },
  })
  async updateUserInfo(ctx: Koa.Context) {
    ctx.body = true;
  }

  // Put /user/:userId/follow
  @Route.put('/:userId/follow')
  async followUser(ctx: Koa.Context) {
    ctx.body = true;
  }

  // Delete /user/:userId/follow
  @Route.del('/:userId/follow')
  async unfollowUser(ctx: Koa.Context) {
    ctx.body = true;
  }

  @Meta({ test: 'cc' })
  @Route.get('/meta')
  async metaTest(ctx: Koa.Context) {
    ctx.body = ctx.meta;
  }

  @Graphql
  @Middleware(middlewareLog)
  static async getUser(ctx: Koa.Context) {
    const { args } = ctx.graphql!;

    const users = [
      { username: 'skmdev', role: 'admin', userEmail: 'skmdev29@gmail.com' },
      { username: 'foo', role: 'user', userEmail: 'bar' },
    ];

    ctx.body = users.find((user) => user.username === args.username);
  }

  @Graphql // transfrom to graphql resolver
  @Middleware(middlewareLog)
  static async getUsersGraph(ctx: Koa.Context) {
    /**
     * const { root, args, info } = ctx.graphql;
     * 
     * root is representing rootObject
     * 
     * args is representing the arguments of request
     * 
     * info is representing the graphql info
     * 
     */
    const { args } = ctx.graphql!;

    const users = [
      { username: 'skmdev', role: 'admin', userEmail: 'skmdev29@gmail.com' },
      { username: 'foo', role: 'user', userEmail: 'bar' },
    ];

    // ctx.body is response data;
    ctx.body = users.filter((user) => user.role === args.role);
  }
}

export default UserController;



```
