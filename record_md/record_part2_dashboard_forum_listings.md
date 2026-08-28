# Lab Record — Part 2: Dashboard, Forum, Create Post & Create Listing Pages

**Course**: Web Technology Lab  
**Framework**: AngularJS (v1.8.3)  
**Required Concepts**: Factory, Minification-Safe `$inject`, `ngAnimate`, `ngMessages`  
**Covered Pages**: Dashboard, Discussion Forum, Create Forum Post, Create Project Listing  

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
  function addItem(category, item) {
    var newItem = Object.assign({ id: Date.now() }, item);
    state[category].unshift(newItem);
    saveState(state);
    return newItem;
  }

  return {
    getItems: getItems,
    addItem: addItem,
    getLandingStats: function () { /* ... */ },
    getDiscussions: function () { return getItems('discussions'); },
    addDiscussion: function (post) { return addItem('discussions', post); },
    createListing: function (listing, teamSize) { return addItem('projects', listing); }
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
LandingController.$inject = ['DataService', 'AuthService', '$window'];
ForumController.$inject = ['DataService', 'AuthService', '$window'];
CreatePostController.$inject = ['DataService', 'AuthService', '$window'];
CreateListingController.$inject = ['DataService', 'AuthService', '$window'];
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

@keyframes ngFlipIn {
  from { opacity: 0; transform: perspective(400px) rotateX(20deg) translateY(-10px); }
  to { opacity: 1; transform: perspective(400px) rotateX(0deg) translateY(0); }
}

.stat-card.ng-enter, .thread-card.ng-enter, .listing-card.ng-enter {
  animation: 0.35s ease-out ngEnterSlideUp;
}

.ng-if-fade.ng-enter {
  animation: 0.35s ease-out ngFlipIn;
}
```

---

## Page-Wise Code Changes

### Page 1: Dashboard Page (`index.html`)

#### 1. Concept: Factory (`DataService` & `AuthService`)
```javascript
// Controller calls Factory methods (js/app.js)
vm.user = DataService.getCurrentUser();
vm.stats = DataService.getLandingStats();
vm.projects = DataService.getProjects().slice(0, 2);
vm.logout = function () {
  AuthService.logout();
  $window.location.href = 'login.html';
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
LandingController.$inject = ['DataService', 'AuthService', '$window'];
function LandingController(DataService, AuthService, $window) {
  var vm = this;
  vm.user = DataService.getCurrentUser();
  vm.stats = DataService.getLandingStats();
  vm.projects = DataService.getProjects().slice(0, 2);
}
app.controller('LandingController', LandingController);
```

#### 3. Concept: `ngAnimate` (`ng-repeat` Staggered Card Entry)
```html
<!-- HTML Directive Triggers (index.html) -->
<stat-card-widget stat="stat" ng-repeat="stat in vm.stats"></stat-card-widget>
<project-card-item project="project" ng-repeat="project in vm.projects"></project-card-item>
```
```css
/* CSS Animation Rules (style.css) */
.stat-card.ng-enter, .listing-card.ng-enter {
  animation: 0.35s ease-out ngEnterSlideUp;
}
.stat-card.ng-enter-stagger, .listing-card.ng-enter-stagger {
  animation-delay: 0.05s;
}
```

---

### Page 2: Discussion Forum Page (`forum.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Injected DataService Factory call (js/app.js)
vm.posts = DataService.getDiscussions();
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
ForumController.$inject = ['DataService', 'AuthService', '$window'];
function ForumController(DataService, AuthService, $window) {
  var vm = this;
  vm.posts = DataService.getDiscussions();
}
app.controller('ForumController', ForumController);
```

#### 3. Concept: `ngAnimate` (`ng-repeat` Thread Slide-Up)
```html
<!-- HTML Directive Trigger (forum.html) -->
<forum-thread-card post="post" ng-repeat="post in vm.posts"></forum-thread-card>
```
```css
/* CSS Animation Rules (style.css) */
.thread-card.ng-enter { animation: 0.35s ease-out ngEnterSlideUp; }
.thread-card.ng-enter-stagger { animation-delay: 0.05s; }
```

---

### Page 3: Create Forum Post Page (`create-post.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Controller posting data to Factory (js/app.js)
vm.submitPost = function () {
  DataService.addDiscussion(vm.post);
  $window.alert('Posted to forum!');
  vm.post = { title: '', body: '' };
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
CreatePostController.$inject = ['DataService', 'AuthService', '$window'];
function CreatePostController(DataService, AuthService, $window) {
  var vm = this;
  vm.post = { title: '', body: '' };
}
app.controller('CreatePostController', CreatePostController);
```

#### 3. Concept: `ngAnimate` (`ng-if` Live Preview 3D Flip)
```html
<!-- HTML Directive Trigger (create-post.html) -->
<post-preview-card post="vm.post"></post-preview-card>
<!-- Directive Template ng-if -->
<div class="thread-card ng-if-fade" ng-if="post.title || post.body"> ... </div>
```
```css
/* CSS Animation Rules (style.css) */
.ng-if-fade.ng-enter { animation: 0.35s ease-out ngFlipIn; }
.ng-if-fade.ng-leave { animation: 0.25s ease-in ngPopOut; }
```

#### 4. Concept: `ngMessages` Validation
```html
<!-- HTML Validation Messages (create-post.html) -->
<input type="text" id="postTitle" name="postTitle" required ng-minlength="5" ng-pattern="/^[a-zA-Z0-9\s.,'?!-]{5,}$/" ng-model="vm.post.title">
<div class="error-msg" ng-messages="postForm.postTitle.$error" ng-show="postForm.postTitle.$dirty || postForm.$submitted">
  <span ng-message="required">Please fill this field.</span>
  <span ng-message="pattern">Only letters, numbers and basic punctuation allowed.</span>
</div>
```

---

### Page 4: Create Project Listing Page (`create-listing.html`)

#### 1. Concept: Factory (`DataService`)
```javascript
// Invoking Factory create method (js/app.js)
vm.submitListing = function () {
  DataService.createListing(vm.listing, vm.teamSize);
  $window.alert('Listing published!');
};
```

#### 2. Concept: Minification-Safe Injection (`$inject`)
```javascript
// Controller $inject Annotation (js/app.js)
CreateListingController.$inject = ['DataService', 'AuthService', '$window'];
function CreateListingController(DataService, AuthService, $window) {
  var vm = this;
  vm.teamSize = 2;
  vm.listing = { title: '', description: '' };
}
app.controller('CreateListingController', CreateListingController);
```

#### 3. Concept: `ngAnimate` (`ng-if` Preview Animation)
```html
<!-- HTML Directive Trigger (create-listing.html) -->
<listing-preview-card listing="vm.listing" team-size="vm.teamSize"></listing-preview-card>
<!-- Directive Template ng-if -->
<div class="listing-card ng-if-fade" ng-if="listing.title || listing.description"> ... </div>
```
```css
/* CSS Animation Rules (style.css) */
.ng-if-fade.ng-enter { animation: 0.35s ease-out ngFlipIn; }
```

#### 4. Concept: `ngMessages` Validation
```html
<!-- HTML Validation (create-listing.html) -->
<input type="text" id="listingTitle" name="listingTitle" required ng-minlength="3" ng-model="vm.listing.title">
<div class="error-msg" ng-messages="listingForm.listingTitle.$error" ng-show="listingForm.listingTitle.$dirty || listingForm.$submitted">
  <span ng-message="required">Please fill this field.</span>
  <span ng-message="minlength">Title must be at least 3 characters.</span>
</div>
```
