const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    addUser: async (parent, { name, email, password }) => {
      const user = await User.create({ name, email, password });
      const token = signToken(user);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user with this email found!');
      };

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password!');
      };

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, { bookToSave }, context) => {
      const newBook = await Book.create({
        authors: bookToSave.authors,
        description: bookToSave.description,
        title: bookToSave.title,
        bookId: bookToSave.bookId,
        image: bookToSave.image,
        link: bookToSave.link,
      });
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: { savedBooks: newBook },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      };
      throw new AuthenticationError('You need to be logged in!');
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: bookId } },
          { new: true }
        );
      };
      throw new AuthenticationError('You need to be logged in!');
    },
  }
};

module.exports = resolvers;