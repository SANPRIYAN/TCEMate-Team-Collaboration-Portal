(function () {
  'use strict';

  var app = angular.module('tcemate', ['ngAnimate', 'ngMessages']);
  app.constant('API_BASE_URL', 'http://localhost:5000/api');

  // Custom Filter
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

  // ----------------------------------------------------
  // CUSTOM DIRECTIVES FOR EVERY PAGE / MEMBER FEATURE
  // ----------------------------------------------------

  // 1. Dashboard: Stat Card Directive
  app.directive('statCardWidget', function () {
    return {
      restrict: 'E',
      scope: {
        stat: '='
      },
      template: '<article class="stat-card">' +
                '  <span class="stat-num">{{stat.value}}</span>' +
                '  <span class="stat-label">{{stat.label}}</span>' +
                '</article>'
    };
  });

  // 2. Browse & Dashboard: Project Card Directive
  app.directive('projectCardItem', function () {
    return {
      restrict: 'E',
      scope: {
        project: '='
        ,onApply: '&'
      },
      template: '<article class="listing-card">' +
                '  <div class="listing-head">' +
                '    <span class="tag">{{project.type}}</span>' +
                '    <span class="status" ng-class="{\'open\':project.status===\'open\',\'closed\':project.status===\'closed\'}">{{project.status | uppercase}}</span>' +
                '  </div>' +
                '  <h4>{{project.title}}</h4>' +
                '  <p>{{project.description}}</p>' +
                '  <div class="meta-row">' +
                '    <span class="dept-label">{{project.department}} Dept · {{project.year}}</span>' +
                '    <span>{{project.timeLabel}}</span>' +
                '  </div>' +
                '  <button type="button" class="btn-primary" ng-if="project.canApply" ng-disabled="project.applying || project.applied" ng-click="onApply({project: project})">{{project.applied ? "Applied" : (project.applying ? "Applying..." : "Show Interest")}}</button>' +
                '</article>'
    };
  });

  // 3. Forum: Thread Card Directive
  app.directive('forumThreadCard', function () {
    return {
      restrict: 'E',
      scope: {
        post: '='
      },
      template: '<article class="thread-card">' +
                '  <div class="thread-meta">' +
                '    <span class="tag">{{post.tag}}</span>' +
                '    <span class="posted-by">Posted by {{post.author}}</span>' +
                '  </div>' +
                '  <h4>{{post.title}}</h4>' +
                '  <p>{{post.body}}</p>' +
                '  <div class="thread-footer">' +
                '    <span>{{post.replies}} replies</span>' +
                '    <span>{{post.timeLabel}}</span>' +
                '  </div>' +
                '</article>'
    };
  });

  // 4. Create Post: Live Preview Card Directive
  app.directive('postPreviewCard', function () {
    return {
      restrict: 'E',
      scope: {
        post: '='
      },
      template: '<div class="thread-card ng-if-fade" style="margin-top: 1.5rem; background: #fdfbf7; border-style: dashed;" ng-if="post.title || post.body">' +
                '  <div class="thread-meta"><span class="tag">Live Preview</span><span class="posted-by">Draft</span></div>' +
                '  <h4>{{post.title || "Untitled Discussion"}}</h4>' +
                '  <p>{{post.body || "No details provided yet."}}</p>' +
                '</div>'
    };
  });

  // 5. Create Listing: Preview Card Directive
  app.directive('listingPreviewCard', function () {
    return {
      restrict: 'E',
      scope: {
        listing: '=',
        teamSize: '='
      },
      template: '<div class="listing-card ng-if-fade" style="margin-top: 1.5rem; background: #fdfbf7; border-style: dashed;" ng-if="listing.title || listing.description">' +
                '  <div class="listing-head">' +
                '    <span class="tag">{{listing.type || "Project Listing"}}</span>' +
                '    <span class="status open">DRAFT</span>' +
                '  </div>' +
                '  <h4>{{listing.title || "Untitled Project"}}</h4>' +
                '  <p>{{listing.description || "Description preview..."}}</p>' +
                '  <div class="meta-row">' +
                '    <span>{{listing.department || "IT"}} Dept · {{listing.year || "3rd Year"}}</span>' +
                '    <span>Team Size: {{teamSize}}</span>' +
                '  </div>' +
                '</div>'
    };
  });

  // 6. Manage Applicants: Applicant Card Directive
  app.directive('applicantRowCard', function () {
    return {
      restrict: 'E',
      scope: {
        applicant: '=',
        getInitials: '&',
        onAccept: '&',
        onReject: '&'
      },
      template: '<article class="applicant-row">' +
                '  <div class="applicant-avatar">{{ getInitials({name: applicant.name}) }}</div>' +
                '  <div class="applicant-info">' +
                '    <h4>{{ applicant.name }} <span class="reg-id">{{ applicant.regNo }}</span></h4>' +
                '    <p>{{ applicant.department }} · {{ applicant.year }} · Skills: {{ applicant.skills.join(", ") }}</p>' +
                '    <p class="sub">{{ applicant.matchScore | matchLabel }}</p>' +
                '  </div>' +
                '  <div class="applicant-actions">' +
                '    <span class="status-pill" ng-if="applicant.status !== \'pending\'">{{applicant.status | uppercase}}</span>' +
                '    <button class="btn-accept" ng-if="applicant.status === \'pending\'" ng-click="onAccept({applicant: applicant})">Accept</button>' +
                '    <button class="btn-reject" ng-if="applicant.status === \'pending\'" ng-click="onReject({applicant: applicant})">Reject</button>' +
                '  </div>' +
                '</article>'
    };
  });

  // 7. My Interests: Interest Row Directive
  app.directive('interestRowItem', function () {
    return {
      restrict: 'E',
      scope: {
        item: '='
      },
      template: '<article class="interest-row" data-status="{{item.status}}">' +
                '  <div class="interest-info">' +
                '    <h4>{{item.projectDetails.title || item.title}}</h4>' +
                '    <p>{{item.projectDetails.description || item.details}}</p>' +
                '    <small>{{item.createdAt | date:"medium"}}</small>' +
                '  </div>' +
                '  <span class="status-pill" ng-class="{\'pending\': item.status===\'pending\', \'accepted\': item.status===\'accepted\', \'rejected\': item.status===\'rejected\'}">{{item.status | uppercase}}</span>' +
                '</article>'
    };
  });

  // 8. Notifications: Alert Directive
  app.directive('notificationItemCard', function () {
    return {
      restrict: 'E',
      scope: {
        notification: '='
        ,onRead: '&'
      },
      template: '<article class="notif-item" ng-class="{\'unread\': notification.unread}">' +
                '  <div class="notif-icon">{{notification.icon}}</div>' +
                '  <div class="notif-body">' +
                '    <h4>{{notification.title}}</h4>' +
                '    <p>{{notification.message}}</p>' +
                '    <span class="notif-time">{{notification.timeLabel}}</span>' +
                '    <button type="button" class="btn-secondary" ng-if="notification.unread" ng-click="onRead({notification: notification})">Mark as read</button>' +
                '  </div>' +
                '</article>'
    };
  });

  // 9. Profile View: Portfolio Card Directive
  app.directive('portfolioProjectCard', function () {
    return {
      restrict: 'E',
      scope: {
        project: '='
      },
      template: '<article class="portfolio-card">' +
                '  <h4>{{project}}</h4>' +
                '  <p>Role: {{ project === "AI Career Intelligence Platform" ? "NLP & Matching Logic" : "Backend Developer" }}</p>' +
                '  <span class="status" ng-class="{\'open\': project === "AI Career Intelligence Platform", \'closed\': project === "TCE Parking Portal"}">{{ project === "AI Career Intelligence Platform" ? "Active" : "Completed" }}</span>' +
                '</article>'
    };
  });

  // 10. Edit Profile: Skill Badge List Directive
  app.directive('skillBadgeList', function () {
    return {
      restrict: 'E',
      scope: {
        skills: '='
      },
      template: '<ul class="skill-tags">' +
                '  <li class="skill-tag" ng-repeat="skill in skills">{{skill}}</li>' +
                '</ul>'
    };
  });

  // 11. Login: Auth Header Directive
  app.directive('authBrandingHeader', function () {
    return {
      restrict: 'E',
      template: '<div style="text-align: center; margin-bottom: 1rem;">' +
                '  <h3 style="color: var(--primary); font-weight: 700;">Thiagarajar College of Engineering</h3>' +
                '  <p style="font-size: 0.85rem; color: var(--text-muted);">Department of Information Technology</p>' +
                '</div>'
    };
  });


  // ----------------------------------------------------
  // CONTROLLERS WITH MINIFICATION-SAFE DEPENDENCY INJECTION ($inject)
  // ----------------------------------------------------

  // 1. Landing Controller
  LandingController.$inject = ['DataService', 'AuthService', '$window'];
  function LandingController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    DataService.getCurrentUser().then(function (user) {
      vm.user = user || { name: 'Student', department: 'Information Technology', year: '3rd Year', section: 'Section A' };
    });

    vm.storageUsed = 45;
    DataService.getLandingStats().then(function (stats) {
      vm.stats = stats;
    });

    DataService.getProjects().then(function (projects) {
      vm.projects = (projects || []).slice(0, 2);
    });

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('LandingController', LandingController);

  // 2. Login Controller
  LoginController.$inject = ['AuthService', '$window'];
  function LoginController(AuthService, $window) {
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
      AuthService.login(vm.loginData.email, vm.loginData.password).then(function (result) {
        if (result && result.ok) {
          $window.alert(result.message || 'Login successful! Redirecting...');
          $window.location.href = 'index.html';
        } else {
          vm.loginErrors = {};
          if (result && result.message) {
            vm.loginErrors.email = result.message;
          }
        }
      });
    };

    vm.register = function () {
      AuthService.register(vm.signupData).then(function (result) {
        if (result && result.ok) {
          $window.alert(result.message || 'Account created! Redirecting...');
          $window.location.href = 'index.html';
        } else {
          vm.signupErrors = {};
          if (result && result.message) {
            vm.signupErrors.email = result.message;
          }
        }
      });
    };
  }
  app.controller('LoginController', LoginController);

  // 3. Projects Controller (Browse)
  ProjectsController.$inject = ['DataService', 'AuthService', '$window'];
  function ProjectsController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    vm.projects = [];
    vm.currentUser = AuthService.getUser();
    DataService.getProjects().then(function (projects) {
      DataService.getMyApplications().then(function (applications) {
        var applied = {};
        (applications || []).forEach(function (application) {
          var projectId = application.projectDetails && application.projectDetails.id;
          if (!projectId && application.project) {
            projectId = application.project.id || application.project._id || application.project;
          }
          if (projectId) applied[projectId.toString()] = true;
        });
        vm.projects = (projects || []).map(function (project) {
          project.canApply = project.status === 'open' && (!project.createdBy || project.createdBy !== (vm.currentUser && vm.currentUser.id));
          project.applied = !!applied[project.id.toString()];
          return project;
        });
      });
    });
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

    vm.applyToProject = function (project) {
      if (project.applying || project.applied) return;
      project.applying = true;
      DataService.applyToProject(project, vm.currentUser).then(function (response) {
        project.applying = false;
        if (response && response.success) {
          project.applied = true;
          $window.alert('Your interest has been submitted.');
        } else {
          $window.alert(response && response.message ? response.message : 'Unable to submit your interest.');
        }
      });
    };
  }
  app.controller('ProjectsController', ProjectsController);

  // 4. Create Listing Controller
  CreateListingController.$inject = ['DataService', 'AuthService', '$window'];
  function CreateListingController(DataService, AuthService, $window) {
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
      DataService.createListing(vm.listing, vm.teamSize).then(function (response) {
        if (response && response.success) {
          $window.alert('Listing published successfully.');
          vm.listing = {
            title: '',
            type: '',
            description: '',
            department: 'Information Technology',
            year: '3rd Year',
            deadline: ''
          };
        } else {
          $window.alert(response && response.message ? response.message : 'Unable to publish listing.');
        }
      });
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('CreateListingController', CreateListingController);

  // 5. Applicants Controller (Manage Applicants)
  ApplicantsController.$inject = ['DataService', 'AuthService', '$window'];
  function ApplicantsController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    DataService.getApplicants().then(function (applicants) {
      vm.applicants = applicants || [];
    });
    vm.teamMembers = DataService.getTeams();

    vm.getInitials = function (name) {
      return (name || '').split(' ').map(function (part) {
        return part.charAt(0);
      }).join('').slice(0, 2);
    };

    vm.updateApplicant = function (applicant, status) {
      if (applicant.updating) return;
      applicant.updating = true;
      DataService.updateApplicantStatus(applicant.id, status).then(function (response) {
        applicant.updating = false;
        if (response && response.success) {
          applicant.status = status;
          $window.alert(status === 'accepted' ? 'Applicant accepted.' : 'Applicant rejected.');
        } else {
          $window.alert(response && response.message ? response.message : 'Unable to update applicant.');
        }
      });
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('ApplicantsController', ApplicantsController);

  // 6. Interests Controller
  InterestsController.$inject = ['DataService', 'AuthService', '$window'];
  function InterestsController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    DataService.getInterests().then(function (interests) {
      vm.interests = interests || [];
    });
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
  }
  app.controller('InterestsController', InterestsController);

  // 7. Profile Controller
  ProfileController.$inject = ['DataService', 'AuthService', '$window'];
  function ProfileController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    DataService.getCurrentUser().then(function (user) {
      vm.profile = user || { name: 'Student', department: 'Information Technology', year: '3rd Year', section: 'Section A', preferences: { hackathon: true, internship: true } };
      vm.profile.preferences = vm.profile.preferences || { hackathon: true, internship: true };
    });
    vm.errors = {};

    vm.getInitials = function (name) {
      return (name || '').split(' ').map(function (part) {
        return part.charAt(0);
      }).join('').slice(0, 2);
    };

    vm.saveProfile = function () {
      vm.errors = {};
      if (!/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/.test((vm.profile.name || '').trim())) {
        vm.errors.name = 'Use letters, spaces, apostrophes, or hyphens only.';
      }
      if (Object.keys(vm.errors).length) {
        return;
      }
      DataService.updateProfile(vm.profile).then(function (updatedUser) {
        if (updatedUser) {
          vm.profile = updatedUser;
          $window.alert('Profile updated successfully.');
        } else {
          $window.alert('Unable to update profile.');
        }
      });
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('ProfileController', ProfileController);

  // 8. Forum Controller
  ForumController.$inject = ['DataService', 'AuthService', '$window'];
  function ForumController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    DataService.getDiscussions().then(function (posts) {
      vm.posts = posts || [];
    });

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('ForumController', ForumController);

  // 9. Create Post Controller
  CreatePostController.$inject = ['DataService', 'AuthService', '$window'];
  function CreatePostController(DataService, AuthService, $window) {
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
      DataService.addDiscussion(vm.post).then(function (response) {
        if (response && response.success) {
          $window.alert('Posted to forum successfully.');
          vm.post = { title: '', body: '' };
          return DataService.getDiscussions().then(function (posts) {
            vm.posts = posts || [];
          });
        }
        $window.alert(response && response.message ? response.message : 'Unable to create post.');
      });
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('CreatePostController', CreatePostController);

  // 10. Notifications Controller
  NotificationsController.$inject = ['DataService', 'AuthService', '$window'];
  function NotificationsController(DataService, AuthService, $window) {
    var vm = this;

    if (!AuthService.isLoggedIn() && $window.location.href.indexOf('login.html') === -1) {
      $window.location.href = 'login.html';
      return;
    }

    DataService.getNotifications().then(function (notifications) {
      vm.notifications = notifications || [];
    });

    vm.markRead = function (notification) {
      if (!notification.unread || notification.updating) return;
      notification.updating = true;
      DataService.markNotificationRead(notification.id).then(function (response) {
        notification.updating = false;
        if (response && response.success) notification.unread = false;
      });
    };

    vm.markAllRead = function () {
      DataService.markAllNotificationsRead().then(function (response) {
        if (response && response.success) {
          vm.notifications = vm.notifications.map(function (item) {
            item.unread = false;
            return item;
          });
        }
      });
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('NotificationsController', NotificationsController);

})();
