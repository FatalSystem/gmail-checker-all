function findBlockquote(_data) {
  const data = _data.filter((item) => item.tagName === "div");
  console.log("🚀 ~ findBlockquote ~ data:", JSON.stringify(data[0]));
  // Base case: if the current object is a blockquote, return it

  console.log(
    _data
      .map((cont) =>
        cont.attributes.children.filter((child) => {
          console.log(children);
          child.tagName === "blockquote";
        })
      )
      .filter((item) => item.flat().length > 0)
      ?.flat()[0]?.children[0]?.children
  );

  // If the current object has children, recursively search through them
  return _data
    .map((cont) =>
      cont.attributes.children.filter((child) => {
        console.log(children);
        child.tagName === "blockquote";
      })
    )
    .filter((item) => item.flat().length > 0)
    ?.flat()[0]?.children[0]?.children;

  // Return null if no blockquote is found in the current branch
  return null;
}

const extractBlockquoteText = (article) => {
  // Функція для витягування тексту з дочірніх тегів
  const extractTextFromChildren = (children) => {
    return children
      .map((child) => {
        if (typeof child === "string") {
          return child; // Якщо це текст, повертаємо його
        } else if (child.children) {
          return extractTextFromChildren(child.children); // Рекурсивно витягуємо текст з вкладених елементів
        }
        return ""; // Якщо не підходить під жоден варіант
      })
      .join(""); // Об'єднуємо всі шматки тексту
  };

  let blockquoteText = "";

  // Проходимо по всьому контенту
  if (article.body && article.body.content) {
    article.body.content.forEach((element) => {
      if (element.tagName === "div" && element.children) {
        element.children.forEach((child) => {
          if (child.tagName === "blockquote") {
            // Додаємо текст блоку до загального рядка
            blockquoteText += extractTextFromChildren(child.children) + " ";
          }
        });
      }
    });
  }

  return blockquoteText.trim(); // Обрізаємо зайві пробіли з початку та кінця
};
module.exports = { findBlockquote, extractBlockquoteText };
