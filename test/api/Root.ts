import { Controller, Route } from '../../src';
import { Context } from 'koa';

@Controller()
class RootController {
  @Route.get('/test')
  async root(ctx: Context) {
    ctx.body = { foo: 'bar' };
  }
  @Route.get()
  async get(ctx: Context) {
    ctx.body = { foo: 'bar' };
  }
}

export default RootController;
