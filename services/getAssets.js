const axios = require("axios");
const processedAssets = new Set(); // To keep track of processed messages

const endpoints = [
  "https://webql-redesign.cnbcfm.com/graphql?operationName=notifications&variables=%7B%22hasICAccess%22%3Atrue%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%22fc9e24ea-790a-484e-a5fe-a3fed986c9c6%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22164605adfed90a20507897e5ed7f3dbec6ba2953ff81516252eb11656174c5ca%22%7D%7D",
  "https://webql-redesign.cnbcfm.com/graphql?operationName=notifications&variables=%7B%22hasICAccess%22%3Atrue%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%22fc9e24ea-790a-484e-a5fe-a3fed986c9c6%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22164605adfed90a20507897e5ed7f3dbec6ba2953ff81516252eb11656174c5ca%22%7D%7D",
  "https://webql-redesign.cnbcfm.com/graphql?operationName=notifications&variables=%7B%22hasICAccess%22%3Atrue%2C%22uid%22%3A%22sharon.perkins00%40outlook.com%22%2C%22sessionToken%22%3A%22fc9e24ea-790a-484e-a5fe-a3fed986c9c6%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22164605adfed90a20507897e5ed7f3dbec6ba2953ff81516252eb11656174c5ca%22%7D%7D",
];

async function getAssets() {
  try {
    const assets = await axios.all(
      endpoints.map((endpoint) =>
        axios
          .get(endpoint, { headers: { "Content-Type": "text/html" } })
          .then((res) => res.data.data.dtcNotifications.tradeAlerts)
      )
    );

    const flatAssets = assets
      .flat()
      .filter((asset) => asset && !processedAssets.has(asset.id));

    const articleDataPromises = flatAssets.map(async (asset) => {
      processedAssets.add(asset.id);
      return await getArticleData(asset.id);
    });

    const articleData = await Promise.all(articleDataPromises);
    return articleData;
  } catch (error) {
    console.error("Error fetching assets:", error);
  }
}

async function getArticleData(id) {
  if (!id) return;

  try {
    const response = await fetch("https://webql-redesign.cnbcfm.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationName: "getArticleData",
        variables: {
          id,
          uid: "sharon.perkins00@outlook.com",
          sessionToken: "fc9e24ea-790a-484e-a5fe-a3fed986c9c6",
          pid: 33,
          bedrockV3API: true,
          sponsoredProExperienceID: "",
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "ae0cb793864294396f10b73073c500e8256ffb6447f7a2623abb24ed79f89ca0",
          },
        },
      }),
    });

    const data = await response.json();
    const blockquoteText = extractBlockquoteText(data.data.article);

    return blockquoteText ? blockquoteText : null;
  } catch (error) {
    console.error("Error fetching article data:", error);
  }
}

function extractTextFromChildren(children) {
  return children
    .map((child) => {
      if (typeof child === "string") return child;
      if (child.children) return extractTextFromChildren(child.children);
      return "";
    })
    .join("");
}

function extractBlockquoteText(article) {
  let blockquoteText = "";

  if (article.body?.content) {
    article.body.content.forEach((element) => {
      if (element.tagName === "div" && element.children) {
        element.children.forEach((child) => {
          if (child.tagName === "blockquote") {
            blockquoteText += extractTextFromChildren(child.children) + " ";
          }
        });
      }
    });
  }

  return blockquoteText.trim();
}

module.exports = { getAssets };
