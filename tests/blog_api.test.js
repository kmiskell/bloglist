const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

describe('when there are some initial blogs saved', () => {
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

  describe('POST /api/blogs - creating a new blog', () => {
    test('a valid blog is correctly saved to the database', async () => {
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

    test('if the likes property is unset, it defaults to 0', async () => {
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

    test('if title property is unset, blog is not saved', async () => {
      const newBlog = {
        author: 'Gerson Boom',
        url: 'https://deltarune.wiki/w/Lord_of_the_Hammer',
        likes: 3,
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('if url proerty is unset, blog is not saved', async () => {
      const newBlog = {
        title: 'Lord of the Hammer',
        author: 'Gerson Boom',
        likes: 3
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('GET /api/blogs/:id - accessing a single blog', () => {
    test('valid id succeeds', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToView = blogsAtStart[0]

      const resultBlog = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.deepStrictEqual(resultBlog.body, blogToView)
    })

    test('invalid format id fails with status 400', async () => {
      const invalidId = '483708sk7s0skd641'
      await api.get(`/api/blogs/${invalidId}`).expect(400)
    })

    test('valid but nonexistent id fails with status 404', async () => {
      const validNonexistingId = await helper.nonExistingId()
      await api.get(`/api/blogs/${validNonexistingId}`).expect(404)
    })
  })

  describe('DELETE /api/blogs/:id - deleting a single blog', () => {
    test('valid id succeeds', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      const ids = blogsAtEnd.map(blog => blog.id)
      assert(!ids.includes(blogToDelete.id))
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
    })

    test('valid but nonexistent id fails to delete anything', async () => {
      const validNonexistingId = await helper.nonExistingId()
      await api.delete(`/api/blogs/${validNonexistingId}`).expect(204)
      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('PUT /api/blogs/:id - updating a single blog', () => {
    test('valid id succeeds', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]

      const updatedBlog = {
        title: 'This is an updated title',
        author: blogToUpdate.author,
        url: blogToUpdate.url,
        likes: blogToUpdate.likes
      }

      const responseBlog = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlog)
        .expect(200)
      
      assert.strictEqual(responseBlog.body.title, updatedBlog.title)
      assert.strictEqual(responseBlog.body.author, updatedBlog.author)
      assert.strictEqual(responseBlog.body.url, updatedBlog.url)
      assert.strictEqual(responseBlog.body.likes, updatedBlog.likes)
    })

    test('valid but nonexistent id fails with status 404', async () => {
      const validNonexistingId = await helper.nonExistingId()
      const updatedBlog = {
        title: 'This is an updated title',
        author: 'author',
        url: 'url',
        likes: 0
      }

      await api
        .put(`/api/blogs/${validNonexistingId}`)
        .send(updatedBlog)
        .expect(404)
    })
  })
})


after(async () => {
  await mongoose.connection.close()
})