const axios = require("axios");
const cheerio = require("cheerio");

async function fetchArticleData(url) {
  try {
    // Fetch the HTML of the webpage
    const { data } = await axios.get(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(data);

    // Select the first <p> tag inside .ArticleBody-blockquote
    const paragraph = $(".ArticleBody-blockquote");
    console.log("🚀 ~ fetchArticleData ~ paragraph:", paragraph);

    // Extract the text, including links
    const paragraphText = paragraph
      .contents()
      .map((i, el) => {
        if (el.type === "text") {
          return $(el).text();
        } else if (el.name === "a") {
          return `${$(el).text()} (${el.attribs.href})`;
        } else {
          return "";
        }
      })
      .get()
      .join("");
    console.log("🚀 ~ fetchArticleData ~ paragraphText:", paragraphText);

    return paragraphText.trim();
  } catch (error) {
    console.error("Error fetching data:", error);
    return "";
  }
}

// Example usage
module.exports = { fetchArticleData };
