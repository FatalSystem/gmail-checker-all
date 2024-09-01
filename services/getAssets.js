const axios = require("axios");
const { findBlockquote } = require("../utils/findBlockquote");

async function getAssets() {
  const endpoints = [
    "https://webql-redesign.cnbcfm.com/graphql?operationName=notifications&variables=%7B%22hasICAccess%22%3Atrue%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%22fc9e24ea-790a-484e-a5fe-a3fed986c9c6%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22164605adfed90a20507897e5ed7f3dbec6ba2953ff81516252eb11656174c5ca%22%7D%7D",
    "https://webql-redesign.cnbcfm.com/graphql?operationName=notifications&variables=%7B%22hasICAccess%22%3Atrue%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%22fc9e24ea-790a-484e-a5fe-a3fed986c9c6%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22164605adfed90a20507897e5ed7f3dbec6ba2953ff81516252eb11656174c5ca%22%7D%7D",
    "https://webql-redesign.cnbcfm.com/graphql?operationName=notifications&variables=%7B%22hasICAccess%22%3Atrue%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%22fc9e24ea-790a-484e-a5fe-a3fed986c9c6%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22164605adfed90a20507897e5ed7f3dbec6ba2953ff81516252eb11656174c5ca%22%7D%7D",
  ];

  try {
    const assets = await axios.all(
      endpoints.map((endpoint) =>
        axios({
          method: "get",
          url: endpoint,
          headers: {
            "Content-Type": "text/html",
          },
        }).then((res) => {
          console.log(
            "🚀 ~ getAssets ~ res.data.data.assets:",
            res.data.data.dtcNotifications.tradeAlerts
          );
          return res.data.data.dtcNotifications.tradeAlerts;
        })
      )
    );

    const res = assets.map((asset) => asset && asset);

    if (res && res.length > 0) {
      const articleDataPromises = res.flat().map(async (asset) => {
        if (asset?.id) return await getArticleData(asset.id);
      });

      return Promise.all(articleDataPromises);
    }
  } catch (error) {
    console.error("Error fetching assets:", error);
  }
}

async function getArticleData(id) {
  if (!id) return;

  try {
    const response = await axios({
      method: "get",
      url: `https://webql-redesign.cnbcfm.com/graphql?operationName=getArticleData&variables=%7B%22id%22%3A${id}%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%227963a8dd-5bbc-4b3d-8994-11ffa3af4862%22%2C%22pid%22%3A33%2C%22bedrockV3API%22%3Atrue%2C%22sponsoredProExperienceID%22%3A%22%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22ae0cb793864294396f10b73073c500e8256ffb6447f7a2623abb24ed79f89ca0%22%7D%7D`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("🚀 ~ getArticleData ~ response:", response.data.articl);

    const content = response.data.data.articl;
    if (content) {
      return {
        id,
        asset: createString(
          content
            .map((cont) =>
              cont.children.filter(
                (child) =>
                  child.tagName === "blockquote" || '"ArticleBody-blockquot'
              )
            )
            .filter((item) => item.flat().length > 0)
            ?.flat()[0]?.children[0]?.children
        ),
      };
    }
  } catch (error) {
    console.error("Error fetching article data:", error);
  }
}

function createString(data) {
  return (
    data &&
    data
      .map((item) => {
        if (typeof item === "string") {
          return item;
        } else if (typeof item === "object" && item.tagName === "a") {
          return item.children[0]; // Assuming that `children` is an array with a single string element.
        }
        return "";
      })
      .join("")
  );
}

module.exports = { getAssets };
