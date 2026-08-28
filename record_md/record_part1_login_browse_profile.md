# Lab Record — Part 1: Login, Register, Browse & Profile Pages

**Course**: Web Technology Lab  
**Framework**: AngularJS (v1.8.3)  
**Required Concepts**: Factory, Minification-Safe `$inject`, `ngAnimate`, `ngMessages`  
**Covered Pages**: Login, Register, Browse Listings, View Profile, Edit Profile  

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
  function addItem(category, item) { /* ... */ return newItem; }
  function deleteItem(category, id) { /* ... */ return state[category]; }
  function updateItem(category, id, data) { /* ... */ return getItems(category); }

  return {
    getItems: getItems,
    addItem: addItem,
    deleteItem: deleteItem,
    updateItem: updateItem,
    getProjects: function () { return getItems('projects'); },
    getCurrentUser: function () { return getCurrentUser(); },
    updateProfile: function (profile) { return updateItem('students', state.currentUserId, profile); }
  };
}

// Auth Factory Definition (js/auth.js)
angular.module('tcemate').factory('AuthService', AuthService);
AuthService.$inject = [];
function AuthService() {
  var loginKey = 'loggedIn';
  return {
    isLoggedIn: function () { return sessionStorage.getItem(loginKey) === 'true'; },
    login: function (email, password) { /* ... */ return { ok: true, message: 'Login successful!' }; },
    register: function (data) { /* ... */ return { ok: true, message: 'Account created!' }; },
    logout: function () { sessionStorage.setItem(loginKey, 'false'); }
  };
}
```

### 3. Minification-Safe Dependency Injection Setup (`js/app.js`)
```javascript
// Controller $inject Annotations
LandingController.$inject = ['DataService', 'AuthService', '$window'];
LoginController.$inject = ['AuthService', '$window'];
ProjectsController.$inject = ['DataService', 'AuthService', '$window'];
ProfileController.$inject = ['DataService', 'AuthService', '$window'];
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

.listing-card.ng-enter, .portfolio-card.ng-enter, .skill-tag.ng-enter {
  animation: 0.35s ease-out ngEnterSlideUp;
}

