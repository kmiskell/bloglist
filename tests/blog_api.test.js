const assert = require('node:assert')
const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

test('GET /api/blogs: returns all blogs', async () => {
  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('unique identifier property of blog posts is named id', async () => {
  const response = await api.get('/api/blogs')
  const blogToCheck = response.body[0]
  assert(Object.prototype.hasOwnProperty.call(blogToCheck,'id'))
})

test('POST /api/blogs: correctly adds a valid blog', async () => {
  const newBlog = {
    title: 'Lord of the Hammer',
    author: 'Gerson Boom',
    url: 'https://deltarune.wiki/w/Lord_of_the_Hammer',
    likes: 3
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
  const addedBlog = blogsAtEnd.find(blog => blog.title === newBlog.title)
  assert.strictEqual(addedBlog.title, newBlog.title)
  assert.strictEqual(addedBlog.author, newBlog.author)
  assert.strictEqual(addedBlog.url, newBlog.url)
  assert.strictEqual(addedBlog.likes, newBlog.likes)
})

test('POST /api/blogs: if likes property is mising default the value to 0', async () => {
  const newBlog = {
    title: 'Lord of the Hammer',
    author: 'Gerson Boom',
    url: 'https://deltarune.wiki/w/Lord_of_the_Hammer',
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
  const addedBlog = blogsAtEnd.find(blog => blog.title === newBlog.title)
  assert.strictEqual(addedBlog.likes, 0)
})

after(async () => {
  await mongoose.connection.close()
})