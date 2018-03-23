/**
 * 引入爬虫方法
 */
var fetchPosts = require("./cosplay");

/**
 * 引入设置的url，传入爬虫内部
 */

var webUrl = require("./url");

fetchPosts(webUrl.baseUrl);
