// src/ApolloClient.js
const {
  ApolloClient,
  InMemoryCache,
  HttpLink,
} = require("@apollo/client/core");
const fetch = require("node-fetch");

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://webql-redesign.cnbcfm.com/graphql",
    fetch,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer AHWqTUkZEm91NKpqGIhc0ZePbZeKkyLZqV-vxcPqC48BzpQTqkwkKR4LOLwo7GxgMfQ`, // Use if needed
    },
  }),

  cache: new InMemoryCache(),
});

module.exports = client;
