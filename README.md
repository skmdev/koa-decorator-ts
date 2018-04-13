# koa-decorator-ts
Koa Decorator(Type Script Support)

# Installation
```
npm i koa-decorator-ts --save
```

# Usage

> app.js
```javascript
import * as Koa from 'koa';
// 1. Import Router
import Router from 'koa-decorator-ts/router';

const app = new Koa();
// 2. Create router
const router = new Router({
    app,
    apiDirPath: `${__dirname}/controllers` // The controllers directory
});

// 3. Register the routers
router.registerRouters();

....

app.listen('8080');
```

> /controllers/user.ts

```javascript
import * as Koa from 'koa';
import { controller, get, post, put, del, patch, middleware, required } from 'koa-decorator-ts';

@controller('/user') // Prefix of api path
class UserController {

  aysnc middlewareLog(ctx: Koa.Context, next: Function) => {
      console.time('Middleware Start');
      await next();
      console.timeEnd('Middleware End!');
  }


  aysnc middlewareLog2(ctx: Koa.Context, next: Function) => {
      console.time('Middleware Start');
      await next();
      console.timeEnd('Middleware End!');
  }



  // Get /user/:userId
  @get('/:userId')
  @required({ params: 'userId' }) // Require for "userId" in the params
  @middleware(this.middlewareLog) // Add Middleware
  @middleware(this.middlewareLog2)
  static async getUserInfo(ctx: Koa.Context, next: Function): Promise<void> {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Get /user?top=10&star=1000000
  @get('/')
  @required({ query: ['top', 'star'] }) // Require for "top", "star" in the query
  @middleware(middlewareLog)
  static async getUserInfo(ctx: Koa.Context, next: Function): Promise<void> {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Post /user/login
  @post('/login')
  @required({  // Require { userEmail, password } in the body
    body: {
      userEmail: 'string',
      password: 'string'
    }
  })
  static async login(ctx: Koa.Context, next: Function): Promise<void> {
    
  }

  // Patch /user/:userId
  @patch('/:userId')
  @required({  // Require { userNickName, userAddress } in the body
    body: {
      userNickName: 'string',
      userAddress: 'string'
    }
  })
  static async updateUserInfo(ctx: Koa.Context, next: Function): Promise<void> {
    
  }

  // Put /user/:userId/follow
  @put('/:userId/follow')
  @required({ params: ['userId'] }) // Require for "userId" in the params
  static async followUser(ctx: Koa.Context, next: Function): Promise<void> {
    
  }

  // Delete /user/:userId/follow
  @del('/:userId/follow')
  @required({ params: ['userId'] }) // Require for "userId" in the params
  static async unfollowUser(ctx: Koa.Context, next: Function): Promise<void> {

  }

}

export default UserController;


```


# Todo

Jwt