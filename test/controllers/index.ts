import Koa from 'koa';
import { Controller, Route, Middleware, Required, Graphql } from '../../index';
import { Unless } from '../../decorators/router';

// Prefix of api path
@Controller('/user')
class UserController {
  static async middlewareLog(ctx: Koa.Context, next: Function) {
    await next();
  }

  // Post /user/login
  @Unless
  @Route.post('/login')
  @Required({
    // Require { userEmail, password } in the body
    body: {
      userEmail: 'string',
      password: 'string'
    }
  })
  static async login(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  // Get /user/:userId
  @Route.get('/:userId') // if unless === true, it is equal to koa-jwt unless
  @Required({ params: 'userId' }) // Require for "userId" in the params
  @Middleware(UserController.middlewareLog) // Add Middleware
  static async getUserInfo(ctx: Koa.Context): Promise<void> {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Get /user?top=10&star=1000000
  @Route.get('/')
  @Required({ query: ['top', 'star'] }) // Require for "top", "star" in the query
  @Middleware(UserController.middlewareLog)
  static async getUsers(ctx: Koa.Context): Promise<void> {
    ctx.body = { userName: 'skm', userEmail: 'skmdev@gmail.com' };
  }

  // Patch /user/:userId
  @Route.patch('/:userId')
  @Required({
    // Require { userNickName, userAddress } in the body
    body: {
      userNickName: 'string',
      userAddress: 'string'
    }
  })
  static async updateUserInfo(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  // Put /user/:userId/follow
  @Route.put('/:userId/follow')
  @Required({ params: ['userId'] }) // Require for "userId" in the params
  static async followUser(ctx: Koa.Context): Promise<void> {
    ctx.body = true;
  }

  // Delete /user/:userId/follow
  @Route.del('/:userId/follow')
  @Required({ params: ['userId'] }) // Require for "userId" in the params
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
    const { args } = ctx.graphql!;

    const users = [
      { username: 'skmdev', role: 'admin', userEmail: 'skmdev29@gmail.com' },
      { username: 'foo', role: 'user', userEmail: 'bar' }
    ];

    // ctx.body is response data;
    ctx.body = users.filter((user) => user.role === args.role);
  }
}

export default UserController;
