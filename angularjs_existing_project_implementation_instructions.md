# AngularJS Existing Project — Implementation Instructions

## Goal

Modify the **existing AngularJS project**. Do not create a new project and do not remove working functionality.

Integrate **all concepts from these four lecture PPTs** into the existing project:

1. AngularJS Dependency Injection & Minification
2. AngularJS Factory
3. AngularJS Custom Directives
4. AngularJS Animation

The concepts are currently not implemented. Inspect the existing project first, then integrate them into the appropriate existing pages.

## Critical Rules — DO NOT CHANGE EXISTING LOGIC

This is the most important requirement.

- **Do NOT remove existing logic.**
- **Do NOT change existing application behavior.**
- **Do NOT rewrite existing controllers just for style.**
- **Do NOT change existing HTML structure unless needed to demonstrate a required concept.**
- **Do NOT change existing variable names, function names, routes, API calls, database calls, calculations, conditions, or business logic unless absolutely required for the new concept.**
- **Do NOT replace existing functionality with new sample/demo functionality.**
- **Do NOT create unrelated demo pages.**
- **Do NOT create a second AngularJS application/module.**
- **Do NOT duplicate AngularJS libraries that already exist.**
- **Reuse the existing controllers, data, pages and services.**
- **The main required code conversion is: where the existing project uses an AngularJS `service`, convert that service to an equivalent `factory` while keeping its public methods, data and behavior exactly the same.**
- **Do not change how existing controllers call the service.** Ideally the injected name and method calls remain unchanged, so the controller logic does not need to change.
- If a service currently exposes methods such as `get()`, `add()`, `update()`, `delete()`, etc., the factory must expose the same methods with the same behavior.
- If a service stores data internally, preserve the same data flow and state behavior in the factory.
- If exact filenames differ, use the project's actual filenames.
- Make the smallest possible changes required to add the PPT concepts.
- After changes, test every existing page and verify that existing functionality still behaves exactly as before.

## SERVICE → FACTORY CONVERSION RULE

When converting an existing AngularJS service:

### Existing service pattern

```javascript
app.service('DataService', function() {

    this.getData = function() {
        // existing logic
    };

    this.addData = function(data) {
        // existing logic
    };

});
```

Convert it to an equivalent factory:

```javascript
app.factory('DataService', function() {

    var service = {};

    service.getData = function() {
        // SAME existing logic
    };

    service.addData = function(data) {
        // SAME existing logic
    };

    return service;
});
```

The important point is that **`DataService` remains the same injectable name and its public methods remain the same**.

Therefore existing controller logic such as:

```javascript
DataService.getData();
DataService.addData(data);
```

should continue working without rewriting the controller.

Do not blindly convert every service if doing so would alter required constructor behavior. Inspect the existing implementation first and preserve behavior.

## ADD, DON'T REPLACE

The implementation should follow this principle:

**Existing project logic + required PPT concepts**

not:

**New project replacing the existing project.**

Add the concepts around the existing application wherever possible.

---

# 1. DEPENDENCY INJECTION

Implement and demonstrate:

- Dependency Injection
- Inversion of Control
- `$scope`
- AngularJS-injected services
- Value component
- Service component
- Factory as an injectable dependency
- `$http` or another existing AngularJS service when applicable
- Minification-safe dependency injection

Dependency Injection is a software design pattern that implements inversion of control for resolving dependencies.

Inversion of Control means objects do not create the objects on which they depend. Instead, an outside source provides those objects.

### Controller example

```javascript
app.controller('MainController', MainController);

MainController.$inject = ['$scope', 'DataService'];

function MainController($scope, DataService) {
    $scope.items = DataService.getItems();
}
```

### Value example

```javascript
app.value('AppTitle', 'My AngularJS Application');

app.controller('MainController', MainController);

MainController.$inject = ['$scope', 'AppTitle'];

function MainController($scope, AppTitle) {
    $scope.title = AppTitle;
}
```

### Service example

```javascript
app.service('AdditionService', AdditionService);

function AdditionService() {
    this.add = function(a, b) {
        return a + b;
    };
}

app.controller('MainController', MainController);

MainController.$inject = ['$scope', 'AdditionService'];

function MainController($scope, AdditionService) {
    $scope.result = AdditionService.add(5, 6);
}
```

