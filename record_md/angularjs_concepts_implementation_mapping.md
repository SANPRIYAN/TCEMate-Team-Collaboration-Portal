# AngularJS Concepts Implementation Report & Mapping

**Project**: TCEMate Team Collaboration Portal  
**Framework**: AngularJS (v1.8.3)  
**Reference Instructions**: [angularjs_existing_project_implementation_instructions.md](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/angularjs_existing_project_implementation_instructions.md)  
**Target Codebase**: `d:/SANJAY BTECH IT STUDY/sem 5/web tech/Tcemate-angular/Tcemate/Team project`  

---

## Executive Summary

This document details where and how all required AngularJS concepts specified in [angularjs_existing_project_implementation_instructions.md](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/angularjs_existing_project_implementation_instructions.md) are integrated across the TCEMate application. In particular, this updated report highlights the **`ngAnimate` locations and enhanced animation suite** implemented across **all 11 pages**.

---

## 1. Locations of `ngAnimate` Across the Project

The `ngAnimate` system is wired into the application across three main layers:

### A. JavaScript Module Definition ([js/app.js:L4](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/js/app.js#L4))
The `ngAnimate` module is explicitly declared as a dependency of the main `tcemate` AngularJS application module:
```javascript
var app = angular.module('tcemate', ['ngAnimate', 'ngMessages']);
```

