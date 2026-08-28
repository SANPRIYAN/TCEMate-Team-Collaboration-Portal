/**
 * TCEMate - AngularJS Factory & Controllers Reference File
 * Explicitly specifies the AngularJS Factory pattern, minification-safe DI ($inject),
 * module dependencies (ngAnimate, ngMessages), and custom directives.
 */

(function () {
  'use strict';

  // ----------------------------------------------------
  // TYPE: Module Definition with Dependencies
  // ----------------------------------------------------
  var app = angular.module('tcemate', ['ngAnimate', 'ngMessages']);

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

  /*
   * REFACTOR NOTE (Service -> Factory):
   * AuthService converted from AngularJS .service() to AngularJS .factory().
   * In a Factory, we return a plain JS object exposing public methods.
   */
  AuthService.$inject = [];
  function AuthService() {
    var loginKey = 'loggedIn';
    return {
      isLoggedIn: function () { return sessionStorage.getItem(loginKey) === 'true'; },
      login: function (email, password) { return { ok: true, message: 'Login successful!' }; },
      logout: function () { sessionStorage.setItem(loginKey, 'false'); }
    };
  }
  app.factory('AuthService', AuthService);

  /*
   * REFACTOR NOTE (Service -> Factory with Core Logic Functions):
   * DataService converted from AngularJS .service() to AngularJS .factory().
   * Exposes core data manipulation functions: getItems(), addItem(), deleteItem(), updateItem().
   */
  DataService.$inject = [];
  function DataService() {
    var items = [];

    function getItems() {
      return items;
    }

    function addItem(newItem) {
      newItem.id = Date.now();
      items.push(newItem);
      return newItem;
    }

    function deleteItem(id) {
      items = items.filter(function (item) { return item.id !== id; });
      return items;
    }

    function updateItem(id, updatedData) {
      items = items.map(function (item) {
        if (item.id === id) {
          return Object.assign({}, item, updatedData);
        }
        return item;
      });
      return items;
    }

    // Factory pattern returns object with exposed API (No 'this' syntax used)
    return {
      getItems: getItems,
      addItem: addItem,
      deleteItem: deleteItem,
      updateItem: updateItem,
      getProjects: function () { return getItems(); },
      getApplicants: function () { return getItems(); },
      getCurrentUser: function () { return {}; }
    };
  }
  app.factory('DataService', DataService);

  /*
   * REFACTOR NOTE (Controllers using $inject for Minification-Safe DI):
   * Controllers inject DataService and AuthService factories using $inject annotations.
   */
  LandingController.$inject = ['DataService', 'AuthService', '$window'];
  function LandingController(DataService, AuthService, $window) {
    var vm = this;
    vm.user = DataService.getCurrentUser();
    vm.projects = DataService.getProjects().slice(0, 2);
    vm.logout = function () { AuthService.logout(); $window.location.href = 'login.html'; };
  }
  app.controller('LandingController', LandingController);

  LoginController.$inject = ['AuthService', '$window'];
  function LoginController(AuthService, $window) {
    var vm = this;
    vm.mode = 'login';
    vm.loginData = { email: '', password: '' };
    vm.login = function () {
      if (AuthService.login(vm.loginData.email, vm.loginData.password).ok) {
        $window.location.href = 'index.html';
      }
    };
  }
  app.controller('LoginController', LoginController);

  ProjectsController.$inject = ['DataService'];
  function ProjectsController(DataService) {
    var vm = this;
    vm.projects = DataService.getItems();
    vm.filterProjects = function (project) { return true; };
  }
  app.controller('ProjectsController', ProjectsController);

  CreateListingController.$inject = ['DataService', '$window'];
  function CreateListingController(DataService, $window) {
    var vm = this;
    vm.teamSize = 2;
    vm.listing = { title: '', description: '' };
    vm.submitListing = function () { DataService.addItem(vm.listing); };
  }
  app.controller('CreateListingController', CreateListingController);

  ApplicantsController.$inject = ['DataService'];
  function ApplicantsController(DataService) {
    var vm = this;
    vm.applicants = DataService.getItems();
    vm.handleApplicant = function (applicant) { vm.applicants = DataService.deleteItem(applicant.id); };
  }
  app.controller('ApplicantsController', ApplicantsController);

  InterestsController.$inject = ['DataService'];
  function InterestsController(DataService) {
    var vm = this;
    vm.activeFilter = 'all';
    vm.setFilter = function (filter) { vm.activeFilter = filter; };
  }
  app.controller('InterestsController', InterestsController);

  ProfileController.$inject = ['DataService', '$window'];
  function ProfileController(DataService, $window) {
    var vm = this;
    vm.profile = DataService.getCurrentUser();
    vm.saveProfile = function () { DataService.updateItem(vm.profile.id, vm.profile); };
  }
  app.controller('ProfileController', ProfileController);

  NotificationsController.$inject = ['DataService'];
  function NotificationsController(DataService) {
    var vm = this;
    vm.notifications = DataService.getItems();
    vm.markAllRead = function () { DataService.updateItem(1, { unread: false }); };
  }
  app.controller('NotificationsController', NotificationsController);

})();
