const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'
const MONGODB_URI = 'mongodb+srv://tuomo:Atlasloukko203@cluster0.exyge.mongodb.net/booklist?retryWrites=true&w=majority'

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }
  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  type Token {
    value: String!
  }
  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String, genre: String): [Book!]!
      recommendedBooks: [Book]!
      allAuthors: [Author!]!
      me: User
      allGenres: [String]!
  }
  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
      if (!args.genre)
      {
         return Book.find({}).populate('author')
      }
      return Book.find({ genres: { $in: args.genre }}).populate('author')
      // const authorFiltered = args.author ? books.filter(book => book.author === args.author) : books
      // const genreFiltered = args.genre ? authorFiltered.filter(book => book.genres.includes(args.genre)) : authorFiltered
      // return genreFiltered
    },
    recommendedBooks: (root, args, context) => {
      if (!context.currentUser){
        console.log('not logged in')
        return []
      }
      console.log('user: ', context.currentUser)
      const genre = context.currentUser.favoriteGenre
      return Book.find({ genres: { $in: genre }}).populate('author')
    },
    allAuthors: () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser
    },
    allGenres: async () => {
      const allBooks = await Book.find({})
      const genres = allBooks.reduce((arr, b) => {

        return [...new Set([...arr,...b.genres])]
    
      }, [])
      return genres
    }
  },
  Author: {
    bookCount: (root) => {
      // return(books.filter(book => book.author === root.name).length)
      return Author.find({name: root.name}).countDocuments()
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      console.log('addbook args:',args)
      if (!context.currentUser){
        throw new AuthenticationError('you must be logged in to add book')
      }
      // let author = authors.find(a => a.name === args.author)
      let auth = await Author.findOne({name: args.author})
      // Todo: fix
      //if (!author){
      //  author = {name: args.author, id: uuidv1()}
      //  authors = authors.concat(author)
      //}
      if (!auth){
        auth = new Author({name: args.author})
        try {
          await auth.save()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
      }
      console.log('author: ', auth.name)
      //const book = {...args, id: uuidv1()}
      const book = new Book({ ...args, author: auth })
      //books = books.concat(book)
      try {
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser){
        throw new AuthenticationError('you must be logged in to edit author')
      }
      const auth = await Author.findOne({name: args.name})
      auth.born = args.setBornTo
      try {
        await auth.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      return user.save()
      .catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if ( !user || args.password !== 'secret' ){
        throw new UserInputError("wrong credentials")
      }

      const userForToken = {
        username: user.username,
        favoriteGenre: user.favoriteGenre,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET)}
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
