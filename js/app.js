(function () {
  'use strict';

  var app = angular.module('tcemate', []);

  app.filter('matchLabel', function () {
    return function (score) {
      score = Number(score) || 0;
      if (score >= 80) {
        return 'Strong Match';
      }
      if (score >= 50) {
        return 'Good Match';
      }
      return 'Low Match';
    };
  });

  app.controller('LandingController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.user = DataService.getCurrentUser();
    vm.storageUsed = 45;
    vm.stats = [
      { value: DataService.getProjects().filter(function (project) { return project.status === 'open'; }).length, label: 'Active Projects' },
      { value: DataService.getApplicants().length, label: 'Pending Requests' },
      { value: DataService.getTeams().length + 11, label: 'Connections' }
    ];
    vm.projects = DataService.getProjects().slice(0, 2);

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('LoginController', ['AuthService', '$window', function (AuthService, $window) {
    var vm = this;

    vm.mode = 'login';
    vm.loginData = { email: '', password: '' };
    vm.signupData = { fullName: '', email: '', regNo: '', phone: '', password: '' };
    vm.loginErrors = {};
    vm.signupErrors = {};

    if (AuthService.isLoggedIn()) {
      $window.location.href = 'index.html';
      return;
    }

    vm.toggleSignup = function () {
      vm.mode = 'signup';
    };

    vm.toggleLogin = function () {
      vm.mode = 'login';
    };

    vm.login = function () {
      var result = AuthService.login(vm.loginData.email, vm.loginData.password);
      if (result.ok) {
        $window.alert(result.message);
        $window.location.href = 'index.html';
      } else {
        vm.loginErrors = result.errors;
      }
    };

    vm.register = function () {
      var result = AuthService.register(vm.signupData);
      if (result.ok) {
        $window.alert(result.message);
        $window.location.href = 'index.html';
      } else {
        vm.signupErrors = result.errors;
      }
    };
  }]);

  app.controller('ProjectsController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.projects = DataService.getProjects();
    vm.searchText = '';
    vm.department = 'Information Technology';
    vm.year = '3rd Year';

    vm.filterProjects = function (project) {
      var search = (vm.searchText || '').toLowerCase();
      var searchMatch = !search || [project.title, project.description, project.type, project.department].join(' ').toLowerCase().indexOf(search) !== -1;
      var deptMatch = vm.department === 'All Departments' || project.department.indexOf(vm.department.replace(' Dept', '')) !== -1 || project.department === vm.department;
      var yearMatch = vm.year === 'Any Year' || project.year === vm.year;
      return searchMatch && deptMatch && yearMatch;
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('CreateListingController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.teamSize = 2;
    vm.listing = {
      title: '',
      type: '',
      description: '',
      department: 'Information Technology',
      year: '3rd Year',
      deadline: ''
    };
    vm.errors = {};

    vm.decreaseTeam = function () {
      if (vm.teamSize > 1) {
        vm.teamSize -= 1;
      }
    };

    vm.increaseTeam = function () {
      if (vm.teamSize < 10) {
        vm.teamSize += 1;
      }
    };

    vm.submitListing = function () {
      vm.errors = {};
      if (!vm.listing.title || vm.listing.title.length < 3) {
        vm.errors.title = 'Title must be at least 3 characters.';
      }
      if (!vm.listing.description || vm.listing.description.length < 10) {
        vm.errors.description = 'Description must be at least 10 characters.';
      }
      if (!vm.listing.deadline) {
        vm.errors.deadline = 'Please select a deadline.';
      }
      if (Object.keys(vm.errors).length) {
        return;
      }
      DataService.createListing(vm.listing, vm.teamSize);
      $window.alert('Listing published! (demo)');
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('ApplicantsController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.applicants = DataService.getApplicants();
    vm.teamMembers = DataService.getTeams();

    vm.getInitials = function (name) {
      return (name || '').split(' ').map(function (part) {
        return part.charAt(0);
      }).join('').slice(0, 2);
    };

    vm.handleApplicant = function (applicant) {
      vm.applicants = vm.applicants.filter(function (item) {
        return item.id !== applicant.id;
      });
      DataService.removeApplicant(applicant.id);
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('InterestsController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.interests = DataService.getInterests();
    vm.activeFilter = 'all';

    vm.filterByStatus = function (item) {
      return vm.activeFilter === 'all' || item.status === vm.activeFilter;
    };

    vm.setFilter = function (filter) {
      vm.activeFilter = filter;
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('ProfileController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.profile = DataService.getCurrentUser();
    vm.profile.preferences = vm.profile.preferences || { hackathon: true, internship: true };
    vm.errors = {};

    vm.getInitials = function (name) {
      return (name || '').split(' ').map(function (part) {
        return part.charAt(0);
      }).join('').slice(0, 2);
    };

    vm.saveProfile = function () {
      vm.errors = {};
      if (!/^[a-zA-Z\s]{2,}$/.test(vm.profile.name || '')) {
        vm.errors.name = 'Only letters and spaces are allowed.';
      }
      if (Object.keys(vm.errors).length) {
        return;
      }
      DataService.updateProfile(vm.profile);
      $window.alert('Profile updated! (demo)');
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('ForumController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.posts = DataService.getDiscussions();

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('CreatePostController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.post = { title: '', body: '' };
    vm.errors = {};

    vm.submitPost = function () {
      vm.errors = {};
      if (!/^[a-zA-Z0-9\s.,'?!-]{5,}$/.test(vm.post.title || '')) {
        vm.errors.title = 'Only letters, numbers and basic punctuation allowed.';
      }
      if (!vm.post.body || vm.post.body.length < 10) {
        vm.errors.body = 'Please write at least 10 characters.';
      }
      if (Object.keys(vm.errors).length) {
        return;
      }
      DataService.addDiscussion(vm.post);
      $window.alert('Posted to forum! (demo)');
      vm.post = { title: '', body: '' };
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);

  app.controller('NotificationsController', ['DataService', 'AuthService', '$window', function (DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.notifications = DataService.getNotifications();

    vm.markAllRead = function () {
      DataService.markAllNotificationsRead();
      vm.notifications = DataService.getNotifications();
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }]);
})();