---

# 2. MINIFICATION

Minification removes unnecessary characters from source code without changing functionality.

The PPT gives two ways to protect AngularJS Dependency Injection:

1. Inline array with function as the last element.
2. Attach `$inject` property to the function object.

### Inline-array method

```javascript
app.controller('MainController', ['$scope', '$filter',
    function($scope, $filter) {

        $scope.upper = function() {
            var upCase = $filter('uppercase');
            $scope.name = upCase($scope.name);
        };

    }
]);
```

### `$inject` method

```javascript
app.controller('MainController', MainController);

MainController.$inject = ['$scope', '$filter'];

function MainController($scope, $filter) {

    $scope.upper = function() {
        var upCase = $filter('uppercase');
        $scope.name = upCase($scope.name);
    };

}
```

Use one consistent minification-safe approach throughout the existing project. Prefer `$inject` for readable source code.

---

# 3. FACTORY

Implement:

- `factory()`
- reusable service/data logic
- factory returning an object
- factory returning a constructor/function
- dynamic creation of similar objects
- factory injected into controllers
- Service vs Factory distinction

### Basic factory

```javascript
app.factory('DataFactory', function() {

    var service = {};
    var items = [];

    service.getItems = function() {
        return items;
    };

    service.addItem = function(item) {
        items.push(item);
    };

    service.removeItem = function(index) {
        items.splice(index, 1);
    };

    return service;
});
```

### Controller using factory

```javascript
app.controller('MainController', MainController);

MainController.$inject = ['$scope', 'DataFactory'];

function MainController($scope, DataFactory) {

    $scope.items = DataFactory.getItems();

    $scope.addItem = function(item) {
        DataFactory.addItem(item);
    };

    $scope.removeItem = function(index) {
        DataFactory.removeItem(index);
    };
}
```

### Factory returning a constructor/function

Use this pattern if it fits the existing application:

```javascript
app.factory('ShoppingListFactory', ShoppingListFactory);

function ShoppingListFactory() {

    var factory = function(maxItems) {
        return new ShoppingListService(maxItems);
    };

    return factory;
}

function ShoppingListService(maxItems) {

    var service = this;
    var items = [];

    service.addItem = function(itemName, quantity) {

        if (
            (maxItems === undefined) ||
            (maxItems !== undefined && items.length < maxItems)
        ) {
            var item = {
                name: itemName,
                quantity: quantity
            };

            items.push(item);
        }
        else {
            throw new Error(
                "Max items (" + maxItems + ") reached."
            );
        }
    };

    service.removeItem = function(itemIndex) {
        items.splice(itemIndex, 1);
    };

    service.getItems = function() {
        return items;
    };
}
```

Do not create a shopping-list demo if the existing application has a better repeated data feature. Adapt the concept to the existing feature.

---

# 4. CUSTOM DIRECTIVES

Implement:

- custom/user-defined directive
- directive registration
- directive factory function
- reusable directive
- `template`
- `templateUrl`
- custom HTML tag

AngularJS directives extend HTML and can provide new syntax/behavior.

### Three steps

1. Register the directive.
2. Define its factory function.
3. Use the custom tag in HTML.

### Directive using `template`

```javascript
app.directive('itemDescription', ItemDescription);

function ItemDescription() {

    var ddo = {
        template: '{{item.quantity}} of {{item.name}}'
    };

    return ddo;
}
```

### HTML

```html
<li ng-repeat="item in items">
    <item-description></item-description>
</li>
```

The directive must be used in a meaningful existing page.

### Directive using `templateUrl`

```javascript
app.directive('listItem', ListItem);

function ListItem() {

    var ddo = {
        templateUrl: 'listItem.html'
    };

    return ddo;
}
```

### `listItem.html`

```html
<li>
    <item-description></item-description>

    <button ng-click="list.removeItem($index)">
        Remove Item
    </button>
</li>
```

### Usage

```html
<ol>
    <list-item ng-repeat="item in list.items"></list-item>
</ol>
```

Use the existing project's equivalent data/list instead of introducing unnecessary demo data.

---

# 5. ANGULARJS ANIMATION

Add `ngAnimate` to the existing AngularJS application.

Library:

```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-animate.js"></script>
```

