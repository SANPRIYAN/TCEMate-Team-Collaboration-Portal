(function () {
  'use strict';

  var app = angular.module('tcemate', ['ngMessages']);
  var configuredApiUrl = window.TCEMateConfig && window.TCEMateConfig.apiBaseUrl;
  var localHost = ['localhost', '127.0.0.1'].indexOf(window.location.hostname) !== -1;
  app.constant('API_BASE_URL', (configuredApiUrl || (localHost ? 'http://localhost:5000/api' : window.location.origin + '/api')).replace(/\/+$/, ''));

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
        ,onOpen: '&'
      },
      template: '<article class="listing-card">' +
                '  <div class="card-top">' +
                '    <div class="card-avatar">{{project.title.charAt(0).toUpperCase()}}</div>' +
                '    <div class="card-top-meta">' +
                '      <div class="listing-head">' +
                '        <span class="tag">{{project.type || \'Project\'}}</span>' +
                '        <span class="status" ng-class="{\'open\':project.status===\'open\',\'closed\':project.status===\'closed\'}">{{project.status | uppercase}}</span>' +
                '      </div>' +
                '      <h4>{{project.title}}</h4>' +
                '    </div>' +
                '  </div>' +
                '  <p class="card-desc">{{project.description}}</p>' +
                '  <p class="field-helper" ng-if="project.requiredSkills.length"><strong>Required skills:</strong> {{project.requiredSkills.join(", ")}}</p>' +
                '  <p class="field-helper" ng-if="project.match"><strong>{{project.match.matchPercentage}}% match</strong><span ng-if="project.match.missingSkills.length"> · Missing: {{project.match.missingSkills.join(", ")}}</span><span ng-if="project.match.eligible"> · Eligible to apply</span></p>' +
                '  <div class="card-footer">' +
                '    <span class="meta-row" style="margin-top:0;"><span>{{project.department}} · {{project.year}}</span></span>' +
                '    <span style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
                '      <button type="button" class="card-cta-secondary" ng-click="onOpen({project: project})">View →</button>' +
                '      <button type="button" class="card-cta" ng-if="project.canApply" ng-disabled="project.applying || project.applied || (project.match && !project.match.eligible)" ng-click="onApply({project: project})">{{project.applied ? \'Applied\' : (project.applying ? \'Applying...\' : (project.match && !project.match.eligible ? \'Skills Missing\' : \'Show Interest\'))}}</button>' +
                '    </span>' +
                '  </div>' +
                '</article>'
    };
  });

  // 3. Forum: Thread Card Directive
  app.directive('forumThreadCard', function () {
    return {
      restrict: 'E',
      scope: { post: '=', onSelect: '&' },
      template: '<article class="thread-card" ng-click="onSelect({post: post})" style="cursor: pointer;">' +
                '  <div class="thread-card-top">' +
                '    <div class="thread-avatar">{{(post.author || \'?\').charAt(0).toUpperCase()}}</div>' +
                '    <div class="thread-body">' +
                '      <div class="thread-meta"><span class="tag">{{post.tag || \'Discussion\'}}</span><span class="posted-by">{{post.author}}</span></div>' +
                '      <h4>{{post.title}}</h4>' +
                '    </div>' +
                '  </div>' +
                '  <p class="thread-preview">{{post.body}}</p>' +
                '  <div class="thread-footer">' +
                '    <span>{{post.replies || 0}} comments &middot; <time>{{post.createdAt | date:"MMM d, yyyy"}}</time></span>' +
                '    <a class="thread-view-link" ng-href="forum.html?id={{post.id}}">Read discussion →</a>' +
                '  </div>' +
                '</article>'
    };
  });

  // Reddit Comment Item Directive
  app.directive('redditCommentItem', function () {
    return {
      restrict: 'E',
      scope: {
        comment: '=',
        allComments: '=',
        onVote: '&',
        onReply: '&',
        getInitials: '&'
      },
      template:
        '<div class="reddit-comment-node">' +
        '  <div class="comment-main-content">' +
        '    <div class="comment-header">' +
        '      <span class="comment-avatar">{{getInitials({name: comment.author})}}</span>' +
        '      <strong class="comment-author">{{comment.author}}</strong>' +
        '      <span class="comment-date">{{comment.createdAt | date:"MMM d, h:mm a"}}</span>' +
        '    </div>' +
        '    <div class="comment-body-text">{{comment.text}}</div>' +
        '    <div class="comment-actions">' +
        '      <button type="button" class="comment-reply-btn" ng-click="showReplyForm = !showReplyForm">Reply</button>' +
        '    </div>' +
        '    <div class="comment-reply-box" ng-if="showReplyForm">' +
        '      <textarea ng-model="replyText" placeholder="Write a nested reply..." rows="2" class="comment-textarea"></textarea>' +
        '      <div class="reply-box-actions">' +
        '        <button type="button" class="btn-secondary small" ng-click="showReplyForm = false">Cancel</button>' +
        '        <button type="button" class="btn-primary small" ng-disabled="!replyText || !replyText.trim()" ng-click="onReply({parentId: comment.id, text: replyText}); replyText=\'\'; showReplyForm=false;">Post Reply</button>' +
        '      </div>' +
        '    </div>' +
        '    <div class="comment-children" ng-if="hasChildren()">' +
        '      <reddit-comment-item ng-repeat="child in getChildren()" comment="child" all-comments="allComments" on-vote="onVote({comment: comment, dir: dir})" on-reply="onReply({parentId: parentId, text: text})" get-initials="getInitials({name: name})"></reddit-comment-item>' +
        '    </div>' +
        '  </div>' +
        '</div>',
      link: function (scope) {
        scope.getChildren = function () {
          if (!scope.allComments || !scope.comment) return [];
          return scope.allComments.filter(function (c) {
            return String(c.parentId || '') === String(scope.comment.id || scope.comment._id);
          });
        };
        scope.hasChildren = function () {
          return scope.getChildren().length > 0;
        };
      }
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
                '  <p class="field-helper" ng-if="listing.requiredSkills.length"><strong>Required skills:</strong> {{listing.requiredSkills.join(", ")}}</p>' +
                '  <div class="meta-row">' +
                '    <span><span ng-if="listing.department">{{listing.department}} Dept</span><span ng-if="listing.year"> · {{listing.year}}</span></span>' +
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
        onReject: '&',
        onReconsider: '&'
      },
      template: '<article class="applicant-row">' +
                '  <div class="applicant-avatar">{{ getInitials({name: applicant.name}) }}</div>' +
                '  <div class="applicant-info">' +
                '    <h4>{{ applicant.name }} <span class="reg-id">{{ applicant.regNo }}</span></h4>' +
                '    <p>{{ applicant.department }} · {{ applicant.year }}</p>' +
                '    <p ng-if="applicant.skills && applicant.skills.length"><strong>Student skills:</strong> {{ applicant.skills.join(", ") }}</p>' +
                '    <p class="sub">{{ applicant.matchScore | matchLabel }}</p>' +
                '  </div>' +
                '  <div class="applicant-actions">' +
                '    <span class="status-pill" ng-class="applicant.status">{{applicant.status | uppercase}}</span>' +
                '    <button class="btn-accept" ng-if="applicant.status !== \'accepted\'" ng-click="onAccept({applicant: applicant})">Accept</button>' +
                '    <button class="btn-reject" ng-if="applicant.status === \'pending\'" ng-click="onReject({applicant: applicant})">Reject</button>' +
                '    <button class="btn-reconsider" style="background:#edf4f9;color:#0d2d49;border:1px solid #cbd8e1;padding:0.45rem 0.8rem;border-radius:5px;font-weight:600;cursor:pointer;" ng-if="applicant.status === \'rejected\'" ng-click="onReconsider({applicant: applicant})">Reconsider</button>' +
                '  </div>' +
                '</article>'
    };
  });

  // 7. My Interests: Interest Row Directive
  app.directive('interestRowItem', function () {
    return {
      restrict: 'E',
      scope: { item: '=' },
      template: '<article class="interest-card">' +
                '  <div class="interest-card-icon">★</div>' +
                '  <div class="interest-card-body">' +
                '    <h4>{{item.projectDetails.title || item.title || \'Project\'}}</h4>' +
                '    <p>{{item.projectDetails.description || item.details}}</p>' +
                '    <small>Applied · {{item.createdAt | date:"MMM d, yyyy"}}</small>' +
                '  </div>' +
                '  <div class="interest-card-status">' +
                '    <span class="status-pill" ng-class="{\'pending\': item.status===\'pending\', \'accepted\': item.status===\'accepted\', \'rejected\': item.status===\'rejected\'}">{{item.status | uppercase}}</span>' +
                '  </div>' +
                '</article>'
    };
  });

  // 8. Notifications: Alert Directive
  app.directive('notificationItemCard', function () {
    return {
      restrict: 'E',
      scope: { notification: '=', onRead: '&' },
      template: '<article class="notif-card" ng-class="{\'unread\': notification.unread}">' +
                '  <div class="notif-dot-wrap">{{notification.icon || \'!\'  }}</div>' +
                '  <div class="notif-card-body">' +
                '    <h4>{{notification.title}}</h4>' +
                '    <p>{{notification.message}}</p>' +
                '    <span class="notif-card-time">{{notification.createdAt ? (notification.createdAt | date:"MMM d, yyyy · h:mm a") : notification.timeLabel}}</span>' +
                '  </div>' +
                '  <div class="notif-card-action" ng-if="notification.unread">' +
                '    <button type="button" ng-click="onRead({notification: notification})">Mark read</button>' +
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
            '  <h4>{{project.title || project}}</h4>' +
            '  <p ng-if="project.description">{{project.description}}</p>' +
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
                '  <li class="skill-tag" ng-repeat="skill in skills track by (skill.id || skill.name || skill)"><span>{{skill.name || skill}}</span></li>' +
                '</ul>'
    };
  });

  // 11. Login: Auth Header Directive
  app.directive('authBrandingHeader', function () {
    return {
      restrict: 'E',
      template: '<div style="text-align: center; margin-bottom: 1.25rem;">' +
                '  <img src="assets/tce-logo.png" alt="TCE Crest Logo" class="auth-brand-logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 0.5rem;" />' +
                '  <h3 style="color: var(--primary); font-weight: 700; margin: 0; font-size: 1.15rem;">Thiagarajar College of Engineering</h3>' +
                '  <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Student Team Collaboration Portal</p>' +
                '</div>'
    };
  });

  app.directive('tcemateAppNav', ['AuthService', '$window', function (AuthService, $window) {
    return {
      restrict: 'E',
      scope: {
        active: '@',
        onLogout: '&'
      },
      template: '<header class="app-nav-shell">' +
                '  <a class="app-nav-brand" ng-href="{{isLoggedIn ? (user.role === \'admin\' ? \'admin.html\' : \'dashboard.html\') : \'index.html\'}}"><img src="assets/tce-logo.png" alt="TCE Logo" class="brand-logo-img" style="width: 36px; height: 36px; object-fit: contain; vertical-align: middle; margin-right: 6px;" /><span>TCEMate</span></a>' +
                '  <nav class="app-nav-links" aria-label="Application navigation">' +
                '    <span ng-if="isLoggedIn && user.role !== \'admin\'" class="app-nav-student-links">' +
                '      <a href="dashboard.html" ng-class="{active: active === \'dashboard\'}" ng-attr-aria-current="{{active === \'dashboard\' ? \'page\' : undefined}}">Dashboard</a>' +
                '      <a href="browse.html" ng-class="{active: active === \'browse\'}" ng-attr-aria-current="{{active === \'browse\' ? \'page\' : undefined}}">Browse</a>' +
                '      <a href="forum.html" ng-class="{active: active === \'forum\'}" ng-attr-aria-current="{{active === \'forum\' ? \'page\' : undefined}}">Forum</a>' +
                '      <a href="manage-applicants.html" ng-class="{active: active === \'listings\'}" ng-attr-aria-current="{{active === \'listings\' ? \'page\' : undefined}}">My Listings</a>' +
                '      <a href="my-interests.html" ng-class="{active: active === \'interests\'}" ng-attr-aria-current="{{active === \'interests\' ? \'page\' : undefined}}">Interests</a>' +
                '      <a href="notifications.html" ng-class="{active: active === \'notifications\'}" ng-attr-aria-current="{{active === \'notifications\' ? \'page\' : undefined}}">Notifications</a>' +
                '      <a href="profile-view.html" ng-class="{active: active === \'profile\'}" ng-attr-aria-current="{{active === \'profile\' ? \'page\' : undefined}}">Profile</a>' +
                '    </span>' +
                '    <span ng-if="isLoggedIn && user.role === \'admin\'" class="app-nav-admin-links">' +
                '      <a href="admin.html" ng-class="{active: active === \'admin\'}" ng-attr-aria-current="{{active === \'admin\' ? \'page\' : undefined}}">Dashboard</a>' +
                '      <a href="admin-students.html" ng-class="{active: active === \'students\'}" ng-attr-aria-current="{{active === \'students\' ? \'page\' : undefined}}">Students</a>' +
                '      <a href="admin-projects.html" ng-class="{active: active === \'projects\'}" ng-attr-aria-current="{{active === \'projects\' ? \'page\' : undefined}}">Projects</a>' +
                '      <a href="admin-interests.html" ng-class="{active: active === \'interests\'}" ng-attr-aria-current="{{active === \'interests\' ? \'page\' : undefined}}">Interests</a>' +
                '      <a href="admin-moderation.html" ng-class="{active: active === \'moderation\'}" ng-attr-aria-current="{{active === \'moderation\' ? \'page\' : undefined}}">Moderation</a>' +
                '    </span>' +
                '    <span ng-if="!isLoggedIn" class="app-nav-guest-links" style="display:inline-flex;align-items:center;gap:0.65rem;">' +
                '      <a href="index.html">Home</a>' +
                '      <a href="browse.html" ng-class="{active: active === \'browse\'}">Browse</a>' +
                '      <a href="forum.html" ng-class="{active: active === \'forum\'}">Forum</a>' +
                '      <a href="login.html" class="nav-btn-outline">Log in</a>' +
                '      <a href="login.html#signup" class="nav-btn-outline">Register</a>' +
                '    </span>' +
                '    <button type="button" class="app-nav-logout" ng-if="isLoggedIn" ng-click="onLogout()">Log out</button>' +
                '  </nav>' +
                '</header>',
      link: function (scope) {
        scope.isLoggedIn = AuthService.isLoggedIn();
        scope.user = scope.isLoggedIn ? (AuthService.getUser() || {}) : {};
        var currentPage = ($window.location.pathname.split('/').pop() || '').toLowerCase();
        var adminPage = /^admin(?:-[a-z]+)*\.html$/.test(currentPage);
        if (scope.isLoggedIn && scope.user.role === 'admin' && !adminPage) {
          $window.location.replace('admin.html');
        } else if (scope.isLoggedIn && scope.user.role !== 'admin' && adminPage) {
          $window.location.replace('login.html#admin');
        }
      }
    };
  }]);


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

    vm.dashboard = { stats: [], projects: [], notifications: [] };
    vm.dashboardLoading = true;
    DataService.getCurrentUser().then(function (user) {
      if (user && user.role === 'admin') {
        $window.location.replace('admin.html');
        return;
      }
      vm.user = user || {};
      return DataService.getDashboardData().then(function (dashboard) {
        vm.dashboard = dashboard;
        vm.dashboardLoading = false;
      });
    }).catch(function () {
      vm.dashboardLoading = false;
    });

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };

  }
  app.controller('LandingController', LandingController);

  // 2. Login Controller
  LoginController.$inject = ['AuthService', '$window', '$timeout'];
  function LoginController(AuthService, $window, $timeout) {
    var vm = this;

    vm.mode = $window.location.hash === '#signup' ? 'signup' : 'login';
    vm.loginData = { email: '', password: '' };
    vm.signupData = { fullName: '', email: '', regNo: '', phone: '', password: '' };
    vm.loginErrors = {};
    vm.signupErrors = {};
    vm.authTransition = false;
    vm.adminSetupAvailable = false;
    vm.adminSetupData = { fullName: '', email: '', password: '', confirmPassword: '', setupSecret: '' };
    AuthService.getAdminSetupStatus().then(function (result) {
      vm.adminSetupAvailable = !!(result && result.success && result.available);
    });

    if (AuthService.isLoggedIn()) {
      var currentUser = AuthService.getUser() || {};
      $window.location.href = currentUser.role === 'admin' ? 'admin.html' : 'dashboard.html';
      return;
    }

    vm.toggleSignup = function () {
      vm.mode = 'signup';
    };

    vm.toggleLogin = function () {
      vm.mode = 'login';
    };

    vm.showAdminSetup = function () {
      vm.mode = 'adminSetup';
      vm.adminSetupError = '';
      vm.adminSetupMessage = '';
    };

    vm.resetData = { email: '', passkey: '', newPassword: '' };

    vm.showForgotPassword = function () {
      vm.mode = 'forgot';
      vm.resetData = { email: vm.loginData.email || '', passkey: '', newPassword: '' };
      vm.resetMessage = '';
      vm.resetError = '';
      vm.resetLoading = false;
    };

    vm.requestPasswordReset = function () {
      AuthService.requestPasswordReset(vm.resetData.email || vm.resetEmail).then(function (result) {
        if (result && result.success) {
          vm.resetMessage = result.message;
          vm.resetError = '';
        } else {
          vm.resetError = result && result.message ? result.message : 'Unable to request a password reset.';
        }
      });
    };

    vm.resetPasswordWithPasskey = function (form) {
      if (form && form.$invalid) {
        vm.resetError = 'Please fill out all required fields correctly.';
        return;
      }
      if (!vm.resetData.email || !vm.resetData.passkey || !vm.resetData.newPassword) {
        vm.resetError = 'Email, unique passkey, and new password are required.';
        return;
      }
      vm.resetError = '';
      vm.resetMessage = '';
      vm.resetLoading = true;
      AuthService.resetPasswordWithPasskey(vm.resetData.email, vm.resetData.passkey, vm.resetData.newPassword)
        .then(function (result) {
          vm.resetLoading = false;
          if (result && result.success) {
            vm.resetMessage = result.message || 'Password updated successfully!';
            setTimeout(function () {
              $scope.$apply(function () {
                vm.mode = 'login';
                vm.loginData.email = vm.resetData.email;
              });
            }, 1800);
          } else {
            vm.resetError = result && result.message ? result.message : 'Unable to reset password.';
          }
        });
    };

    vm.login = function () {
      var emailTrimmed = (vm.loginData.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        vm.loginErrors.email = 'Please enter a valid email address.';
        return;
      }
      AuthService.login(vm.loginData.email, vm.loginData.password).then(function (result) {
        if (result && result.ok) {
          $window.location.href = result.user && result.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        } else {
          vm.loginErrors = {};
          if (result && result.message) {
            vm.loginErrors.email = result.message;
          }
        }
      });
    };

    vm.register = function (form) {
      vm.signupFormMessage = '';
      if (form && form.$invalid) {
        form.$setSubmitted();
        return;
      }
      AuthService.register(vm.signupData).then(function (result) {
        if (result && result.ok) {
          vm.mode = 'login';
          vm.loginData.email = result.email;
          vm.loginData.password = '';
          vm.verificationMessage = result.message;
          vm.signupData.password = '';
        } else {
          vm.signupErrors = {};
          vm.signupFormMessage = result && result.message ? result.message : 'Registration failed. Please review the form and try again.';
        }
      });
    };

    vm.startAdminSetup = function (form) {
      vm.adminSetupError = '';
      if (form && form.$invalid) {
        form.$setSubmitted();
        return;
      }
      if (vm.adminSetupData.password !== vm.adminSetupData.confirmPassword) {
        vm.adminSetupError = 'Passwords do not match.';
        return;
      }
      AuthService.startAdminSetup(vm.adminSetupData).then(function (result) {
        if (result && result.success) {
          vm.adminSetupAvailable = false;
          vm.mode = 'login';
          vm.loginData.email = vm.adminSetupData.email;
          vm.loginData.password = '';
          vm.verificationMessage = result.message;
          vm.adminSetupData.password = '';
          vm.adminSetupData.confirmPassword = '';
          vm.adminSetupData.setupSecret = '';
        } else {
          vm.adminSetupError = result && result.message ? result.message : 'Administrator setup could not be started.';
        }
      });
    };

    vm.backToLogin = function () {
      vm.mode = 'login';
      vm.adminSetupData.setupSecret = '';
      vm.adminSetupData.password = '';
      vm.adminSetupData.confirmPassword = '';
    };
  }
  app.controller('LoginController', LoginController);

  ResetPasswordController.$inject = ['AuthService', '$window'];
  function ResetPasswordController(AuthService, $window) {
    var vm = this;
    vm.token = new URLSearchParams($window.location.search).get('token') || '';
    vm.password = '';
    vm.confirmPassword = '';
    vm.error = '';
    vm.notice = '';
    vm.submit = function () {
      vm.error = '';
      if (!vm.token) {
        vm.error = 'This password reset link is missing its token.';
        return;
      }
      if (vm.password !== vm.confirmPassword) {
        vm.error = 'The passwords do not match.';
        return;
      }
      AuthService.resetPassword(vm.token, vm.password).then(function (response) {
        if (response && response.success) {
          vm.notice = response.message;
          vm.password = '';
          vm.confirmPassword = '';
          $window.history.replaceState({}, document.title, $window.location.pathname);
        } else {
          vm.error = response && response.message ? response.message : 'Unable to reset your password.';
        }
      });
    };
  }
  app.controller('ResetPasswordController', ResetPasswordController);

  EmailVerificationController.$inject = ['AuthService', '$window'];
  function EmailVerificationController(AuthService, $window) {
    var vm = this;
    var token = new URLSearchParams($window.location.search).get('token') || '';
    vm.loading = true;
    vm.error = '';
    vm.notice = '';
    if (!token) {
      vm.loading = false;
      vm.error = 'This verification link is missing its token.';
      return;
    }
    AuthService.verifyEmail(token).then(function (result) {
      vm.loading = false;
      if (result && result.success) {
        vm.notice = result.message;
        $window.history.replaceState({}, document.title, $window.location.pathname);
      } else {
        vm.error = result && result.message ? result.message : 'Email verification could not be completed.';
      }
    });
  }
  app.controller('EmailVerificationController', EmailVerificationController);

  // 3. Projects Controller (Browse)
  ProjectsController.$inject = ['DataService', 'AuthService', '$window'];
  function ProjectsController(DataService, AuthService, $window) {
    var vm = this;

    vm.isLoggedIn = AuthService.isLoggedIn();
    vm.currentUser = vm.isLoggedIn ? AuthService.getUser() : null;

    vm.projects = [];
    vm.loading = true;
    vm.notice = '';
    vm.error = '';

    var fetchAppsPromise = vm.isLoggedIn ? DataService.getMyApplications() : Promise.resolve([]);

    DataService.getProjects().then(function (projects) {
      return fetchAppsPromise.then(function (applications) {
        var applied = {};
        (applications || []).forEach(function (application) {
          var projectId = application.projectDetails && application.projectDetails.id;
          if (!projectId && application.project) {
            projectId = application.project.id || application.project._id || application.project;
          }
          if (projectId) applied[projectId.toString()] = true;
        });
        vm.projects = (projects || []).map(function (project) {
          var ownerId = project.createdBy && typeof project.createdBy === 'object'
            ? (project.createdBy.id || project.createdBy._id)
            : project.createdBy;
          project.canApply = project.status === 'open' && String(ownerId || '') !== String(vm.currentUser && vm.currentUser.id || '');
          project.applied = !!applied[project.id.toString()];
          return project;
        });
        vm.loading = false;
      });
    }).catch(function () {
      vm.loading = false;
      vm.error = 'Unable to load projects. Please try again.';
    });

    vm.searchText = '';
    vm.department = 'All Departments';
    vm.year = 'Any Year';

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

    vm.openProject = function (project) {
      if (project && project.id) {
        $window.location.href = 'project-details.html?id=' + encodeURIComponent(project.id);
      }
    };

    vm.retryLoad = function () {
      $window.location.reload();
    };

    vm.applyToProject = function (project) {
      if (!vm.isLoggedIn) {
        $window.location.href = 'login.html';
        return;
      }
      if (project.applying || project.applied) return;
      project.applying = true;
      DataService.applyToProject(project, vm.currentUser).then(function (response) {
        project.applying = false;
        if (response && response.success) {
          project.applied = true;
          vm.notice = 'Your interest has been submitted.';
        } else {
          vm.actionError = response && response.message ? response.message : 'Unable to submit your interest.';
          if (response && response.missingSkills && response.missingSkills.length) {
            vm.actionError += ' Missing skills: ' + response.missingSkills.join(', ') + '.';
          }
        }
      });
    };
  }
  app.controller('ProjectsController', ProjectsController);

  ProjectDetailsController.$inject = ['DataService', 'AuthService', '$window'];
  function ProjectDetailsController(DataService, AuthService, $window) {
    var vm = this;
    vm.project = null;
    vm.isLoggedIn = AuthService.isLoggedIn();
    vm.currentUser = vm.isLoggedIn ? AuthService.getUser() : null;
    vm.loading = true;
    vm.error = '';
    vm.notice = '';

    var query = new URLSearchParams($window.location.search);
    var projectId = query.get('id');
    if (!projectId) {
      vm.loading = false;
      vm.error = 'Project ID is missing.';
      return;
    }

    DataService.getProject(projectId).then(function (project) {
      vm.project = project;
      if (!project) {
        vm.error = 'Project not found.';
        vm.loading = false;
        return;
      }
      var ownerId = project.createdBy && typeof project.createdBy === 'object'
        ? (project.createdBy.id || project.createdBy._id)
        : project.createdBy;
      vm.project.canApply = project.status === 'open' && String(ownerId || '') !== String(vm.currentUser && vm.currentUser.id || '');

      var fetchAppsPromise = vm.isLoggedIn ? DataService.getMyApplications() : Promise.resolve([]);
      return fetchAppsPromise.then(function (applications) {
        vm.project.applied = (applications || []).some(function (application) {
          var appliedProject = application.projectDetails && application.projectDetails.id || application.project;
          return String(appliedProject && (appliedProject.id || appliedProject._id || appliedProject)) === String(projectId);
        });
        vm.loading = false;
      });
    }).catch(function () {
      vm.error = 'Unable to load this project. Please try again.';
      vm.loading = false;
    });

    vm.applyToProject = function () {
      if (!vm.isLoggedIn) {
        $window.location.href = 'login.html';
        return;
      }
      if (!vm.project || vm.project.applying || vm.project.applied) return;
      vm.project.applying = true;
      DataService.applyToProject(vm.project, vm.currentUser).then(function (response) {
        vm.project.applying = false;
        if (response && response.success) {
          vm.project.applied = true;
          vm.notice = 'Your interest has been submitted.';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to submit your interest.';
          if (response && response.missingSkills && response.missingSkills.length) {
            vm.error += ' Missing skills: ' + response.missingSkills.join(', ') + '.';
          }
        }
      });
    };
    vm.backToBrowse = function () {
      $window.location.href = 'browse.html';
    };

    vm.retryLoad = function () {
      $window.location.reload();
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('ProjectDetailsController', ProjectDetailsController);

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
      deadline: '',
      requiredSkills: []
    };
    vm.requiredSkillsInput = '';
    vm.errors = {};
    vm.saving = false;
    vm.notice = '';
    vm.error = '';

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

    vm.updateRequiredSkills = function () {
      vm.listing.requiredSkills = (vm.requiredSkillsInput || '').split(/[,\n]/).map(function (skill) {
        return skill.trim();
      }).filter(Boolean);
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
      vm.updateRequiredSkills();
      if (!vm.listing.requiredSkills.length) {
        vm.errors.requiredSkills = 'Add at least one required skill.';
      }
      if (Object.keys(vm.errors).length) {
        return;
      }
      vm.saving = true;
      vm.error = '';
      DataService.createListing(vm.listing, vm.teamSize).then(function (response) {
        vm.saving = false;
        if (response && response.success) {
          vm.notice = 'Your project listing has been published.';
          vm.listing = {
            title: '',
            type: '',
            description: '',
            department: 'Information Technology',
            year: '3rd Year',
            deadline: '',
            requiredSkills: []
          };
          vm.requiredSkillsInput = '';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to publish listing.';
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

    vm.projects = [];
    vm.applicants = [];
    vm.teamMembers = [];
    vm.selectedProject = null;
    vm.showTeamManager = false;
    vm.projectsLoading = true;
    vm.loading = false;
    vm.notice = '';
    vm.error = '';
    vm.currentUser = AuthService.getUser();

    function loadProjectApplicants() {
      if (!vm.selectedProject) {
        vm.applicants = [];
        vm.teamMembers = [];
        vm.loading = false;
        return;
      }
      vm.loading = true;
      DataService.getApplicantsForProject(vm.selectedProject.id).then(function (applicants) {
        vm.applicants = applicants || [];
        var ownerUserId = (vm.selectedProject.owner && (vm.selectedProject.owner._id || vm.selectedProject.owner.id)) || (vm.currentUser && (vm.currentUser._id || vm.currentUser.id));
        vm.teamMembers = [{
          userId: ownerUserId,
          name: vm.selectedProject.owner ? vm.selectedProject.owner.name : vm.currentUser.name,
          role: 'Lead',
          department: vm.selectedProject.department,
          year: vm.selectedProject.year,
          skills: vm.selectedProject.owner && vm.selectedProject.owner.skills || []
        }].concat(vm.applicants.filter(function (applicant) { return applicant.status === 'accepted'; }).map(function (applicant) {
          return {
            userId: applicant.user || applicant.userId || applicant.id,
            name: applicant.name,
            role: 'Member',
            department: applicant.department,
            year: applicant.year,
            skills: applicant.skills || []
          };
        }));
        vm.loading = false;
      });
    }

    DataService.getMyProjects(vm.currentUser).then(function (projects) {
      vm.projects = projects || [];
      vm.projectsLoading = false;
      if (vm.projects.length) {
        vm.selectedProject = vm.projects[0];
        DataService.getProject(vm.selectedProject.id).then(function (project) {
          vm.selectedProject = project || vm.selectedProject;
          loadProjectApplicants();
        });
      }
    }).catch(function () {
      vm.projectsLoading = false;
      vm.error = 'Unable to load your project listings. Please try again.';
    });

    vm.retryLoad = function () {
      $window.location.reload();
    };

    vm.getInitials = function (name) {
      return (name || '').split(' ').map(function (part) {
        return part.charAt(0);
      }).join('').slice(0, 2);
    };

    vm.updateApplicant = function (applicant, status) {
      if (applicant.updating) return;
      if (status === 'rejected' && !$window.confirm('Reject this application?')) return;
      applicant.updating = true;
      DataService.updateApplicantStatus(applicant.id, status).then(function (response) {
        applicant.updating = false;
        if (response && response.success) {
          applicant.status = status;
          loadProjectApplicants();
          vm.notice = status === 'accepted' ? 'Applicant accepted.' : 'Applicant rejected.';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to update applicant.';
        }
      });
    };

    vm.selectProject = function () {
      vm.showTeamManager = false;
      loadProjectApplicants();
    };

    vm.toggleTeamManager = function () {
      vm.showTeamManager = !vm.showTeamManager;
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

    vm.interests = [];
    vm.loading = true;
    vm.error = '';
    DataService.getInterests().then(function (interests) {
      vm.interests = interests || [];
      vm.loading = false;
    }).catch(function () {
      vm.error = 'Unable to load your interests. Please try again.';
      vm.loading = false;
    });

    vm.retryLoad = function () {
      $window.location.reload();
    };
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

    function getQueryParam(param) {
      if (!$window.location.search) return null;
      var match = RegExp('[?&]' + param + '=([^&]*)').exec($window.location.search);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    var targetUserId = getQueryParam('id');
    vm.currentUser = AuthService.getUser();
    vm.isSelf = !targetUserId || (vm.currentUser && (String(vm.currentUser.id || vm.currentUser._id) === String(targetUserId)));

    vm.profile = { skills: [], projects: [], preferences: { hackathon: false, internship: false } };
    vm.ownedProjects = [];
    vm.loading = true;
    vm.saving = false;
    vm.notice = '';
    vm.error = '';
    vm.newSkillName = '';

    var fetchUserPromise = (!vm.isSelf && targetUserId) ? DataService.getUserById(targetUserId) : DataService.getCurrentUser();

    fetchUserPromise.then(function (user) {
      vm.profile = user || { skills: [], projects: [], preferences: { hackathon: false, internship: false } };
      vm.profile.skills = vm.profile.skills || [];
      vm.profile.projects = vm.profile.projects || [];
      vm.profile.preferences = vm.profile.preferences || { hackathon: false, internship: false };

      return DataService.getProjects().then(function (allProjects) {
        var pid = String(vm.profile.id || vm.profile._id || '');
        vm.ownedProjects = (allProjects || []).filter(function (p) {
          var ownerId = String(p.createdBy || (p.owner && (p.owner.id || p.owner._id)) || '');
          return ownerId === pid;
        });
      });
    }).then(function () {
      vm.loading = false;
    }).catch(function () {
      vm.loading = false;
      vm.error = 'Unable to load profile. Please try again.';
    });

    vm.retryLoad = function () {
      $window.location.reload();
    };
    vm.errors = {};

    vm.addSkill = function () {
      var name = (vm.newSkillName || '').trim();
      if (!name) {
        vm.error = 'Enter a skill name.';
        return;
      }
      DataService.addSkill(name).then(function (response) {
        if (response && response.success) {
          vm.profile.skills = response.skills || [];
          vm.newSkillName = '';
          vm.error = '';
          vm.notice = 'Skill added to your profile.';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to submit this skill.';
        }
      });
    };

    vm.startEditSkill = function (skill) {
      vm.editingSkillId = skill.id;
      vm.editingSkillName = skill.name;
    };

    vm.cancelEditSkill = function () {
      vm.editingSkillId = '';
      vm.editingSkillName = '';
    };

    vm.saveSkill = function (skill) {
      var name = (vm.editingSkillName || '').trim();
      if (!name) {
        vm.error = 'Enter a skill name.';
        return;
      }
      DataService.updateSkill(skill.id, name).then(function (response) {
        if (response && response.success) {
          vm.profile.skills = response.skills || [];
          vm.cancelEditSkill();
          vm.error = '';
          vm.notice = 'Skill updated.';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to update this skill.';
        }
      });
    };

    vm.removeSkill = function (skill) {
      if (!$window.confirm('Remove ' + skill.name + ' from your profile?')) return;
      DataService.deleteSkill(skill.id).then(function (response) {
        if (response && response.success) {
          vm.profile.skills = response.skills || [];
          vm.error = '';
          vm.notice = 'Skill removed from your profile.';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to remove this skill.';
        }
      });
    };

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
      vm.saving = true;
      vm.error = '';
      DataService.updateProfile(vm.profile).then(function (updatedUser) {
        vm.saving = false;
        if (updatedUser) {
          vm.profile = updatedUser;
          vm.notice = 'Your profile has been updated.';
        } else {
          vm.error = 'Unable to update profile. Please try again.';
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

    vm.posts = [];
    vm.activePost = null;
    vm.inThreadView = false;
    vm.loading = true;
    vm.error = '';
    vm.newCommentText = '';
    vm.submittingComment = false;
    vm.currentUser = AuthService.getUser();

    function getQueryParam(param) {
      if (!$window.location.search) return null;
      var match = RegExp('[?&]' + param + '=([^&]*)').exec($window.location.search);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    var threadId = getQueryParam('id');

    if (threadId) {
      vm.inThreadView = true;
      DataService.getDiscussionById(threadId).then(function (discussion) {
        vm.activePost = discussion;
        vm.loading = false;
      }).catch(function () {
        vm.error = 'Unable to load discussion thread.';
        vm.loading = false;
      });
    } else {
      vm.inThreadView = false;
      DataService.getDiscussions().then(function (posts) {
        vm.posts = posts || [];
        vm.loading = false;
      }).catch(function () {
        vm.error = 'Unable to load discussions. Please try again.';
        vm.loading = false;
      });
    }

    vm.selectPost = function (post) {
      if (post && post.id) {
        $window.location.href = 'forum.html?id=' + encodeURIComponent(post.id);
      }
    };

    vm.votePost = function (dir) {
      if (!vm.activePost) return;
      DataService.voteDiscussion(vm.activePost.id, dir).then(function (updatedPost) {
        if (updatedPost) {
          vm.activePost = updatedPost;
        }
      });
    };

    vm.submitComment = function (parentId, text) {
      var commentContent = (text || vm.newCommentText || '').trim();
      if (!commentContent || !vm.activePost) return;
      vm.submittingComment = true;
      DataService.addComment(vm.activePost.id, commentContent, parentId).then(function (res) {
        vm.submittingComment = false;
        if (res && res.success && res.discussion) {
          vm.activePost = res.discussion;
          vm.newCommentText = '';
        }
      }).catch(function () {
        vm.submittingComment = false;
      });
    };

    vm.voteComment = function (comment, dir) {
      if (!vm.activePost || !comment) return;
      DataService.voteComment(vm.activePost.id, comment.id, dir).then(function (updatedPost) {
        if (updatedPost) {
          vm.activePost = updatedPost;
        }
      });
    };

    vm.getTopLevelComments = function () {
      if (!vm.activePost || !vm.activePost.comments) return [];
      return vm.activePost.comments.filter(function (c) {
        return !c.parentId;
      });
    };

    vm.getInitials = function (name) {
      return (name || 'A').split(' ').map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase();
    };

    vm.retryLoad = function () {
      $window.location.reload();
    };

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
    vm.saving = false;
    vm.notice = '';
    vm.error = '';

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
      vm.saving = true;
      vm.error = '';
      DataService.addDiscussion(vm.post).then(function (response) {
        vm.saving = false;
        if (response && response.success) {
          vm.notice = 'Your discussion has been posted.';
          vm.post = { title: '', body: '' };
          return DataService.getDiscussions().then(function (posts) {
            vm.posts = posts || [];
          });
        }
        vm.error = response && response.message ? response.message : 'Unable to create post.';
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

    vm.notifications = [];
    vm.loading = true;
    DataService.getNotifications().then(function (notifications) {
      vm.notifications = notifications || [];
      vm.loading = false;
    }).catch(function () {
      vm.error = 'Unable to load notifications. Please try again.';
      vm.loading = false;
    });

    vm.retryLoad = function () {
      $window.location.reload();
    };

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

  function authorizeAdminPage(DataService, AuthService, $window) {
    if (!AuthService.isLoggedIn()) {
      $window.location.replace('login.html#admin');
      return Promise.resolve(null);
    }
    return DataService.getCurrentUser().then(function (user) {
      if (!user || user.role !== 'admin') {
        $window.location.replace('login.html#admin');
        return null;
      }
      return user;
    });
  }

  AdminDashboardController.$inject = ['DataService', 'AuthService', '$window'];
  function AdminDashboardController(DataService, AuthService, $window) {
    var vm = this;
    vm.loading = true;
    vm.error = '';
    vm.stats = [];
    authorizeAdminPage(DataService, AuthService, $window).then(function (user) {
      if (!user) return;
      vm.user = user;
      return DataService.getAdminOverview().then(function (response) {
        if (!response || !response.success) {
          vm.error = response && response.message ? response.message : 'Unable to load platform statistics.';
          return;
        }
        var stats = response.stats || {};
        vm.stats = [
          { label: 'Total students', value: stats.totalStudents || 0 },
          { label: 'Total projects', value: stats.totalProjects || 0 },
          { label: 'Interests / applications', value: stats.totalInterests || 0 },
          { label: 'Active users', value: stats.activeUsers || 0 },
          { label: 'Open projects', value: stats.openProjects || 0 },
          { label: 'Closed projects', value: stats.closedProjects || 0 }
        ];
      });
    }).catch(function () {
      vm.error = 'Unable to load platform statistics.';
    }).finally(function () {
      vm.loading = false;
    });
    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('AdminDashboardController', AdminDashboardController);

  AdminStudentsController.$inject = ['DataService', 'AuthService', '$window'];
  function AdminStudentsController(DataService, AuthService, $window) {
    var vm = this;
    vm.students = [];
    vm.loading = true;
    vm.error = '';
    vm.search = '';
    authorizeAdminPage(DataService, AuthService, $window).then(function (user) {
      if (!user) return;
      return DataService.getAdminStudents().then(function (response) {
        if (response && response.success) vm.students = response.students || [];
        else vm.error = response && response.message ? response.message : 'Unable to load students.';
      });
    }).catch(function () {
      vm.error = 'Unable to load students.';
    }).finally(function () {
      vm.loading = false;
    });
    vm.setActive = function (student) {
      var nextState = student.accountStatus !== 'active';
      var action = nextState ? 'reactivate' : 'suspend';
      if (!$window.confirm('Are you sure you want to ' + action + ' ' + student.name + '?')) return;
      DataService.setStudentActive(student.id, nextState).then(function (response) {
        if (response && response.success) {
          student.accountStatus = nextState ? 'active' : 'inactive';
          vm.error = '';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to update this account.';
        }
      });
    };
    vm.deleteStudent = function (student) {
      var confirmation = 'Permanently delete ' + student.name + '? This also removes their projects, project applications/interests, authored discussions, and related notifications. This cannot be undone.';
      if (!$window.confirm(confirmation)) return;
      DataService.deleteStudent(student.id).then(function (response) {
        if (response && response.success) {
          vm.students = vm.students.filter(function (item) { return item.id !== student.id; });
          vm.error = '';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to delete this student.';
        }
      });
    };
    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('AdminStudentsController', AdminStudentsController);

  AdminStudentController.$inject = ['DataService', 'AuthService', '$window'];
  function AdminStudentController(DataService, AuthService, $window) {
    var vm = this;
    vm.loading = true;
    vm.error = '';
    vm.projects = [];
    vm.interests = [];
    vm.student = null;
    var match = $window.location.search.match(/[?&]id=([^&]*)/);
    var studentId = '';
    try {
      studentId = match ? decodeURIComponent(match[1]) : '';
    } catch (error) {
      vm.error = 'Invalid student ID.';
    }
    authorizeAdminPage(DataService, AuthService, $window).then(function (user) {
      if (!user) return;
      if (!studentId) {
        vm.error = 'A student ID is required.';
        return;
      }
      return DataService.getAdminStudent(studentId).then(function (response) {
        if (response && response.success) {
          vm.student = response.student;
          vm.projects = response.projects || [];
          vm.interests = response.interests || [];
        } else {
          vm.error = response && response.message ? response.message : 'Unable to load student activity.';
        }
      });
    }).catch(function () {
      vm.error = 'Unable to load student activity.';
    }).finally(function () {
      vm.loading = false;
    });
    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('AdminStudentController', AdminStudentController);

  AdminProjectsController.$inject = ['DataService', 'AuthService', '$window'];
  function AdminProjectsController(DataService, AuthService, $window) {
    var vm = this;
    vm.projects = [];
    vm.loading = true;
    vm.error = '';
    vm.search = '';
    authorizeAdminPage(DataService, AuthService, $window).then(function (user) {
      if (!user) return;
      return DataService.getAdminProjects().then(function (response) {
        if (response && response.success) vm.projects = response.projects || [];
        else vm.error = response && response.message ? response.message : 'Unable to load projects.';
      });
    }).catch(function () {
      vm.error = 'Unable to load projects.';
    }).finally(function () {
      vm.loading = false;
    });
    vm.removeProject = function (project) {
      var confirmation = 'Permanently remove "' + project.title + '" and its ' + project.interestsCount + ' interest/application record(s)? Related notifications will also be removed.';
      if (!$window.confirm(confirmation)) return;
      DataService.deleteProject(project.id).then(function (response) {
        if (response && response.success) {
          vm.projects = vm.projects.filter(function (item) { return item.id !== project.id; });
          vm.error = '';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to remove this project.';
        }
      });
    };
    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('AdminProjectsController', AdminProjectsController);

  AdminInterestsController.$inject = ['DataService', 'AuthService', '$window'];
  function AdminInterestsController(DataService, AuthService, $window) {
    var vm = this;
    vm.interests = [];
    vm.loading = true;
    vm.error = '';
    vm.search = '';
    vm.activeFilter = 'all';
    authorizeAdminPage(DataService, AuthService, $window).then(function (user) {
      if (!user) return;
      return DataService.getAdminInterests().then(function (response) {
        if (response && response.success) vm.interests = response.interests || [];
        else vm.error = response && response.message ? response.message : 'Unable to load interests.';
      });
    }).catch(function () {
      vm.error = 'Unable to load interests.';
    }).finally(function () {
      vm.loading = false;
    });
    vm.filterInterest = function (interest) {
      var statusMatches = vm.activeFilter === 'all' || interest.status === vm.activeFilter;
      var query = (vm.search || '').toLowerCase();
      var text = [
        interest.student && interest.student.name,
        interest.student && interest.student.email,
        interest.project && interest.project.title,
        interest.project && interest.project.owner && interest.project.owner.name
      ].join(' ').toLowerCase();
      return statusMatches && (!query || text.indexOf(query) !== -1);
    };
    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('AdminInterestsController', AdminInterestsController);

  AdminModerationController.$inject = ['DataService', 'AuthService', '$window'];
  function AdminModerationController(DataService, AuthService, $window) {
    var vm = this;
    vm.loading = true;
    vm.error = '';
    vm.discussions = [];
    vm.notice = '';
    authorizeAdminPage(DataService, AuthService, $window).then(function (user) {
      if (!user) return;
      return DataService.getAdminDiscussions().then(function (response) {
        if (response && response.success) vm.discussions = response.discussions || [];
        else vm.error = response && response.message ? response.message : 'Unable to load platform discussions.';
      });
    }).catch(function () {
      vm.error = 'Unable to load platform discussions.';
    }).finally(function () {
      vm.loading = false;
    });
    vm.removeDiscussion = function (discussion) {
      if (!$window.confirm('Remove this discussion and its content? This action cannot be undone.')) return;
      DataService.deleteDiscussion(discussion._id).then(function (response) {
        if (response && response.success) {
          vm.discussions = vm.discussions.filter(function (item) { return item._id !== discussion._id; });
          vm.notice = 'Discussion removed.';
          vm.error = '';
        } else {
          vm.error = response && response.message ? response.message : 'Unable to remove discussion.';
        }
      });
    };

    vm.logout = function () {
      AuthService.logout();
      $window.location.href = 'login.html';
    };
  }
  app.controller('AdminModerationController', AdminModerationController);

})();
