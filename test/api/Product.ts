import { Controller, Route } from '../../index';
import { Context } from 'vm';

@Controller('/product')
class ProductController {
  @Route.get('/')
  static async getAllProduct(ctx: Context) {
    ctx.body = [{ sku: 'test' }, { sku: 'test2' }];
  }
}

export default ProductController;
