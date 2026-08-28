# Lab Record — Part 3: Manage Applicants, My Interests & Notifications Pages

**Course**: Web Technology Lab  
**Framework**: AngularJS (v1.8.3)  
**Required Concepts**: Factory, Minification-Safe `$inject`, `ngAnimate`, `ngMessages`  
**Covered Pages**: Manage Applicants, My Interests, Alerts & Notifications  

---

## Common Global Setup (Factory, $inject, ngAnimate, ngMessages)

### 1. AngularJS Module Definition with Injected Dependencies (`js/app.js`)
Module definition explicitly injecting `ngAnimate` and `ngMessages` dependencies:
```javascript
(function () {
  'use strict';
  // Main Application Module with ngAnimate & ngMessages Injected
  var app = angular.module('tcemate', ['ngAnimate', 'ngMessages']);
})();
```

### 2. Service → Factory Conversion (`js/data.js` & `js/auth.js`)
Converted `.service()` constructors to `.factory()` returning plain JavaScript object literals using closure scope:
```javascript
// Data Factory Definition (js/data.js)
angular.module('tcemate').factory('DataService', DataService);
DataService.$inject = [];
function DataService() {
  var state = loadState();

  function getItems(category) { return state[category] || []; }
  function deleteItem(category, id) {
    state[category] = state[category].filter(function (item) { return item.id !== id; });
    saveState(state);
    return state[category];
  }

  return {
    getItems: getItems,
    deleteItem: deleteItem,
    getApplicants: function () { return getItems('applicants'); },
    getInterests: function () { return getItems('interests'); },
    getNotifications: function () { return getItems('notifications'); },
    removeApplicant: function (applicantId) { return deleteItem('applicants', applicantId); },
    markAllNotificationsRead: function () {
      state.notifications.forEach(function (n) { n.unread = false; });
      saveState(state);
      return state.notifications;
    }
  };
}

// Auth Factory Definition (js/auth.js)
angular.module('tcemate').factory('AuthService', AuthService);
AuthService.$inject = [];
function AuthService() {
  var loginKey = 'loggedIn';
  return {
    isLoggedIn: function () { return sessionStorage.getItem(loginKey) === 'true'; },
    logout: function () { sessionStorage.setItem(loginKey, 'false'); }
  };
}
```

### 3. Minification-Safe Dependency Injection Setup (`js/app.js`)
```javascript
// Controller $inject Annotations
ApplicantsController.$inject = ['DataService', 'AuthService', '$window'];
InterestsController.$inject = ['DataService', 'AuthService', '$window'];
NotificationsController.$inject = ['DataService', 'AuthService', '$window'];
```

### 4. ngAnimate Library & CSS Animation System (`js/app.js`, HTML Header, `style.css`)
```html
<!-- HTML Header Script Imports (Included in all pages) -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.3/angular-animate.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.3/angular-messages.min.js"></script>
```
```css
/* CSS Animation Selectors & Keyframes (style.css) */
@keyframes ngEnterSlideUp {
  from { opacity: 0; transform: translateY(25px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ngLeaveSlideDown {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.95); }
}

@keyframes ngPulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(166, 53, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(166, 53, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(166, 53, 0, 0); }
}

.applicant-row.ng-leave, .interest-row.ng-leave, .notif-item.ng-leave {
  animation: 0.3s ease-in ngLeaveSlideDown;
}
```

---

## Page-Wise Code Changes

### Page 1: Manage Applicants Page (`manage-applicants.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Injected Factory Action Handler (js/app.js)
vm.handleApplicant = function (applicant) {
  vm.applicants = DataService.removeApplicant(applicant.id);
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
ApplicantsController.$inject = ['DataService', 'AuthService', '$window'];
function ApplicantsController(DataService, AuthService, $window) {
  var vm = this;
  vm.applicants = DataService.getApplicants();
  vm.teamMembers = DataService.getTeams();
}
app.controller('ApplicantsController', ApplicantsController);
```

#### 3. Concept: `ngAnimate` (`ng-repeat` Deletion Leave Animation)
```html
<!-- HTML Directive Trigger (manage-applicants.html) -->
<applicant-row-card applicant="applicant" get-initials="vm.getInitials(name)" on-action="vm.handleApplicant(applicant)" ng-repeat="applicant in vm.applicants | orderBy:'-matchScore'"></applicant-row-card>
```
```css
/* CSS Animation Rules (style.css) */
.applicant-row.ng-leave { animation: 0.3s ease-in ngLeaveSlideDown; }
.applicant-row.ng-move { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
```

---

### Page 2: My Interests Page (`my-interests.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Data Retrieval via Factory API (js/app.js)
vm.interests = DataService.getInterests();
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
InterestsController.$inject = ['DataService', 'AuthService', '$window'];
function InterestsController(DataService, AuthService, $window) {
  var vm = this;
  vm.interests = DataService.getInterests();
  vm.activeFilter = 'all';
}
app.controller('InterestsController', InterestsController);
```

#### 3. Concept: `ngAnimate` (`ng-class` Tab Glow & `ng-repeat` Filter Transition)
```html
<!-- HTML Triggers (my-interests.html) -->
<button class="tab-btn" ng-class="{active: vm.activeFilter === 'all'}" ng-click="vm.setFilter('all')">All</button>
<interest-row-item item="item" ng-repeat="item in vm.interests | filter:vm.filterByStatus"></interest-row-item>
```
```css
/* CSS Animation Rules (style.css) */
.tab-btn.active-add-active { animation: ngPulseGlow 0.4s ease-out; }
.interest-row.ng-enter { animation: 0.35s ease-out ngEnterSlideUp; }
.interest-row.ng-leave { animation: 0.3s ease-in ngLeaveSlideDown; }
.interest-row.ng-move { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
```

---

### Page 3: Alerts & Notifications Page (`notifications.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Factory Method Invocation (js/app.js)
vm.markAllRead = function () {
  vm.notifications = DataService.markAllNotificationsRead();
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
NotificationsController.$inject = ['DataService', 'AuthService', '$window'];
function NotificationsController(DataService, AuthService, $window) {
  var vm = this;
  vm.notifications = DataService.getNotifications();
}
app.controller('NotificationsController', NotificationsController);
```

#### 3. Concept: `ngAnimate` (`ng-class` Unread State Fade & `ng-repeat` Entry)
```html
<!-- HTML Directive Trigger (notifications.html) -->
<notification-item-card notification="notification" ng-repeat="notification in vm.notifications"></notification-item-card>
```
```css
/* CSS Animation Rules (style.css) */
.notif-item.ng-enter { animation: 0.35s ease-out ngEnterSlideUp; }
.notif-item.unread-remove-active {
  background-color: var(--surface);
  border-color: var(--border);
  transition: all 0.4s ease;
}
```
