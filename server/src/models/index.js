'use strict';

var Base = require('./base');
var User = require('./user');
var UserLike = require('./userlike');
var UserOffer = require('./useroffer');
var Page = require('./page');
var Offer = require('./offer');
var Insight = require('./insight');
var InsightDaily = require('./insightdaily');
var InsightMonthly = require('./insightmonthly');
var Notification = require('./notification');
var Link = require('./link');
var Post = require('./post');

module.exports =  {
  Base: Base,
  User: User,
  UserLike: UserLike,
  UserOffer: UserOffer,
  Page: Page,
  Offer: Offer,
  Insight: Insight,
  InsightDaily: InsightDaily,
  InsightMonthly: InsightMonthly,
  Notification: Notification,
  Link: Link,
  Post: Post
};