// // youtube example code
// let publisherInfo = {}

// // attribution value
// let node = document.querySelector("meta[name='attribution']")
// if (node) {
//   publisherInfo.attribution = node.getAttributeNode("content").value
// }

// // ytid
// node = document.querySelector(".yt-user-info *[data-ytid]")
// if (node) {
//   publisherInfo.ytid = node.dataset.ytid
// }

// if (Object.keys(publisherInfo).length !== 0) {
//   ExtensionActions.setPagePublisher(document.location.href, publisherInfo)
// }
