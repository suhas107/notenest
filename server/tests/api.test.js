// API tests: run with "npm test". Uses an in-memory MongoDB so no real database is touched.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';
const app = require('../app');

let mongo;
let tokenA; // user A
let tokenB; // user B (used to test data isolation)
let noteId;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Auth API', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'alice@test.com');
    assert.equal(res.body.user.password, undefined);
    tokenA = res.body.token;
  });

  test('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice2', email: 'alice@test.com', password: 'secret123' });
    assert.equal(res.status, 409);
  });

  test('rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: '123' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /at least 6/);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'secret123' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  test('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpass' });
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me returns the logged-in user', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(tokenA));
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Alice');
  });

  test('registers a second user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'secret123' });
    assert.equal(res.status, 201);
    tokenB = res.body.token;
  });
});

describe('Notes API (protected routes)', () => {
  test('blocks requests without a token', async () => {
    const res = await request(app).get('/api/notes');
    assert.equal(res.status, 401);
  });

  test('blocks requests with an invalid token', async () => {
    const res = await request(app).get('/api/notes').set(auth('not-a-real-token'));
    assert.equal(res.status, 401);
  });

  test('POST /api/notes creates a note and returns JSON', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(auth(tokenA))
      .send({ title: 'Shopping list', content: 'Milk, eggs, bread', tags: ['Personal', 'todo', 'todo'], pinned: false });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Shopping list');
    assert.deepEqual(res.body.tags, ['personal', 'todo']); // lowercased, duplicates removed
    assert.equal(res.body.pinned, false);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);
    noteId = res.body._id;
  });

  test('POST /api/notes accepts comma separated tags', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(auth(tokenA))
      .send({ title: 'Project ideas', content: 'Build a MERN notes app', tags: 'work, ideas', pinned: true });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.tags, ['work', 'ideas']);
  });

  test('POST /api/notes rejects a missing title', async () => {
    const res = await request(app).post('/api/notes').set(auth(tokenA)).send({ content: 'no title' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Title is required/);
  });

  test('GET /api/notes returns pinned notes first', async () => {
    const res = await request(app).get('/api/notes').set(auth(tokenA));
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].pinned, true);
  });

  test('GET /api/notes?search= searches title and content', async () => {
    const res = await request(app).get('/api/notes?search=eggs').set(auth(tokenA));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Shopping list');
  });

  test('GET /api/notes?tag= filters by tag', async () => {
    const res = await request(app).get('/api/notes?tag=work').set(auth(tokenA));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Project ideas');
  });

  test('GET /api/notes?pinned=true filters pinned notes', async () => {
    const res = await request(app).get('/api/notes?pinned=true').set(auth(tokenA));
    assert.equal(res.body.length, 1);
  });

  test('GET /api/notes/tags counts notes per tag (aggregation)', async () => {
    const res = await request(app).get('/api/notes/tags').set(auth(tokenA));
    assert.deepEqual(res.body, [
      { tag: 'ideas', count: 1 },
      { tag: 'personal', count: 1 },
      { tag: 'todo', count: 1 },
      { tag: 'work', count: 1 },
    ]);
  });

  test('PUT /api/notes/:id updates a note', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set(auth(tokenA))
      .send({ title: 'Groceries', pinned: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Groceries');
    assert.equal(res.body.pinned, true);
    assert.equal(res.body.content, 'Milk, eggs, bread'); // untouched fields kept
  });

  test('PATCH /api/notes/:id/pin toggles pinned', async () => {
    const res = await request(app).patch(`/api/notes/${noteId}/pin`).set(auth(tokenA));
    assert.equal(res.status, 200);
    assert.equal(res.body.pinned, false);
  });

  test('returns 400 for an invalid id', async () => {
    const res = await request(app).get('/api/notes/abc').set(auth(tokenA));
    assert.equal(res.status, 400);
  });

  test("user B cannot see, edit or delete user A's notes", async () => {
    const list = await request(app).get('/api/notes').set(auth(tokenB));
    assert.equal(list.body.length, 0);

    const get = await request(app).get(`/api/notes/${noteId}`).set(auth(tokenB));
    assert.equal(get.status, 404);

    const put = await request(app).put(`/api/notes/${noteId}`).set(auth(tokenB)).send({ title: 'hacked' });
    assert.equal(put.status, 404);

    const del = await request(app).delete(`/api/notes/${noteId}`).set(auth(tokenB));
    assert.equal(del.status, 404);
  });

  test('DELETE /api/notes/:id deletes a note', async () => {
    const res = await request(app).delete(`/api/notes/${noteId}`).set(auth(tokenA));
    assert.equal(res.status, 200);

    const after = await request(app).get(`/api/notes/${noteId}`).set(auth(tokenA));
    assert.equal(after.status, 404);
  });

  test('unknown API route returns 404 JSON', async () => {
    const res = await request(app).get('/api/nothing-here');
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Route not found/);
  });
});
