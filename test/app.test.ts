import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from './app';

const token = jwt.sign({ foo: 'bar' }, 'skmdev');

const server = app.listen(9999);

afterEach(() => {
  server.close();
});

it('can Route * at last', async () => {
  const response = await request(server)
    .get('/user/unknown/route')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.text).toBe('haha');
});

it('can Get /user with token', async () => {
  const response = await request(server)
    .get('/user')
    .set('Authorization', `Bearer ${token}`)
    .query({ top: 1, star: 2 });
  expect(response.status).toBe(200);
});

it('cannot Get /user without token', async () => {
  const response = await request(server)
    .get('/user')
    .query({ top: 1, star: 2 });
  expect(response.status).toBe(401);
});

it('can Get /user/:userId with token', async () => {
  const response = await request(server)
    .get('/user/1')
    .set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    userName: 'skm',
    userEmail: 'skmdev@gmail.com',
  });
});

it('cannot Get /user/:userId without token', async () => {
  const response = await request(server).get('/user/1');
  expect(response.status).toBe(401);
});

it('can Patch /user/:userId with token', async () => {
  const response = await request(server)
    .patch('/user/1')
    .set('Authorization', `Bearer ${token}`)
    .send({ userNickName: 'string', userAddress: 'string' });
  expect(response.status).toBe(200);
});

it('cannot Patch /user/:userId without token', async () => {
  const response = await request(server)
    .patch('/user/1')
    .send({ userNickName: 'string', userAddress: 'string' });
  expect(response.status).toBe(401);
});

it('can Post /user/login with body', async () => {
  const response = await request(server)
    .post('/user/login')
    .send({ userEmail: 'skmdev29@gmail.com', password: 'haha' });
  expect(response.status).toBe(200);
});

it('cannot Post /user/login without body', async () => {
  const response = await request(server).post('/user/login');
  expect(response.status).toBe(412);
});

it('cannot Post /user/login with userEmail is not string', async () => {
  const response = await request(server)
    .post('/user/login')
    .send({ userEmail: 2, password: 'haha' });
  expect(response.status).toBe(412);
});

it('cannot Post /user/login with password is not string', async () => {
  const response = await request(server)
    .post('/user/login')
    .send({ userEmail: 'skmdev29@gmail.com', password: 2 });
  expect(response.status).toBe(412);
});

it('can Put /user/:userId/follow with token', async () => {
  const response = await request(server)
    .put('/user/haha/follow')
    .set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body).toBe(true);
});

it('cannot Put /user/:userId/follow without token', async () => {
  const response = await request(server).put('/user/1/follow');
  expect(response.status).toBe(401);
});

it('can Delete /user/:userId/follow with token', async () => {
  const response = await request(server)
    .del('/user/haha/follow')
    .set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body).toBe(true);
});

it('cannot Del /user/:userId/follow without token', async () => {
  const response = await request(server).del('/user/1/follow');
  expect(response.status).toBe(401);
});

it('can Query graphql getUsers', async () => {
  const response = await request(server).post('/graphql').send({
    query: `
      {
        getUsers(role: "admin") {
          username 
          userEmail
          role 
        }
      }
    `,
  });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    data: {
      getUsers: [
        { username: 'skmdev', userEmail: 'skmdev29@gmail.com', role: 'admin' },
      ],
    },
  });
});

it('can Query graphql getUsers and getUser in same request', async () => {
  const response = await request(server).post('/graphql').send({
    query: `
      {
        getUsers(role: "admin") {
          username 
          userEmail
          role 
        }
        getUser(username: "foo") {
          username 
          userEmail
          role 
        }
      }
    `,
  });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    data: {
      getUsers: [
        { username: 'skmdev', userEmail: 'skmdev29@gmail.com', role: 'admin' },
      ],
      getUser: {
        username: 'foo',
        userEmail: 'bar',
        role: 'user',
      },
    },
  });
});

it('can Get /unlessPath without token', async () => {
  const response = await request(server).get('/unlessPath');

  expect(response.status).toBe(200);
  expect(response.body).toBe(true);
});

it('can Get /api/product ', async () => {
  const response = await request(server).get('/api/product');
  expect(response.status).toBe(200);
  expect(response.body).toEqual([{ sku: 'test' }, { sku: 'test2' }]);
});

it('cannot Get /product ', async () => {
  const response = await request(server).get('/product');

  expect(response.status).toBe(404);
});