Existing module example:

```javascript
angular.module('myApp', [
    'ngAnimate'
]);
```

If other dependencies already exist:

```javascript
angular.module('myApp', [
    'ngRoute',
    'ngMessages',
    'ngAnimate'
]);
```

Do not remove existing dependencies.

---

# 6. NG-HIDE ANIMATION

Use an existing show/hide section where possible.

### HTML

```html
<input type="checkbox" ng-model="myCheck">

<div class="animated-box" ng-hide="myCheck"></div>
```

### CSS

```css
.animated-box {
    transition: all linear 0.2s;
    background-color: lightblue;
    height: 100px;
    width: 100%;
}

.animated-box.ng-hide {
    height: 0;
    width: 0;
    background-color: red;
}
```

---

# 7. NG-IF ENTER ANIMATION

### HTML

```html
<button ng-click="showRed = true">Show</button>
<button ng-click="showRed = false">Hide</button>

<p ng-if="showRed" class="red-bar"></p>
```

### CSS

```css
.red-bar {
    width: 425px;
    height: 30px;
    background: red;
}

.red-bar.ng-enter {
    transition: all ease-in 0.25s;
    height: 0;
}

.red-bar.ng-enter.ng-enter-active {
    height: 30px;
}
```

Apply this to an existing conditional element when possible.

---

# 8. NG-VIEW ANIMATION

If the existing project already uses AngularJS routing, animate its existing `ng-view`.

### HTML

```html
<div class="course-container">
    <div class="course-view" ng-view></div>
</div>
```

### CSS

```css
.course-container {
    position: relative;
    margin: 10px 20px;
}

.course-view.ng-animate {
    transition: all ease 0.4s;
    position: absolute;
}

.course-view.ng-enter {
    top: 200px;
    opacity: 2;
}

.course-view.ng-leave,
.course-view.ng-enter.ng-enter-active {
    top: 0;
    opacity: 1;
}

.course-view.ng-leave.ng-leave-active {
    top: -200px;
    opacity: 0;
}
```

Do not create duplicate routing.

If routing is not present, add `ngRoute` only when it can be integrated without breaking the current application.

---

# 9. NG-REPEAT ANIMATION

The PPT identifies three `ng-repeat` animation events:

### Enter

When a new item is added or an item is revealed after filtering.

### Leave

When an item is removed or filtered out.

### Move

When an adjacent item is filtered out and the concerned item needs to be reordered.

### Keyframe example

```css
@keyframes added {

    from {
        opacity: 0;
        top: -500px;
    }

    to {
        opacity: 1;
        top: 0;
    }
}

@keyframes deleted {

    from {
        top: 0;
        opacity: 1;
    }

    to {
        top: 200px;
        opacity: 0;
    }
}

.task-item.ng-enter {
    animation: 0.25s linear added;
}

.task-item.ng-leave {
    animation: 0.25s linear deleted;
}
```

### HTML

```html
<ul>
    <li
        class="task-item"
        ng-repeat="task in tasks">

        <span
            class="done"
            ng-click="removeItem($index)">
            X
        </span>

        <span>{{task.title}}</span>
    </li>
</ul>
```

Apply this to an existing repeated list such as products, users, comments, tasks or records when available.

---

# 10. NG-MODEL CSS STATES

For existing forms, demonstrate the AngularJS classes added by `ngModel`:

- `ng-valid` — model is valid
- `ng-invalid` — model is invalid
- `ng-valid-[key]` — valid key added by `$setValidity`
- `ng-invalid-[key]` — invalid key added by `$setValidity`
- `ng-pristine` — control has not been interacted with
- `ng-dirty` — control has been interacted with
- `ng-touched` — control has been blurred/touched
- `ng-untouched` — control has not been blurred
- `ng-pending` — `$asyncValidators` are unfulfilled

Also demonstrate:

- `ng-touched` — field has been touched
- `ng-pristine` — field has not been modified
- `ng-dirty` — field has been modified
- `ng-valid` — field content is valid

---

# 11. NGMESSAGES + NGANIMATE

If an existing form is available, use `ngMessages`.

### Library

```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-messages.min.js"></script>
```

### Module

```javascript
angular.module('app', [
    'ngMessages',
    'ngAnimate'
]);
```

