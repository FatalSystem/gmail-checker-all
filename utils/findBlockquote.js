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
module.exports = { findBlockquote };
