const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce(
    (accumulator, current) => accumulator + current.likes,
    0
  )
}

const favoriteBlog = (blogs) => {
  var mostLikes = -1
  var favoriteBlog = null

  blogs.forEach((blog) => {
    if (blog.likes > mostLikes) {
      mostLikes = blog.likes
      favoriteBlog = blog
    }
  })

  return favoriteBlog
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  const authorCounts = _.toPairs(_.countBy(blogs, 'author'))
  const mostBlogs = _.last(_.sortBy(authorCounts, (item) => item[1]))
  return {
    'author': mostBlogs[0],
    'blogs': mostBlogs[1]
  }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const groupByAuthor = _.groupBy(blogs, 'author')
  const likeCounts = _.toPairs(_.mapValues(groupByAuthor, (blist) => _.reduce(blist,(sum, n) => sum + n.likes, 0)))
  const mostLikes = _.last(_.sortBy(likeCounts, (item) => item[1]))
  return {
    'author': mostLikes[0],
    'likes': mostLikes[1]
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}