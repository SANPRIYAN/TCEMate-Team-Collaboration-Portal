/**
 * TCEMate - AngularJS Methods & Types Reference File
 * Explicitly specifies the AngularJS TYPE for each method/snippet.
 */

(function () {
  'use strict';

  // ----------------------------------------------------
  // TYPE: Module Definition
  // ----------------------------------------------------
  var app = angular.module('tcemate', []);

  // ----------------------------------------------------
  // TYPE: Custom Filter Definition
  // ----------------------------------------------------
  app.filter('matchLabel', function () {
    return function (score) {
      score = Number(score) || 0;
      if (score >= 80) return 'Strong Match';
      if (score >= 50) return 'Good Match';
      return 'Low Match';
    };
  });

  // ----------------------------------------------------
  // TYPE: Custom Service / Factory (AuthService)
  // ----------------------------------------------------
  app.factory('AuthService', function () {
    var loginKey = 'loggedIn';
    return {
      isLoggedIn: function () { return sessionStorage.getItem(loginKey) === 'true'; },
      login: function (email, password) { return { ok: true, message: 'Login successful!' }; },
      logout: function () { sessionStorage.setItem(loginKey, 'false'); }
    };
  });

  // ----------------------------------------------------
  // TYPE: Custom Service / Factory (DataService)
  // ----------------------------------------------------
  app.factory('DataService', function () {
    return {
      getProjects: function () { return []; },
      getApplicants: function () { return []; },
      getCurrentUser: function () { return {}; }
    };
  });

  // ----------------------------------------------------
  // TYPE: Controller & Dependency Injection (LandingController)
  // Injected: DataService (Custom Service), AuthService (Custom Service), $window (Built-in Service)
  // ----------------------------------------------------
  app.controller('LandingController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;
    vm.user = DataService.getCurrentUser();
    vm.projects = DataService.getProjects().slice(0, 2);
    vm.logout = function () { AuthService.logout(); $window.location.href = 'login.html'; };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller & Two-Way Data Binding (LoginController)
  // ----------------------------------------------------
  app.controller('LoginController', ['AuthService', '$window', function (AuthService, $window) {
    var vm = this;
    vm.mode = 'login';
    vm.loginData = { email: '', password: '' };
    vm.login = function () {
      if (AuthService.login(vm.loginData.email, vm.loginData.password).ok) {
        $window.location.href = 'index.html';
      }
    };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller & Built-in Filter Function (ProjectsController)
  // ----------------------------------------------------
  app.controller('ProjectsController', ['DataService', function (DataService) {
    var vm = this;
    vm.projects = DataService.getProjects();
    vm.filterProjects = function (project) { return true; };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller & Form Submission (CreateListingController)
  // ----------------------------------------------------
  app.controller('CreateListingController', ['DataService', '$window', function (DataService, $window) {
    var vm = this;
    vm.teamSize = 2;
    vm.listing = { title: '', description: '' };
    vm.submitListing = function () { DataService.createListing(vm.listing, vm.teamSize); };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller (ApplicantsController)
  // ----------------------------------------------------
  app.controller('ApplicantsController', ['DataService', function (DataService) {
    var vm = this;
    vm.applicants = DataService.getApplicants();
    vm.handleApplicant = function (applicant) { DataService.removeApplicant(applicant.id); };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller & Tab Filter (InterestsController)
  // ----------------------------------------------------
  app.controller('InterestsController', ['DataService', function (DataService) {
    var vm = this;
    vm.activeFilter = 'all';
    vm.setFilter = function (filter) { vm.activeFilter = filter; };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller & Form Model Binding (ProfileController)
  // ----------------------------------------------------
  app.controller('ProfileController', ['DataService', '$window', function (DataService, $window) {
    var vm = this;
    vm.profile = DataService.getCurrentUser();
    vm.saveProfile = function () { DataService.updateProfile(vm.profile); };
  }]);

  // ----------------------------------------------------
  // TYPE: Controller (NotificationsController)
  // ----------------------------------------------------
  app.controller('NotificationsController', ['DataService', function (DataService) {
    var vm = this;
    vm.notifications = DataService.getNotifications();
    vm.markAllRead = function () { DataService.markAllNotificationsRead(); };
  }]);

})();