Preserve all existing dependencies.

### Generic validation messages

```html
<script type="text/ng-template" id="generic-messages">

    <p ng-message="required" class="error-msg">
        This field is required.
    </p>

    <p ng-message="minlength" class="error-msg">
        This field is too short.
    </p>

    <p ng-message="maxlength" class="error-msg">
        This field is too long.
    </p>

</script>
```

### Username

```html
<label>Username (Using Dirty)</label>

<input
    type="text"
    name="username"
    ng-model="inputName"
    ng-minlength="6"
    ng-maxlength="12"
    ng-pattern="/^\w+$/"
    required>

<div
    ng-messages="formValidation.username.$error"
    ng-show="formValidation.username.$dirty">

    <p ng-message="pattern" class="error-msg">
        Username can only be alphanumeric with an optional underscore.
    </p>

    <p ng-message="maxlength" class="error-msg">
        Username cannot be longer than 12 characters.
    </p>

    <div ng-messages-include="generic-messages"></div>
</div>
```

### Password

```html
<label>Password (Using Touched)</label>

<input
    type="text"
    name="userPassword"
    ng-model="inputPassword"
    ng-minlength="6"
    ng-maxlength="12"
    required>

<div
    ng-messages="formValidation.userPassword.$error"
    ng-show="formValidation.userPassword.$touched">

    <div ng-messages-include="generic-messages"></div>
</div>
```

### Email

```html
<label>Email (Using Dirty)</label>

<input
    type="email"
    name="userEmail"
    ng-model="inputEmail"
    required>

<div
    ng-messages="formValidation.userEmail.$error"
    ng-show="formValidation.userEmail.$dirty">

    <p ng-message="required" class="error-msg">
        This field is required.
    </p>

    <p ng-message="email" class="error-msg">
        Please enter a valid email address.
    </p>
</div>
```

### Animated validation errors

```css
.error-msg.ng-enter {
    transition: 0.5s linear all;
    opacity: 0;
}

.error-msg.ng-enter.ng-enter-active {
    opacity: 1;
}
```

---

# 12. EXISTING PAGE MAPPING

Do not put everything into one unrelated page.

Map the concepts to the existing application:

| Existing area | Required concept |
|---|---|
| Existing controller page | Dependency Injection |
| Shared application logic | Service |
| Reusable data/object creation | Factory |
| Existing repeated list | Custom Directive |
| Reusable repeated item | Directive with `templateUrl` |
| Existing conditional content | `ng-if` animation |
| Existing show/hide content | `ng-hide` animation |
| Existing routed views | `ng-view` animation |
| Existing repeated records | `ng-repeat` enter/leave animation |
| Existing form | `ngModel` validation states |
| Existing validation | `ngMessages` + `ngAnimate` |
| Existing JS controllers | Minification-safe `$inject` |

If the application has several pages, distribute the concepts logically across those pages rather than making one large demo page.

---

# 13. REQUIRED CHECKLIST

Before finishing, verify that ALL of these are represented in the actual project:

- [ ] Dependency Injection
- [ ] Inversion of Control
- [ ] `$scope`
- [ ] Value component
- [ ] Service component
- [ ] Factory
- [ ] Provider/constant awareness from the PPT
- [ ] Factory injected into controller
- [ ] Factory returning an object
- [ ] Factory dynamically creating objects/functions
- [ ] Service vs Factory distinction
- [ ] Minification
- [ ] `$inject`
- [ ] Inline-array DI awareness
- [ ] Custom Directive
- [ ] Directive registration
- [ ] Directive factory function
- [ ] Reusable directive
- [ ] `template`
- [ ] `templateUrl`
- [ ] Custom HTML directive tag
- [ ] `ngAnimate`
- [ ] CSS/transition animation
- [ ] `ng-hide`
- [ ] `ng-if`
- [ ] `ng-view`
- [ ] `ng-repeat`
- [ ] enter
- [ ] leave
- [ ] move concept
- [ ] CSS keyframe animation
- [ ] `ngModel` states
- [ ] `ngMessages`
- [ ] required validation
- [ ] minlength validation
- [ ] maxlength validation
- [ ] pattern validation
- [ ] email validation
- [ ] dirty-based validation
- [ ] touched-based validation
- [ ] animated validation messages

