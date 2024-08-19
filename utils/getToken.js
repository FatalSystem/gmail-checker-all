const { default: axios } = require("axios");

async function getToken() {
  try {
    const authKey = await axios({
      method: "get",
      path: "/api/bedrock/authKey",
      url: "https://www.cnbc.com",
    });
    if (authKey && authKey.data) {
      const toxken = await axios({
        method: "post",
        url: "https://regiszter.cnbc.com/auth/api/v3/signin",
        data: {
          ...authKey.data,
          uuid: "sharon.perkins00@outlook.com",
          password: "Jsd9guBSDGB^",

          rememberMe: false,
        },
      });
      console.log(toxken);
    }
  } catch (error) {
    console.error("Error marking message as read:", error.message);
  }
}

module.exports = { getToken };
