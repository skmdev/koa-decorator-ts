# koa-decorator-ts
Koa Decorator(Type Script Support)

# Installation
```
npm i koa-decorator-ts --save
```

# Usage

> app.js
```javascript
import Koa from 'koa';
// 1. Import Router
import Router from 'koa-decorator-ts/router';

const app = new Koa();
// 2. Create router
const router = new Router({
    app,
    apiDirPath: `${__dirname}/controllers` // The controllers directory
    jwt: { // [Optional] koa-jwt options
      secret: 'skmdev29',
    }
});

// [Optional] Jwt unless add .unless() after route function
router.get('/unlessPath', () => {}).unless();

// [Optional] Graphql inital
router.all('/graphql', graphqlKoa({ schema: Schema })).unless();
router.get('/graphql', graphiqlKoa({ endpointURL: '/graphql' })).unless();



// 3. Register the routers
router.registerRouters();

...

app.listen('8080');
```

> /controllers/user.ts

```javascript
import Koa from 'koa';
import { Controller, Route, Middleware, Required, Graphql } from '../../index';

// Prefix of api path
@Controller('/user')
class UserController {
  static async middlewareLog(ctx: Koa.Context, next: Function) {
    await next();
  }

  // Post /user/login
  @Route.post({ path: '/login', unless: true })
  @Required({
    // Require { userEmail, password } in the body
    body: {
      userEmail: 'string',
      password: 'string',
    },
  })
  static async login(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  // Get /user/:userId
  @Route.get({ path: '/:userId' }) // if unless === true, it is equal to koa-jwt unless
  @Required({ params: 'userId' }) // Require for "userId" in the params
  @Middleware(UserController.middlewareLog) // Add Middleware
  static async getUserInfo(ctx: Koa.Context): Promise<void> {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Get /user?top=10&star=1000000
  @Route.get({ path: '/' })
  @Required({ query: [ 'top', 'star' ] }) // Require for "top", "star" in the query
  @Middleware(UserController.middlewareLog)
  static async getUsers(ctx: Koa.Context): Promise<void> {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Patch /user/:userId
  @Route.patch({ path: '/:userId' })
  @Required({
    // Require { userNickName, userAddress } in the body
    body: {
      userNickName: 'string',
      userAddress: 'string',
    },
  })
  static async updateUserInfo(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  // Put /user/:userId/follow
  @Route.put({ path: '/:userId/follow' })
  @Required({ params: [ 'userId' ] }) // Require for "userId" in the params
  static async followUser(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  // Delete /user/:userId/follow
  @Route.del({ path: '/:userId/follow' })
  @Required({ params: [ 'userId' ] }) // Require for "userId" in the params
  static async unfollowUser(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  @Graphql // transfrom to graphql resolver
  @Middleware(UserController.middlewareLog)
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
    const { args } = ctx.graphql;

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


# Todo

~~Jwt~~
~~Graphql~~
Test case(90%)