.listing-card.ng-leave, .portfolio-card.ng-leave, .skill-tag.ng-leave {
  animation: 0.3s ease-in ngLeaveSlideDown;
}
```

---

## Page-Wise Code Changes

### Page 1: Login Page (`login.html` — Login Form)

#### 1. Concept: Factory (`AuthService`)
```javascript
// Controller Invocation of Factory Method (js/app.js)
vm.login = function () {
  var result = AuthService.login(vm.loginData.email, vm.loginData.password);
  if (result.ok) {
    $window.location.href = 'index.html';
  }
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
LoginController.$inject = ['AuthService', '$window'];
function LoginController(AuthService, $window) {
  var vm = this;
  vm.mode = 'login';
}
app.controller('LoginController', LoginController);
```

#### 3. Concept: `ngAnimate` (`ng-hide` / `ng-show` Form Switch)
```html
<!-- HTML Trigger (login.html) -->
<form class="auth-card" ng-hide="vm.mode !== 'login'"> ... </form>
```
```css
/* CSS Animation Rules (style.css) */
.auth-card.ng-hide-add, .auth-card.ng-hide-remove {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.auth-card.ng-hide-add-active { opacity: 0; transform: scale(0.95) translateY(-10px); }
.auth-card.ng-hide-remove-active { opacity: 1; transform: scale(1) translateY(0); }
```

#### 4. Concept: `ngMessages` Validation
```html
<!-- HTML Validation (login.html) -->
<input type="email" id="loginEmail" name="loginEmail" required ng-pattern="/^[^\s@]+@(student\.)?tce\.edu$/" ng-model="vm.loginData.email">
<div class="error-msg" ng-messages="loginForm.loginEmail.$error" ng-show="loginForm.loginEmail.$dirty || loginForm.$submitted">
  <span ng-message="required">Please fill this field.</span>
  <span ng-message="pattern">Please enter a valid tce.edu email address.</span>
</div>
```

---

### Page 2: Register Page (`login.html` — Registration Form)

#### 1. Concept: Factory (`AuthService`)
```javascript
// Controller Invocation of Factory Method (js/app.js)
vm.register = function () {
  var result = AuthService.register(vm.signupData);
  if (result.ok) {
    $window.location.href = 'index.html';
  }
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
LoginController.$inject = ['AuthService', '$window'];
```

#### 3. Concept: `ngAnimate` (`ng-hide` Form Switch)
```html
<!-- HTML Trigger (login.html) -->
<form class="auth-card" ng-hide="vm.mode !== 'signup'"> ... </form>
```
```css
/* CSS Animation Rules (style.css) */
.auth-card.ng-hide-remove { opacity: 0; transform: scale(0.95) translateY(10px); }
.auth-card.ng-hide-remove-active { opacity: 1; transform: scale(1) translateY(0); }
```

#### 4. Concept: `ngMessages` Validation
```html
<!-- HTML Validation (login.html) -->
<input type="text" id="fullName" name="fullName" required ng-pattern="/^[a-zA-Z\s]{2,}$/" ng-model="vm.signupData.fullName">
<div class="error-msg" ng-messages="signupForm.fullName.$error" ng-show="signupForm.fullName.$dirty || signupForm.$submitted">
  <span ng-message="required">Please fill this field.</span>
  <span ng-message="pattern">Only letters and spaces are allowed.</span>
</div>
```

---

### Page 3: Browse Project Listings Page (`browse.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Injected Factory Data Call (js/app.js)
vm.projects = DataService.getProjects();
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
ProjectsController.$inject = ['DataService', 'AuthService', '$window'];
function ProjectsController(DataService, AuthService, $window) {
  var vm = this;
  vm.projects = DataService.getProjects();
}
app.controller('ProjectsController', ProjectsController);
```

#### 3. Concept: `ngAnimate` (`ng-repeat` Filtering & Movement)
```html
<!-- HTML Directive Trigger (browse.html) -->
<project-card-item project="project" ng-repeat="project in vm.projects | filter:vm.filterProjects"></project-card-item>
```
```css
/* CSS Animation Rules (style.css) */
.listing-card.ng-enter { animation: 0.35s ease-out ngEnterSlideUp; }
.listing-card.ng-leave { animation: 0.3s ease-in ngLeaveSlideDown; }
.listing-card.ng-move { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
```

---

### Page 4: View Public Profile Page (`profile-view.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Injected Factory Data Call (js/app.js)
vm.profile = DataService.getCurrentUser();
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
ProfileController.$inject = ['DataService', 'AuthService', '$window'];
function ProfileController(DataService, AuthService, $window) {
  var vm = this;
  vm.profile = DataService.getCurrentUser();
}
app.controller('ProfileController', ProfileController);
```

#### 3. Concept: `ngAnimate` (`ng-repeat` Timeline & Grid Entry)
```html
<!-- HTML Directive Triggers (profile-view.html) -->
<li ng-repeat="..."> ... </li>
<portfolio-project-card project="project" ng-repeat="project in vm.profile.projects"></portfolio-project-card>
```
```css
/* CSS Animation Rules (style.css) */
.portfolio-card.ng-enter, .timeline li.ng-enter {
  animation: 0.35s ease-out ngEnterSlideUp;
}
```

---

### Page 5: Edit Profile Page (`profile.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Factory Profile Update Invocation (js/app.js)
vm.saveProfile = function () {
  DataService.updateProfile(vm.profile);
  $window.alert('Profile updated!');
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
ProfileController.$inject = ['DataService', 'AuthService', '$window'];
```

#### 3. Concept: `ngAnimate` (`ng-repeat` Skill Tags & `ng-if` Preference Alert)
```html
<!-- HTML Triggers (profile.html) -->
<li class="skill-tag" ng-repeat="skill in skills">{{skill}}</li>
<p class="ng-if-fade" ng-if="vm.profile.preferences.internship">Note: Internships profile visible to faculty.</p>
```
```css
/* CSS Animation Rules (style.css) */
.skill-tag.ng-enter { animation: 0.35s ease-out ngEnterSlideUp; }
.ng-if-fade.ng-enter { animation: 0.35s ease-out ngFlipIn; }
```

#### 4. Concept: `ngMessages` Validation
```html
<!-- HTML Validation (profile.html) -->
<input type="text" id="pName" name="pName" required ng-pattern="/^[a-zA-Z\s]{2,}$/" ng-model="vm.profile.name">
<div class="error-msg" ng-messages="profileForm.pName.$error" ng-show="profileForm.pName.$dirty || profileForm.$submitted">
  <span ng-message="required">Please fill this field.</span>
  <span ng-message="pattern">Only letters and spaces are allowed.</span>
</div>
```
