const express = require('express')
const mongoose = require('mongoose')
const Blog = require('./models/blog')
const blogsRouter = require('./controllers/blogs')
const config = require('./utils/config')
const logger = require('./utils/logger')

const app = express()

mongoose.connect(config.MONGODB_URI, { family: 4 })

app.use(express.json())

app.use('/api/blogs', blogsRouter)

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`)
})