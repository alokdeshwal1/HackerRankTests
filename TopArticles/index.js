const https = require("https");
const API_URL = `https://jsonmock.hackerrank.com/api/articles?page=`;
function getURL(pageNumber) {
  return API_URL + pageNumber;
}
function getValidArticlesOnly(articles) {
  articles.forEach((article, index) => {
    if (article.title !== null || article.story_title !== null) {
      articles[index].articleName = article.title || article.story_title;
    } else {
      articles.splice(index, 1);
    }
  });
  return articles;
}
async function fetchAllTheArticlesRecursively(pageNumber, allArticlesArr) {
  return new Promise((resolve, reject) => {
    https.get(getURL(pageNumber), (resp) => {
      const chunkData = [];
      resp.on("data", (d) => {
        chunkData.push(d);
      });
      resp.on("end", () => {
        const reqquestedData = Buffer.concat(chunkData).toString();
        try {
          const parsedArticles = JSON.parse(reqquestedData);
          allArticlesArr.push(...parsedArticles.data);
          if (pageNumber === parsedArticles.total_pages)
            resolve(allArticlesArr);
          else
            resolve(
              fetchAllTheArticlesRecursively(pageNumber + 1, allArticlesArr)
            );
        } catch (err) {
          console.error("JSON parser error", err);
        }
      });
      resp.on("error", (err) => {
        reject(err);
      });
    });
  });
}

const sortByCommentsAndArticleName = (a, b) => {
  // if there is a tie in comments count
  if (a.num_comments === b.num_comments) {
    // and then increasing alphabetically by article name
    if (a.articleName > b.articleName) return 1;
    else if (a.articleName < b.articleName) return -1;
    return 0;
  }
  if (a.num_comments > b.num_comments) return -1; // sort the titles decreasing by comment count
  return 1;
};
async function topArticles(limit) {
  const allArticles = [];
  const defaultPageNumber = 1;
  await fetchAllTheArticlesRecursively(defaultPageNumber, allArticles);
  const filteredArticles = getValidArticlesOnly(allArticles); // Ignore the article if it finds title and story_title both the fields values as `null`
  filteredArticles.sort(sortByCommentsAndArticleName); // in place sorting
  filteredArticles.length = limit; // limit the number of record we want to return
  return filteredArticles.map((article) => `${article.articleName}`);
}

// testing
const limit = 2;
topArticles(limit)
  .then((result) => {
    console.log(result);
    process.exit();
  })
  .catch((err) => {
    console.log(err);
  });
// Note: for title and story_title only `null` check is applied it will skip the check if these two fields fields contains a falsy value but other than null and then this solution might result wrong