### B. HTML Library Script Imports (All 11 HTML Pages)
Every HTML file imports the official AngularJS animation library in its `<head>` section:
```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.3/angular-animate.min.js"></script>
```
**File Locations**:
1. [index.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/index.html#L9) (Dashboard)
2. [browse.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/browse.html#L9) (Browse Project Listings)
3. [create-listing.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/create-listing.html#L9) (Post Project Listing)
4. [manage-applicants.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/manage-applicants.html#L9) (Manage Applicants)
5. [my-interests.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/my-interests.html#L9) (My Interests)
6. [forum.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/forum.html#L9) (Discussion Forum)
7. [create-post.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/create-post.html#L9) (Create Forum Post)
8. [notifications.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/notifications.html#L9) (Alerts & Notifications)
9. [profile-view.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/profile-view.html#L9) (View Public Profile)
10. [profile.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/profile.html#L9) (Edit Profile)
11. [login.html:L9](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/login.html#L9) (Login & Register)

### C. Comprehensive Animation Stylesheet Rules ([style.css:L452-L614](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L452-L614))
The stylesheet defines CSS3 `@keyframes` and AngularJS `ngAnimate` lifecycle selectors:

#### 1. Keyframe Animations ([style.css:L456-L520](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L456-L520))
- `@keyframes ngEnterSlideUp`: Smooth 3D slide-up & scale-in for new items.
- `@keyframes ngLeaveSlideDown`: Smooth slide-down & fade-out for removed items.
- `@keyframes ngPopIn` & `@keyframes ngPopOut`: Elastic pop animations for conditional elements.
- `@keyframes ngFlipIn`: Perspective 3D flip effect for preview cards.
- `@keyframes ngPulseGlow`: Glow pulse effect on active tab button selection.

#### 2. `ng-repeat` List Animations & Stagger ([style.css:L522-L553](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L522-L553))
Applied to `.listing-card`, `.thread-card`, `.applicant-row`, `.interest-row`, `.notif-item`, `.stat-card`, `.portfolio-card`, `.skill-tag`, `.team-member`, `.timeline li`:
- `.ng-enter`: Plays `ngEnterSlideUp` animation when items appear or are revealed by filters.
- `.ng-leave`: Plays `ngLeaveSlideDown` animation when items are deleted (e.g. Rejecting an applicant).
- `.ng-move`: Smooth 0.35s cubic-bezier repositioning when list items are reordered.
- `.ng-enter-stagger`: 0.05s progressive delay so items animate sequentially on load.

#### 3. `ng-hide` & `ng-show` Visibility Animations ([style.css:L555-L596](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L555-L596))
- Controls smooth scale & opacity transitions when switching between Login and Signup modes ([login.html:L19](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/login.html#L19), [login.html:L47](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/login.html#L47)).

#### 4. `ng-if` Dynamic Element Animations ([style.css:L598-L612](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L598-L612))
- Flips live preview cards into view as users type titles or descriptions in [create-post.html:L55](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/create-post.html#L55) and [create-listing.html:L108](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/create-listing.html#L108).
- Fades preference alerts dynamically in [profile.html:L85](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/profile.html#L85).

#### 5. `ng-class` State Change Animations ([style.css:L614-L630](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L614-L630))
- `.notif-item.unread-remove-active`: Smoothly fades out unread indicator bars when "Mark All as Read" is clicked ([notifications.html:L31](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/notifications.html#L31)).
- `.tab-btn.active-add-active`: Triggers a pulse glow effect when switching active tabs in [my-interests.html:L30-L33](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/my-interests.html#L30-L33).

#### 6. `ngMessages` Validation Error Animations ([style.css:L632-L660](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css#L632-L660))
- Form validation error messages expand/collapse vertically with opacity transitions in all forms (`loginForm`, `signupForm`, `listingForm`, `postForm`, `profileForm`).

---

## 2. Page-by-Page `ngAnimate` Animation Summary Table

| Page Name | Animated Elements & Trigger Directives | Animation Behavior | CSS Rules / Keyframes |
| :--- | :--- | :--- | :--- |
| **1. Dashboard (`index.html`)** | `<stat-card-widget>` (`ng-repeat`), `<project-card-item>` (`ng-repeat`) | Staggered slide-up entry when dashboard metrics and recent projects load. | `.stat-card.ng-enter`, `.listing-card.ng-enter` |
| **2. Browse Projects (`browse.html`)** | `<project-card-item>` (`ng-repeat` with `filter`) | Cards dynamically slide in, fade out, or smoothly move position during live search and department filtering. | `.listing-card.ng-enter`, `.listing-card.ng-leave`, `.listing-card.ng-move` |
| **3. Create Listing (`create-listing.html`)** | `<listing-preview-card>` (`ng-if`), `ng-messages` validation errors | Live preview card flips in when typing. Form error messages slide open/closed. | `.preview-card.ng-enter`, `.error-msg.ng-enter` |
| **4. Manage Applicants (`manage-applicants.html`)** | `<applicant-row-card>` (`ng-repeat`), Team avatars (`ng-repeat`) | Clicking "Accept" or "Reject" animates the applicant row out with slide-down & scale reduction. | `.applicant-row.ng-leave`, `.team-member.ng-enter` |
| **5. My Interests (`my-interests.html`)** | Filter Tabs (`ng-class`), `<interest-row-item>` (`ng-repeat`) | Active tab pulse glow animation. Filtered interest rows smoothly enter and exit. | `.tab-btn.active-add-active`, `.interest-row.ng-enter` |
| **6. Forum (`forum.html`)** | `<forum-thread-card>` (`ng-repeat`) | Discussion threads slide up into view with staggered entry delays. | `.thread-card.ng-enter`, `.thread-card.ng-enter-stagger` |
| **7. Create Post (`create-post.html`)** | `<post-preview-card>` (`ng-if`), `ng-messages` validation errors | Draft post card 3D flips into place dynamically as title or body text is typed. | `.ng-if-fade.ng-enter`, `.error-msg.ng-enter` |
| **8. Notifications (`notifications.html`)** | `<notification-item-card>` (`ng-repeat`), Unread Status (`ng-class`) | Clicking "Mark all as read" smoothly transitions unread accent borders to read state. | `.notif-item.ng-enter`, `.notif-item.unread-remove` |
| **9. View Profile (`profile-view.html`)** | Timeline entries (`ng-repeat`), Portfolio cards (`ng-repeat`) | Academic timeline and portfolio project cards enter with slide-up transitions. | `.timeline li.ng-enter`, `.portfolio-card.ng-enter` |
| **10. Edit Profile (`profile.html`)** | `<skill-badge-list>` (`ng-repeat`), Preference alert (`ng-if`) | Skill tags pop into place. Toggling "Internships" checkbox smoothly reveals faculty alert. | `.skill-tag.ng-enter`, `.ng-if-fade.ng-enter` |
| **11. Login & Register (`login.html`)** | Login & Signup Forms (`ng-hide` / `ng-show`) | Toggling between Login and Sign Up triggers 3D scale and opacity transitions. | `.auth-card.ng-hide-add`, `.auth-card.ng-hide-remove` |

---

## 3. Mandatory Concept Summary Matrix

| Page File | Dependency Injection | Factory Conversion | Custom Directive | `ngAnimate` Enabled | `ngMessages` Validation | Minification-Safe (`$inject`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **index.html** | ✓ | `DataService`, `AuthService` | `<stat-card-widget>`, `<project-card-item>` | ✓ (Staggered list entry) | N/A | ✓ |
| **browse.html** | ✓ | `DataService`, `AuthService` | `<project-card-item>` | ✓ (Live filter enter/leave/move) | N/A | ✓ |
| **create-listing.html** | ✓ | `DataService`, `AuthService` | `<listing-preview-card>` | ✓ (Preview flip-in & error slide) | `listingForm` | ✓ |
| **manage-applicants.html** | ✓ | `DataService`, `AuthService` | `<applicant-row-card>` | ✓ (Applicant delete leave animation) | N/A | ✓ |
| **my-interests.html** | ✓ | `DataService`, `AuthService` | `<interest-row-item>` | ✓ (Tab active glow & filter transition) | N/A | ✓ |
| **forum.html** | ✓ | `DataService`, `AuthService` | `<forum-thread-card>` | ✓ (Staggered thread enter) | N/A | ✓ |
| **create-post.html** | ✓ | `DataService`, `AuthService` | `<post-preview-card>` | ✓ (Live post 3D preview flip) | `postForm` | ✓ |
| **notifications.html** | ✓ | `DataService`, `AuthService` | `<notification-item-card>` | ✓ (Unread class transition) | N/A | ✓ |
| **profile-view.html** | ✓ | `DataService`, `AuthService` | `<portfolio-project-card>` | ✓ (Timeline & card entry) | N/A | ✓ |
| **profile.html** | ✓ | `DataService`, `AuthService` | `<skill-badge-list>` | ✓ (Skill badge & preference alert) | `profileForm` | ✓ |
| **login.html** | ✓ | `AuthService` | `<auth-branding-header>` | ✓ (3D Form flip & toggle transition) | `loginForm`, `signupForm` | ✓ |

---

## 4. Primary Codebase File Links

- **Main Application Module & Directives**: [js/app.js](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/js/app.js)
- **Data Factory (`DataService`)**: [js/data.js](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/js/data.js)
- **Auth Factory (`AuthService`)**: [js/auth.js](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/js/auth.js)
- **Animation & Visual Stylesheet**: [style.css](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/Tcemate-angular/Tcemate/Team%20project/style.css)