---

# 14. IMPLEMENTATION ORDER

Follow this exact workflow:

### Step 1 — Inspect the project

Find the actual:

- AngularJS module
- controllers
- services
- factories
- directives
- routes
- views/pages
- CSS
- forms
- repeated lists

### Step 2 — Preserve the project

Do not remove existing functionality.

### Step 3 — Add libraries only if missing

```html
<script src="angular.min.js"></script>
<script src="angular-animate.js"></script>
<script src="angular-route.js"></script>
<script src="angular-messages.min.js"></script>
```

Only include the libraries actually needed.

### Step 4 — Update the existing AngularJS module

Example:

```javascript
angular.module('existingApp', [
    'ngAnimate',
    'ngRoute',
    'ngMessages'
]);
```

Keep existing dependencies.

### Step 5 — Add DI

Make controllers/services/factories minification-safe.

### Step 6 — Add Factory

Adapt the factory concept to existing application data.

### Step 7 — Add Custom Directive

Create a reusable directive and use it in an existing page.

### Step 8 — Add Animation

Apply `ngAnimate` to existing show/hide, conditional, routed and repeated content.

### Step 9 — Add form validation

Use `ngModel`, `ngMessages` and `ngAnimate` on an existing form.

### Step 10 — Test everything

Check:

- all pages load
- routing works
- existing functionality still works
- factory works
- directive renders
- animations work
- forms validate
- error messages animate
- no duplicate AngularJS modules exist
- no console errors exist

---

# 15. FINAL REPORT

After modifying the project, report:

1. Files changed
2. Dependency Injection implementation
3. Factory implementation
4. Custom Directive implementation
5. Animation implementation
6. `ngMessages` implementation
7. Minification-safe DI implementation
8. Which existing page demonstrates each concept
9. Libraries added
10. Any concept that could not be integrated and why

Do not claim something was implemented if it was not actually added.

---

# SOURCE BASIS

This instruction document is based on the four supplied PPTs:

- `3_Angular JS_dependency inj.pptx`
- `6_Angular JS - Factory.pptx`
- `8_Angular JS - Custom Directives.pptx`
- `9_ANGULAR JS - ANIMATION.pptx`

The purpose is to integrate the lecture concepts into the user's existing AngularJS project without omitting the required concepts.


---

# 16. SPECIAL INSTRUCTION FOR THIS PROJECT

The user specifically wants:

> **Do not remove or change the existing logic. Just change the existing Service to Factory and add the AngularJS concepts from the PPTs.**

Therefore, implementation priority is:

1. **Preserve every existing feature.**
2. **Convert the existing Service implementation to Factory without changing its behavior.**
3. **Keep the same service/factory injection name so existing controllers require minimal or no logic changes.**
4. **Add Dependency Injection/minification-safe `$inject`.**
5. **Add the Factory concept using the real existing application data.**
6. **Add a Custom Directive using an existing UI element/list.**
7. **Add `ngAnimate` to existing UI interactions.**
8. **Add `ng-if`, `ng-hide`, `ng-repeat`, and/or `ng-view` animations where they naturally fit existing pages.**
9. **Add `ngMessages` and validation animation to an existing form if the project has one.**
10. **Do not manufacture functionality simply to tick a checkbox.**
11. **Do not replace existing logic with the PPT's shopping-list/demo code.** The PPT code is a reference for the concept; adapt the concept to the real project.
12. **Do not remove existing services, controllers, routes, APIs, or data handling unless the service-to-factory conversion specifically requires changing only the service declaration.**

## Minimal-change example

If the existing project contains:

```javascript
app.service('UserService', function() {

    this.getUsers = function() {
        return users;
    };

    this.addUser = function(user) {
        users.push(user);
    };

});
```

change only the service implementation to:

```javascript
app.factory('UserService', function() {

    var service = {};

    service.getUsers = function() {
        return users;
    };

    service.addUser = function(user) {
        users.push(user);
    };

    return service;
});
```

Do NOT unnecessarily rewrite:

```javascript
UserController
```

or change:

```javascript
UserService.getUsers()
UserService.addUser()
```

The goal is a **minimal-impact migration from Service to Factory**, followed by adding the remaining PPT concepts around the existing application.
