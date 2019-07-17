import Koa from 'koa';
import {
  Controller,
  Route,
  Middleware,
  Required,
  Graphql,
  Priority,
  Meta,
  RequiredBody,
  RequiredQuery,
} from '../../src';
import { IsString } from 'class-validator';

async function middlewareLog(ctx: Koa.Context, next: Function) {
  await next();
}

class LoginRequest {
  @IsString()
  userEmail!: string;
  @IsString()
  password!: string;
}

class FilterRequest {
  @IsString()
  id!: string;
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

  // Post /user/login
  @Route.post('/login2')
  @RequiredBody(LoginRequest)
  async login2(ctx: Koa.Context) {
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

  // Get /user/filter?id=skm
  @Route.get('/filter')
  @RequiredQuery(FilterRequest)
  async getUserByName(ctx: Koa.Context) {
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

    ctx.body = users.find(user => user.username === args.username);
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
    ctx.body = users.filter(user => user.role === args.role);
  }
}

export default UserController;
