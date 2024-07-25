function isFromList(fromHeader, list) {
  return list.some((email) => fromHeader.includes(email));
}
module.exports = { isFromList };
