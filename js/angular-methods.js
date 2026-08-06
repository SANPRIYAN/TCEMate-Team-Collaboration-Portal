/**
 * TCEMate - AngularJS Factory & Controllers Reference File
 * Explicitly specifies the AngularJS Factory pattern and controller bindings.
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

  /*
   * REFACTOR NOTE (Service -> Factory):
   * AuthService converted from AngularJS .service() to AngularJS .factory().
   * In a Factory, we return a plain JS object exposing public methods.
   */
  app.factory('AuthService', function () {
    var loginKey = 'loggedIn';
    return {
      isLoggedIn: function () { return sessionStorage.getItem(loginKey) === 'true'; },
      login: function (email, password) { return { ok: true, message: 'Login successful!' }; },
      logout: function () { sessionStorage.setItem(loginKey, 'false'); }
    };
  });

  /*
   * REFACTOR NOTE (Service -> Factory with Core Logic Functions):
   * DataService converted from AngularJS .service() to AngularJS .factory().
   * Exposes core data manipulation functions: getItems(), addItem(), deleteItem(), updateItem().
   */
  app.factory('DataService', function () {
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
  });

  /*
   * REFACTOR NOTE (Controller using Factory):
   * Controller injects DataService and AuthService factories.
   * Calls factory methods (addItem, deleteItem, updateItem, getItems) for all business logic.
   */
  app.controller('LandingController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;
    vm.user = DataService.getCurrentUser();
    vm.projects = DataService.getProjects().slice(0, 2);
    vm.logout = function () { AuthService.logout(); $window.location.href = 'login.html'; };
  }]);

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

  app.controller('ProjectsController', ['DataService', function (DataService) {
    var vm = this;
    vm.projects = DataService.getItems();
    vm.filterProjects = function (project) { return true; };
  }]);

  app.controller('CreateListingController', ['DataService', '$window', function (DataService, $window) {
    var vm = this;
    vm.teamSize = 2;
    vm.listing = { title: '', description: '' };
    vm.submitListing = function () { DataService.addItem(vm.listing); };
  }]);

  app.controller('ApplicantsController', ['DataService', function (DataService) {
    var vm = this;
    vm.applicants = DataService.getItems();
    vm.handleApplicant = function (applicant) { vm.applicants = DataService.deleteItem(applicant.id); };
  }]);

  app.controller('InterestsController', ['DataService', function (DataService) {
    var vm = this;
    vm.activeFilter = 'all';
    vm.setFilter = function (filter) { vm.activeFilter = filter; };
  }]);

  app.controller('ProfileController', ['DataService', '$window', function (DataService, $window) {
    var vm = this;
    vm.profile = DataService.getCurrentUser();
    vm.saveProfile = function () { DataService.updateItem(vm.profile.id, vm.profile); };
  }]);

  app.controller('NotificationsController', ['DataService', function (DataService) {
    var vm = this;
    vm.notifications = DataService.getItems();
    vm.markAllRead = function () { DataService.updateItem(1, { unread: false }); };
  }]);

})();
