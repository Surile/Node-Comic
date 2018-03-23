/**
 * superagent是nodejs里一个非常方便的客户端请求代理模块
 * superagent是轻量的,渐进式的ajax api,可读性好,学习曲线低,
 * 内部依赖nodejs原生的请求api
 */

var superagent = require("superagent");

/**
 * cheerio是nodejs的抓取页面模块，为服务器特别定制的，
 * 快速、灵活、实施的jQuery核心实现。适合各种Web爬虫程序。
 */
var cheerio = require("cheerio");

/**
 * nodeJs内置文件系统模块
 */

var fs = require("fs");

/**
 *
 * 使用async控制并发数量
 *
 */

var async = require("async");

/**
 *
 * 引入设置的url
 *
 */
var webUrl = require("../url");

console.log("爬虫程序开始执行...");

/**
 *
 * 第一步，获取分类总页面
 * 		1.supergent获取页面
 *		2.cheerio获取分类总页数
 */
const fetchPosts = url => {
	console.log(url);
	superagent.get(url).end((err, res) => {
		if (err) {
			return console.log("打开网站失败，如若一直打开失败，请更换代理");
		}
		var $ = cheerio.load(res.text);
		const pageListUrl = [];
		const pageUrl = $(".poi-pager__item_middle_select").find("option").length;
		console.log("总页数", pageUrl);
		for (let i = 1; i <= pageUrl; i++) {
			//basePageUrl，下一页相关URL
			pageListUrl.push(webUrl.basePageUrl + i + "/");
			if (pageListUrl[0]) {
				pageListUrl.splice(0, 1, url);
			}
		}
		//调用第二步，获取更多分类页面
		classificationPage(pageListUrl);
	});
};

/**
 *
 * 第二步获取分类页面
 * 		1.async控制并发
 * 		2.suprragent获取分类页面
 *		3.cheerio获取文章链接
 */
const classificationPage = pageUrl => {
	async.mapLimit(
		pageUrl,
		5,
		(pageUrl, callback) => {
			superagent
				.get(pageUrl)
				.retry(2)
				.end((err, res) => {
					if (err) {
						return console.log(
							"获取单个分类页面失败，如若一直打开失败，请更换代理"
						);
					}
					const $ = cheerio.load(res.text);
					const postListUrl = [];
					$("article").each((index, ele) => {
						const $ele = $(ele);
						console.log("第" + (index + 1) + "篇文章");
						const postsUrl = $ele
							.find(".inn-card_post-thumbnail__item__container a")
							.attr("href");
						postListUrl.push(postsUrl);
						console.log(postListUrl);
					});
					callback(null, postListUrl);
					//调用第三步，获取文章页面
					article(postListUrl);
				});
		},
		(err, res) => {
			console.log("final:");
			console.log(res);
		}
	);
};

/**
 *
 * 第三步，获取文章页面
 * 		1.async控制并发
 * 		2.superagent获取页面
 * 		3.cheerio获取文章标题，文章详情的标签
 */

const article = articleUrl => {
	async.mapLimit(
		articleUrl,
		2,
		(articleUrl, callback) => {
			console.log("并发文章页面" + articleUrl);
			superagent
				.get(articleUrl)
				.retry(2)
				.end((err, res) => {
					if (err) {
						console.log("打开文章页面失败");
					}
					var $ = cheerio.load(res.text);
					var data = {
						title: $(".inn-singular__post__title")
							.text()
							.trim(),
						content: $("div[class=inn-singular__post__body]")
							.find(".inn-content-reseter")
							.html()
					};
					callback(null, data);
				});
		},
		(err, res) => {
			console.log("success:");
			console.log(res);
		}
	);
};

console.log("爬虫执行完毕,请查看数据......");

module.exports = fetchPosts;
