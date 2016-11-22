var express = require('express');
var app = module.exports = express();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var userSecurity = require('../security/user');

var userController = require('../controllers').Users;
var pageController = require('../controllers').Pages;
var offerController = require('../controllers').Offers;
var insightController = require('../controllers').Insights;
var testController = require('../controllers').Tests;
var linkController = require('../controllers').Links;

/* AUTH */
app.get('/api/oauth', userController.oauth);
app.get('/api/auth', userController.auth);
// app.get('/api/exchangeToken', graphqlController.exchangeToken);

app.get('/api/link', userSecurity.is_authenticated, linkController.go);
app.get('/api/redirect', linkController.redirect);

/* INSIGHTS */
app.get('/api/insights/:objName', userSecurity.is_authenticated, insightController.report);
app.post('/api/insights', userSecurity.is_authenticated, insightController.upload);
app.get('/api/insights', userSecurity.is_signed, insightController.log);

app.get('/api/token/debug', userController.debug);

/* USER */
app.get('/api/user/:user_id', userSecurity.is_authenticated, userController.me);
app.get('/api/user/:user_id/update', userSecurity.is_owner, userController.update);
app.get('/api/user/:user_id/import_likes', userSecurity.is_owner, userController.import_likes);
app.get('/api/user/:user_id/add_like', userSecurity.is_owner, userController.add_like);
app.get('/api/user/:user_id/add_subscription', userSecurity.is_owner, userController.add_subscription);
app.get('/api/user/:user_id/remove_subscription', userSecurity.is_owner, userController.remove_subscription);
app.get('/api/user/:user_id/ask_for_discount', userSecurity.is_owner, userController.ask_for_discount);
app.get('/api/user/:user_id/register_device', userSecurity.is_owner, userController.register_device);
app.get('/api/user/:user_id/share_page', userSecurity.is_authenticated, userController.share_page);
app.get('/api/user/:user_id/unshare_page', userSecurity.is_authenticated, userController.unshare_page);
app.get('/api/user/:user_id/save_post', userSecurity.is_owner, userController.save_post);
app.get('/api/user/:user_id/unsave_post', userSecurity.is_owner, userController.unsave_post);
app.put('/api/user/:user_id/enable_notifications', userSecurity.is_owner, userController.enable_notifications);
app.put('/api/user/:user_id/disable_notifications', userSecurity.is_owner, userController.disable_notifications);
app.put('/api/user/:user_id/validate_vat', userSecurity.is_owner, userController.validate_vat);
app.get('/api/user/:user_id/:field', userSecurity.is_authenticated, userController.me);
app.get('/api/users', userSecurity.is_admin, userController.get_all);
app.get('/api/users/enabled', userSecurity.is_admin, userController.get_all);
app.post('/api/users/payment', userSecurity.is_authenticated, userController.payment);
app.get('/api/users/count', userSecurity.is_admin, userController.count_all);
app.get('/api/users/count_all_requests', userSecurity.is_admin, userController.count_all_requests);
app.get('/api/users/:dataset', userSecurity.is_admin, userController.get_all);

app.put('/api/user/:user_id', userSecurity.is_owner, userController.update);

/* SUBSCRIPTIONS */
app.get('/api/subscriptions/:user_id', userSecurity.is_owner, userController.get_subscriptions);

/* PAGE */
app.get('/api/brand/:page_id', userSecurity.is_page_owner, pageController.me);
app.get('/api/brand/:page_id/public', pageController.public);
app.get('/api/brand/:page_id/update', userSecurity.is_page_owner, pageController.update);
app.put('/api/brand/:page_id/cancel_plan', userSecurity.is_page_owner, pageController.cancel_plan);
app.put('/api/brand/:page_id', userSecurity.is_page_owner, pageController.update);
app.get('/api/brand/:page_id/:field', userSecurity.is_page_owner, pageController.me);
app.get('/api/brands', userSecurity.is_page_owner, pageController.get_all);
app.get('/api/brands/count', userSecurity.is_admin, pageController.count_all);
app.get('/api/brands/:dataset', userSecurity.is_page_owner, pageController.get_all);
app.post('/api/brand', userSecurity.is_authenticated, pageController.add);

/* OFFERS */

app.get('/api/test_create', userSecurity.is_page_owner, offerController.test_create);
app.get('/api/offer/:offer_id', userSecurity.is_offer_owner, offerController.me);
// app.get('/api/offer/:offer_id/claim', userSecurity.is_offer_owner, offerController.claim); // get the code
// app.get('/api/offer/:offer_id/redeem', userSecurity.is_offer_owner, offerController.redeem); // use the code
app.get('/api/offer/:offer_id/claim', userSecurity.is_offer_owner, offerController.claim);
app.put('/api/offer/:offer_id/tag_offer', userSecurity.is_offer_owner, offerController.tag_offer);
app.get('/api/offer/:offer_id/update', userSecurity.is_offer_owner, offerController.update);
app.get('/api/offer/:offer_id/:field', userSecurity.is_offer_owner, offerController.me);
app.get('/api/offers', userSecurity.is_offer_owner, offerController.get_all);
app.get('/api/offers/count', userSecurity.is_admin, offerController.count_all);
app.get('/api/offers/:dataset', userSecurity.is_offer_owner, offerController.get_all);
app.post('/api/offer', userSecurity.is_authenticated, offerController.create);
app.delete('/api/offer/:offer_id', userSecurity.is_authenticated, offerController.delete);

app.get('/api/test', testController.test);
