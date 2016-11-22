angular.module( 'shopnowapp.home', [
  'ui.router',
  'plusOne',
  'ngCookies'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'home', {
    url: '/',
    views: {
      "main": {
        controller: 'HomeCtrl',
        templateUrl: 'home/home.tpl.html'
      }
    },
    data:{ pageTitle: 'Welcome' }
  });
})

.controller( 'HomeCtrl', function HomeController( $scope, $state, Authed ) {
  $scope.slides = [];
  $scope.slides.push({image: "https://s0.wp.com/wp-content/themes/vip/facebook-notify/img/carousel-1.png", title: "Posts from stores you follow on Facebook", desc: "We know how hard it to find all the latest posts from all store you follow on Facebook. We are monitoring thousends of stores on Facebook and deliver posts that includes products annoucements, sales alerts & latest news from your favorite sources."});
  $scope.slides.push({image: "https://s0.wp.com/wp-content/themes/vip/facebook-notify/img/carousel-2.png", title: "List of stores & brands you love", desc: "Build your handy list of stores and brands you follow on Facebook, and be first to receive latest news"});
  $scope.slides.push({image: "https://s0.wp.com/wp-content/themes/vip/facebook-notify/img/carousel-3.png", title: "Inbox for all your sales alerts, great offers & discounts", desc: "Stop sharing your email address, and start receiving the best offers from now on, we promise no more spam!"});
  
  $scope.links = [];
  // $scope.links.push({title: 'Why ShopNow?', anchor: 'anchor_why', url: ''});
  $scope.links.push({title: 'Text me link to my mobile', url: 'https://bnc.lt/m/SwiWYN6Gxr'});
  
  $scope.login = function() {
    Authed.authorize('/download', 'email,user_likes,user_location,user_friends,user_birthday');
  };

  $scope.getLoginStatus = function() {
    $scope.loggedIn = Authed.isConnected();
  };
  
});
